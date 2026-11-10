import "server-only"

import { tanyaJson, tanyaTeks } from "@/lib/ai/client"
import { COURSE_MARKDOWN_FORMAT } from "@/lib/course-markdown"

/**
 * Dari dokumen apa pun menjadi draf kursus (F1).
 *
 * Dinamai `sop` karena lahir dari kebutuhan mengubah SOP perusahaan menjadi
 * pelatihan, tetapi sejak 2026-11-10 janjinya lebih luas: panduan produk,
 * peraturan, materi kelas, apa pun yang berisi teks. Nama berkas dan bucket
 * dibiarkan -- keduanya pengenal internal yang tidak pernah dilihat siapa
 * pun, dan menggantinya berarti memindahkan objek di Storage demi kosmetik.
 *
 * == Dua tahap, bukan satu ==
 *
 * Satu panggilan "ubah dokumen ini jadi kursus lengkap" menghasilkan keluaran
 * panjang yang terpotong di tengah, dan ketika terpotong tidak ada bagian
 * yang bisa diselamatkan. Dua tahap -- kerangka dulu, lalu isi per modul --
 * membuat setiap panggilan pendek, membuat kegagalan terbatas pada satu
 * modul, dan membuat kerangkanya bisa diperlihatkan ke mentor sebelum biaya
 * penulisan dikeluarkan.
 *
 * == Keluarannya Markdown, bukan baris basis data ==
 *
 * Hasil akhir fungsi ini adalah berkas `.md` berformat sanggabiz-course/v1,
 * yang lalu dibaca `parseCourseMarkdown()` seperti berkas yang diketik
 * manusia. Tidak ada jalur tulis baru: pagar impor yang sudah ada -- tidak
 * pernah menyimpan sendiri, ditolak bila kursusnya sudah punya peserta, isi
 * tetap disanitasi -- berlaku apa adanya untuk keluaran model.
 * Lihat docs/STANDAR-IMPOR-KURSUS.md §8.
 */

export type ModulKerangka = {
  judul: string
  tujuan: string
  pelajaran: { judul: string; inti: string }[]
}

export type KerangkaKursus = {
  judul: string
  deskripsi: string
  tingkat: "Pemula" | "Menengah" | "Lanjutan"
  persyaratan: string[]
  untukSiapa: string[]
  modul: ModulKerangka[]
}

/** Batas yang dipilih supaya satu panggilan tetap pendek dan murah. */
const MAKS_MODUL = 6
const MAKS_PELAJARAN = 5
/** Potong dokumen yang sangat panjang. Lebih baik kerangka dari 40 ribu huruf
 *  pertama daripada panggilan yang ditolak karena kepanjangan. */
const MAKS_HURUF_SOP = 40_000

/*
 * Tidak lagi menyebut "pelatihan kerja".
 *
 * Selama fiturnya bernama "Susun dari SOP", mengandaikan dokumennya prosedur
 * kerja itu tepat. Begitu janjinya menjadi "dokumen apa pun", andaian itu
 * menyempitkan hasil tanpa ketahuan: buku panduan produk, peraturan, atau
 * materi kelas dipaksa berbunyi seperti pelatihan karyawan. Yang tersisa
 * adalah aturan yang berlaku untuk dokumen apa pun -- jangan mengarang.
 */
const SISTEM =
  "Anda penyusun materi belajar berbahasa Indonesia. " +
  "Anda hanya memakai isi dokumen yang diberikan. " +
  "Anda tidak menambahkan prosedur, angka, nama sistem, atau nama orang yang tidak ada di dokumen. " +
  "Bila dokumen tidak menyebut sesuatu, Anda menghilangkannya, bukan mengarangnya."

const SKEMA_KERANGKA = {
  type: "object",
  properties: {
    judul: { type: "string" },
    deskripsi: { type: "string" },
    tingkat: { type: "string", enum: ["Pemula", "Menengah", "Lanjutan"] },
    persyaratan: { type: "array", items: { type: "string" } },
    untukSiapa: { type: "array", items: { type: "string" } },
    modul: {
      type: "array",
      items: {
        type: "object",
        properties: {
          judul: { type: "string" },
          tujuan: { type: "string" },
          pelajaran: {
            type: "array",
            items: {
              type: "object",
              properties: { judul: { type: "string" }, inti: { type: "string" } },
              required: ["judul", "inti"],
            },
          },
        },
        required: ["judul", "tujuan", "pelajaran"],
      },
    },
  },
  required: ["judul", "deskripsi", "tingkat", "modul"],
}

function teks(nilai: unknown): string {
  return typeof nilai === "string" ? nilai.trim() : ""
}

function daftarTeks(nilai: unknown, maks: number): string[] {
  if (!Array.isArray(nilai)) return []
  return nilai.map(teks).filter(Boolean).slice(0, maks)
}

/**
 * Memeriksa bentuk kerangka dari model.
 *
 * Mengembalikan null -- bukan kerangka setengah jadi -- bila tidak ada satu
 * pun modul berisi pelajaran. Kerangka kosong yang lolos ke layar akan
 * terlihat seperti fitur yang rusak, dan mentor tidak punya cara tahu apakah
 * dokumennya yang kurang atau modelnya yang gagal.
 */
export function periksaKerangka(nilai: unknown): KerangkaKursus | null {
  if (!nilai || typeof nilai !== "object") return null
  const o = nilai as Record<string, unknown>

  const tingkatMentah = teks(o.tingkat)
  const tingkat: KerangkaKursus["tingkat"] =
    tingkatMentah === "Menengah" || tingkatMentah === "Lanjutan" ? tingkatMentah : "Pemula"

  const modul: ModulKerangka[] = Array.isArray(o.modul)
    ? o.modul
        .map((m) => {
          if (!m || typeof m !== "object") return null
          const mo = m as Record<string, unknown>
          const pelajaran = Array.isArray(mo.pelajaran)
            ? mo.pelajaran
                .map((p) => {
                  if (!p || typeof p !== "object") return null
                  const po = p as Record<string, unknown>
                  const judul = teks(po.judul)
                  return judul ? { judul, inti: teks(po.inti) } : null
                })
                .filter((p): p is { judul: string; inti: string } => p !== null)
                .slice(0, MAKS_PELAJARAN)
            : []
          const judul = teks(mo.judul)
          return judul && pelajaran.length > 0 ? { judul, tujuan: teks(mo.tujuan), pelajaran } : null
        })
        .filter((m): m is ModulKerangka => m !== null)
        .slice(0, MAKS_MODUL)
    : []

  if (modul.length === 0) return null

  const judul = teks(o.judul)
  if (!judul) return null

  return {
    judul,
    deskripsi: teks(o.deskripsi),
    tingkat,
    persyaratan: daftarTeks(o.persyaratan, 8),
    untukSiapa: daftarTeks(o.untukSiapa, 8),
    modul,
  }
}

/** Tahap 1: kerangka kursus dari teks dokumen. */
export async function buatKerangka(sop: string, namaBerkas: string) {
  const potongan = sop.slice(0, MAKS_HURUF_SOP)
  return tanyaJson<KerangkaKursus>(
    {
      sistem: SISTEM,
      skema: SKEMA_KERANGKA,
      maxOutputTokens: 2000,
      prompt: [
        `Dokumen berikut berjudul "${namaBerkas}".`,
        `Susun kerangka kursus dari isinya: maksimal ${MAKS_MODUL} modul,`,
        `maksimal ${MAKS_PELAJARAN} pelajaran per modul.`,
        "Judul pelajaran menyebut hal yang dikerjakan, bukan \"Pengantar\" atau \"Penutup\".",
        "Ruas \"inti\" berisi satu kalimat tentang apa yang harus bisa dilakukan peserta setelah pelajaran itu.",
        "Jawab dalam format json.",
        "",
        "--- DOKUMEN ---",
        potongan,
      ].join("\n"),
    },
    periksaKerangka
  )
}

/**
 * Tahap 2: isi satu modul, langsung dalam potongan Markdown yang sah.
 *
 * Model menulis Markdown, bukan JSON, karena bentuk akhirnya memang Markdown
 * -- menyuruhnya mengisi JSON lalu merakit ulang menambah satu tahap yang
 * bisa salah tanpa menambah jaminan apa pun; `parseCourseMarkdown` tetap
 * memeriksa hasilnya dan tidak pernah melempar.
 */
export async function tulisModul(
  sop: string,
  kerangka: KerangkaKursus,
  modul: ModulKerangka
): Promise<{ ok: true; data: string; token: number } | { ok: false; error: string }> {
  const daftarPelajaran = modul.pelajaran.map((p, i) => `${i + 1}. ${p.judul} -- ${p.inti}`).join("\n")

  const hasil = await tanyaTeks({
    sistem: SISTEM,
    maxOutputTokens: 3000,
    prompt: [
      `Kursus: "${kerangka.judul}". Modul: "${modul.judul}" (${modul.tujuan}).`,
      "Tulis isi modul ini dalam Markdown, PERSIS dengan bentuk berikut dan tanpa teks lain:",
      "",
      `## Modul: ${modul.judul}`,
      "",
      "### Pelajaran: <judul pelajaran>",
      "tipe: teks",
      "durasi: <angka> menit",
      "",
      "<isi pelajaran, 3-6 paragraf pendek, boleh memakai daftar berpoin>",
      "",
      "Pelajaran yang harus ditulis, berurutan:",
      daftarPelajaran,
      "",
      "Setelah pelajaran terakhir, tambahkan satu pelajaran kuis dengan bentuk:",
      "",
      "### Pelajaran: Kuis <judul modul>",
      "tipe: kuis",
      "nilai_lulus: 70",
      "",
      "#### Soal",
      "",
      "<pertanyaan>",
      "",
      "- [x] <jawaban benar>",
      "- [ ] <jawaban salah>",
      "- [ ] <jawaban salah>",
      "",
      "> Penjelasan: <satu kalimat kenapa jawabannya itu>",
      "",
      "Buat 3 soal pilihan ganda, masing-masing tepat satu jawaban benar.",
      "Seluruh isi harus bersumber dari dokumen di bawah.",
      "",
      "--- DOKUMEN ---",
      sop.slice(0, MAKS_HURUF_SOP),
    ].join("\n"),
  })

  if (!hasil.ok) return hasil

  // Model kadang membungkus jawabannya dalam pagar kode; dibuang di sini
  // supaya `parseCourseMarkdown` tidak melihat baris ``` sebagai isi.
  const bersih = hasil.data
    .replace(/^\s*```(?:markdown|md)?\s*\n/i, "")
    .replace(/\n```\s*$/i, "")
    .trim()

  if (!/^##\s*Modul:/m.test(bersih)) {
    return { ok: false, error: `Modul "${modul.judul}" tidak ditulis dalam bentuk yang benar.` }
  }

  return { ok: true, data: acakOpsi(bersih), token: hasil.token }
}

/**
 * Mengacak urutan pilihan jawaban pada tiap soal.
 *
 * Bukan hiasan. Contoh bentuk di prompt menulis `- [x] <jawaban benar>` pada
 * baris pertama, dan model menyalin posisinya: pada percobaan pertama fitur
 * ini, 18 dari 18 soal berkunci pilihan pertama. Kuis seperti itu bisa
 * dilewati tanpa membaca soalnya.
 *
 * Diperbaiki di sini, bukan dengan meminta model "variasikan posisinya" --
 * permintaan seperti itu kadang dipatuhi, dan "kadang" bukan jaminan. Juga
 * bukan dengan mengandalkan pengacakan saat kuis dimainkan: yang dibaca,
 * disunting, dan diekspor mentor adalah urutan yang tertulis di sini, dan
 * 18 kunci berurutan di satu kolom membuat kursusnya pantas dicurigai.
 */
export function acakOpsi(markdown: string, acak: () => number = Math.random): string {
  const baris = markdown.split("\n")
  const keluar: string[] = []
  let i = 0

  while (i < baris.length) {
    if (!/^- \[[x ]\]/i.test(baris[i])) {
      keluar.push(baris[i])
      i++
      continue
    }
    // Satu blok pilihan: baris berurutan yang semuanya "- [ ]" atau "- [x]".
    const blok: string[] = []
    while (i < baris.length && /^- \[[x ]\]/i.test(baris[i])) {
      blok.push(baris[i])
      i++
    }
    for (let j = blok.length - 1; j > 0; j--) {
      const k = Math.floor(acak() * (j + 1))
      ;[blok[j], blok[k]] = [blok[k], blok[j]]
    }
    keluar.push(...blok)
  }

  return keluar.join("\n")
}

/** Merakit frontmatter + bagian kursus + seluruh modul menjadi satu berkas. */
export function rakitMarkdown(kerangka: KerangkaKursus, modulMarkdown: string[]): string {
  const out: string[] = []
  out.push("---")
  out.push(`format: ${COURSE_MARKDOWN_FORMAT}`)
  out.push(`judul: ${kerangka.judul}`)
  out.push(`tingkat: ${kerangka.tingkat}`)
  out.push("nilai_kelulusan: 70")
  out.push("---", "")
  out.push("## Deskripsi", "", kerangka.deskripsi || kerangka.judul, "")

  if (kerangka.persyaratan.length > 0) {
    out.push("## Persyaratan", "")
    for (const b of kerangka.persyaratan) out.push(`- ${b}`)
    out.push("")
  }
  if (kerangka.untukSiapa.length > 0) {
    out.push("## Untuk siapa", "")
    for (const b of kerangka.untukSiapa) out.push(`- ${b}`)
    out.push("")
  }

  for (const m of modulMarkdown) out.push(m, "")

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n"
}
