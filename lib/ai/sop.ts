import "server-only"

import { tanyaJson, tanyaTeks } from "@/lib/ai/client"
import { COURSE_MARKDOWN_FORMAT } from "@/lib/course-markdown"
import { ATURAN_SISTEM } from "@/lib/interactive-guide"

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

export type JenisPelajaran = "teks" | "cerita" | "simulasi"

export type ModulKerangka = {
  judul: string
  tujuan: string
  pelajaran: { judul: string; inti: string; jenis: JenisPelajaran }[]
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

/**
 * Bentuk modul baku (`docs/STANDAR-MODUL.md`).
 *
 * Diberikan ke tahap kerangka, bukan tahap penulisan: jenis tiap pelajaran
 * harus sudah diputuskan sebelum satu kalimat pun ditulis, karena jenisnya
 * menentukan cara menulisnya. Memutuskannya belakangan menghasilkan teks biasa
 * yang dipaksa jadi simulasi.
 */
const BENTUK_MODUL = [
  "JUMLAH MODUL MENGIKUTI ISI DOKUMEN, bukan jumlah subjudulnya.",
  "Satu modul wajib berisi MINIMAL TIGA pelajaran di luar kuis. Kalau bahannya",
  "tidak cukup untuk itu, kurangi jumlah modulnya dan gabungkan isinya --",
  "jangan membuat modul tipis berisi satu atau dua pelajaran.",
  "Dokumen pendek yang membahas satu topik cukup SATU modul.",
  "",
  "Tiap pelajaran diberi ruas \"jenis\", dan satu modul mengikuti bentuk ini:",
  "- \"teks\" untuk menjelaskan konsepnya. Satu modul punya satu sampai dua.",
  "- \"cerita\" untuk satu kejadian nyata yang memperlihatkan konsep itu bekerja",
  "  atau gagal. Satu modul punya paling banyak satu.",
  "- \"simulasi\" untuk satu hal yang harus DIKERJAKAN, bukan dihafal. Satu modul",
  "  punya paling banyak satu.",
  "Pelajaran kuis ditambahkan otomatis, jadi jangan memasukkannya ke kerangka.",
  "",
  "Pakai \"simulasi\" HANYA bila dokumen memuat tindakan yang punya pilihan dan",
  "akibat berbeda: memutuskan, memilih, menangani, melaporkan, memeriksa.",
  "Bila isinya hanya definisi, daftar, atau angka, pakai \"teks\" -- simulasi yang",
  "dipaksakan di atas bahan yang tidak punya pilihan akan terasa kosong.",
].join("\n")

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
              properties: {
                judul: { type: "string" },
                inti: { type: "string" },
                jenis: { type: "string", enum: ["teks", "cerita", "simulasi"] },
              },
              required: ["judul", "inti", "jenis"],
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
                  // Jatuh ke "teks" bila modelnya mengarang jenis lain: teks
                  // selalu bisa ditulis, sedangkan simulasi yang salah tempat
                  // menghasilkan pelajaran kosong.
                  const j = teks(po.jenis)
                  const jenis: JenisPelajaran =
                    j === "cerita" || j === "simulasi" ? j : "teks"
                  return judul ? { judul, inti: teks(po.inti), jenis } : null
                })
                .filter((p): p is { judul: string; inti: string; jenis: JenisPelajaran } => p !== null)
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

/**
 * Mengubah kerangka yang sudah ada atas permintaan penyusun.
 *
 * Inilah pintu masuk ide manusia. Sebelum ini kerangka hanya bisa diterima
 * atau dibuang, dan "periksa dulu sebelum menyimpan" kehilangan artinya --
 * memeriksa tanpa bisa mengubah bukan pemeriksaan, itu cuma pilihan terima
 * atau ulang dari awal.
 *
 * Dokumen aslinya tetap diikutkan, bukan hanya kerangkanya: permintaan
 * seperti "tambah modul tentang keselamatan kerja" hanya boleh dipenuhi
 * kalau bahannya memang ada di dokumen. Tanpa dokumen, model akan mengarang
 * modul yang isinya nanti tidak bisa ditulis.
 */
export async function revisiKerangka(sop: string, kerangka: KerangkaKursus, permintaan: string) {
  return tanyaJson<KerangkaKursus>(
    {
      sistem: SISTEM,
      skema: SKEMA_KERANGKA,
      maxOutputTokens: 2000,
      prompt: [
        "Berikut kerangka kursus yang sudah ada, dalam json:",
        JSON.stringify(kerangka),
        "",
        `Penyusun meminta perubahan ini: "${permintaan}"`,
        "",
        "Kembalikan kerangka LENGKAP yang sudah diubah, dalam format json yang sama.",
        "Bagian yang tidak diminta berubah harus tetap sama persis, termasuk judulnya.",
        `Tetap maksimal ${MAKS_MODUL} modul dan ${MAKS_PELAJARAN} pelajaran per modul.`,
        /*
         * Dua jenis permintaan yang harus dibedakan, dan sebelumnya tidak.
         *
         * Versi pertama cuma berkata "bila tidak bisa dipenuhi dari dokumen,
         * kembalikan apa adanya". Diukur: "hapus modul terakhir" dipatuhi,
         * tetapi "gabungkan dua modul terakhir" tidak -- model memperlakukan
         * penataan ulang seolah ia memerlukan bahan baru. Padahal menggabung,
         * memecah, mengurutkan ulang, dan mengganti judul hanya menyusun
         * ulang isi yang sudah ada; yang benar-benar perlu bahan baru hanya
         * penambahan topik.
         */
        "Menggabungkan, memecah, mengurutkan ulang, mengganti judul, dan menghapus",
        "SELALU bisa dilakukan -- semuanya hanya menata ulang isi yang sudah ada.",
        "Hanya penambahan TOPIK BARU yang memerlukan bahannya ada di dokumen.",
        "Bila topik yang diminta tidak ada di dokumen, kembalikan kerangka apa adanya.",
        "",
        "--- DOKUMEN ---",
        sop.slice(0, MAKS_HURUF_SOP),
      ].join("\n"),
    },
    periksaKerangka
  )
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
        "",
        BENTUK_MODUL,
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
 * Jumlah soalnya DIMINTA tiga, tetapi tidak dijamin tiga. Modul yang sama
 * pernah menghasilkan satu soal pada satu panggilan dan tiga pada panggilan
 * berikutnya, tanpa pemotongan token -- itu ragam keluaran model, bukan
 * kesalahan yang bisa ditutup di sini.
 *
 * Mempertegas kalimatnya ("WAJIB tepat 3, tidak boleh kurang") sudah dicoba
 * dan diukur: hasilnya 12 soal, dari 14 pada kalimat yang lebih tenang.
 * Tidak membantu, jadi tidak disimpan. Mencoba ulang otomatis juga tidak
 * dilakukan -- biayanya berlipat untuk perbaikan yang tidak pasti.
 *
 * Yang dilakukan sebagai gantinya adalah jujur: laporan di layar menyebut
 * jumlah soal yang benar-benar jadi, dan penyusun menambah sendiri di editor
 * bila kurang.
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
  const daftarPelajaran = modul.pelajaran
    .map((p, i) => `${i + 1}. [${p.jenis}] ${p.judul} -- ${p.inti}`)
    .join("\n")

  const hasil = await tanyaTeks({
    sistem: SISTEM,
    maxOutputTokens: 4200,
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
      "<isi pelajaran>",
      "",
      "Tiap pelajaran ditandai jenisnya di daftar bawah. Cara menulisnya berbeda:",
      "",
      "[teks] -- 3 sampai 6 paragraf pendek yang menjelaskan konsepnya. Tulis",
      "  \"tipe: teks\". Boleh memakai subjudul dengan satu pagar dan daftar berpoin.",
      "  Mulai dengan satu paragraf yang menjawab \"kenapa ini penting bagi saya\".",
      "",
      "[cerita] -- satu kejadian yang bisa dibayangkan, dengan orang, tempat, dan",
      "  waktu yang jelas. Tulis \"tipe: teks\" juga. Tunjukkan keputusannya diambil",
      "  bagaimana dan akibatnya apa, lalu tutup dengan menghubungkannya kembali ke",
      "  konsep di pelajaran sebelumnya. Nama orang dan perusahaan dibuat-buat, dan",
      "  sebutkan itu di kalimat terakhir.",
      "",
      "[simulasi] -- JANGAN ditulis isinya. Tulis HANYA kepalanya, persis begini:",
      "",
      "### Pelajaran: <judul pelajaran>",
      "tipe: interaktif",
      "durasi: <angka> menit",
      "",
      "<!--SIMULASI-->",
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

  /*
   * Balasan yang terpotong batas token berhenti di tengah kalimat, dan yang
   * terpotong hampir selalu soal terakhir -- karena soal ditulis paling
   * belakang. Soal setengah jadi (pertanyaan tanpa pilihan, atau pilihan
   * tanpa kunci) akan ditolak `validateQuizzes` saat penyusun menekan
   * Simpan, jauh dari sini, dengan pesan yang tidak menyebut sebabnya.
   *
   * Jadi ekornya dipangkas di sini: lebih baik modul dengan dua soal utuh
   * daripada tiga soal yang satu di antaranya rusak.
   */
  const rapi = hasil.terpotong ? buangSoalTakUtuh(bersih) : bersih

  const simulasi = await isiSimulasi(sop, kerangka, modul, acakOpsi(rapi))
  return { ok: true, data: simulasi.markdown, token: hasil.token + simulasi.token }
}

/**
 * Mengisi tiap penanda `<!--SIMULASI-->` dengan satu panggilan tersendiri.
 *
 * Bukan ditulis bersama modulnya, karena tidak muat. Satu simulasi berukuran
 * enam sampai tiga belas kilobita HTML -- dua sampai empat ribu token sendiri
 * -- sedangkan satu modul dijatah 4.200 token untuk SELURUH isinya. Digabung,
 * yang terpotong adalah simulasinya, dan HTML yang terpotong di tengah tidak
 * menyisakan apa pun yang bisa diselamatkan.
 *
 * Kegagalan satu simulasi tidak menggagalkan modulnya: penandanya diganti
 * kalimat yang memberi tahu penyusun, dan pelajarannya tetap ada untuk diisi
 * sendiri. Modul tanpa satu pelajaran lebih buruk daripada modul dengan satu
 * pelajaran yang perlu dikerjakan tangan.
 */
async function isiSimulasi(
  sop: string,
  kerangka: KerangkaKursus,
  modul: ModulKerangka,
  markdown: string
): Promise<{ markdown: string; token: number }> {
  if (!markdown.includes(PENANDA_SIMULASI)) return { markdown, token: 0 }

  const daftar = modul.pelajaran.filter((p) => p.jenis === "simulasi")
  let keluar = markdown
  let token = 0

  for (const pelajaran of daftar) {
    if (!keluar.includes(PENANDA_SIMULASI)) break
    const hasil = await tanyaTeks({
      sistem: SISTEM,
      maxOutputTokens: 4000,
      prompt: promptSimulasi(sop, kerangka, modul, pelajaran),
    })
    token += hasil.ok ? hasil.token : 0

    const html = hasil.ok ? rapikanHtml(hasil.data) : ""
    keluar = keluar.replace(
      PENANDA_SIMULASI,
      html
        ? ["```html", html, "```"].join("\n")
        : "Simulasi untuk pelajaran ini belum terbentuk. Susun sendiri di penyunting."
    )
  }

  // Penanda yang tersisa -- misalnya model menulis lebih banyak dari yang ada
  // di kerangka -- tidak boleh ikut terbaca sebagai isi pelajaran.
  return { markdown: keluar.split(PENANDA_SIMULASI).join(""), token }
}

const PENANDA_SIMULASI = "<!--SIMULASI-->"

/**
 * Mengambil HTML dari balasan model.
 *
 * Blok kodenya DICARI di mana pun ia berada, bukan hanya dipangkas dari ujung.
 * Perintahnya sudah menyuruh "tanpa penjelasan apa pun", dan modelnya tetap
 * kadang menambahkan satu paragraf sesudah pagar penutup. Versi pertama
 * memangkas ujung saja, jadi balasan seperti itu tidak berakhir dengan tanda
 * `>` dan DITOLAK seluruhnya -- simulasinya hilang padahal HTML-nya utuh.
 *
 * Yang benar-benar terpotong tetap dibuang: `bersihkanMateriInteraktif` akan
 * menambal tag yang menggantung menjadi markah aneh yang tampil berantakan ke
 * peserta, dan itu lebih buruk daripada pelajaran kosong yang jelas.
 */
function rapikanHtml(teksAsli: string): string {
  const blok = /```(?:html)?\s*\n([\s\S]*?)\n?```/i.exec(teksAsli)
  const t = (blok ? blok[1] : teksAsli).trim()
  return t.endsWith(">") ? t : ""
}

function promptSimulasi(
  sop: string,
  kerangka: KerangkaKursus,
  modul: ModulKerangka,
  pelajaran: { judul: string; inti: string }
): string {
  return [
    `Kursus: "${kerangka.judul}". Modul: "${modul.judul}".`,
    `Buat satu simulasi untuk pelajaran "${pelajaran.judul}".`,
    `Yang harus bisa dilakukan peserta sesudahnya: ${pelajaran.inti}`,
    "",
    "Keluarkan HANYA satu berkas HTML, tanpa penjelasan apa pun sebelum atau sesudahnya.",
    "",
    "BENTUKNYA:",
    "- Mulai dengan <h2> judul, lalu satu kotak tugas berisi perintah yang jelas.",
    "  Contoh: \"Anda petugas gudang. Barang ini baru datang. Lakukan apa yang akan",
    "  Anda lakukan sungguhan.\"",
    "- Buat tiruan layar atau formulir yang relevan dengan dokumen.",
    "- Beri 3 sampai 4 tindakan sebagai radio dengan name yang sama. Tiap tindakan",
    "  mengganti isi layar DAN memunculkan akibat yang berbeda.",
    "- Akibat DICERITAKAN, bukan dinilai: tulis apa yang terjadi berikutnya, bukan",
    "  \"benar\" atau \"salah\".",
    "- Sediakan satu radio tambahan bertanda checked untuk \"Ulangi dari awal\".",
    "- Tambahkan 2 sampai 3 varian situasi sebagai radio terpisah. Tiap varian harus",
    "  mengubah KEPUTUSANNYA: hilangkan satu tanda yang tadinya menolong, atau tutup",
    "  salah satu jalan keluar. Kalau tindakan yang menyelamatkan tetap sama di semua",
    "  varian, variannya tidak berguna dan lebih baik tidak ada.",
    "",
    "CARANYA, karena JavaScript tidak dijalankan sama sekali:",
    "- Semua interaksi memakai radio, checkbox, dan selector CSS.",
    "- Pakai :has() pada wadahnya, misalnya .sim:has(#t1:checked) .akibat-t1 { display: block }.",
    "- JANGAN memakai selector saudara ~ untuk menghubungkan radio dengan akibatnya",
    "  kalau keduanya tidak bersaudara langsung; selectornya tetap sah tetapi tidak",
    "  mengenai apa pun.",
    "- SETIAP kelas yang disebut di dalam <style> WAJIB benar-benar ada di markahnya.",
    "  Aturan yang menunjuk kelas yang tidak pernah ditulis tidak menimbulkan galat",
    "  apa pun -- tombolnya tetap bisa ditekan dan tidak mengubah apa-apa. Sebelum",
    "  selesai, periksa ulang satu per satu.",
    "",
    "CONTOH POLA YANG BENAR, tiru bentuknya:",
    "",
    "<style>",
    ".sim .akibat { display: none }",
    ".sim:has(#t1:checked) .akibat-t1 { display: block }",
    ".sim:has(#v2:checked) .hanya-v1 { display: none }",
    ".sim:has(#v2:checked) .hanya-v2 { display: block }",
    "</style>",
    "<div class=\"sim\">",
    "  <p class=\"hanya-v1\">Keterangan yang ada di situasi biasa</p>",
    "  <p class=\"hanya-v2\">Keterangan pengganti di situasi kedua</p>",
    "  <input type=\"radio\" name=\"t\" id=\"t1\"><label for=\"t1\">Tindakan pertama</label>",
    "  <div class=\"akibat akibat-t1\">Yang terjadi berikutnya.</div>",
    "</div>",
    "",
    "YANG DILARANG, karena akan dibuang sistem:",
    ...ATURAN_SISTEM.map((a) => `- ${a.aturan}. ${a.kenapa}`),
    "- Atribut style sebaris. Pakai <style> di atas, selectornya akan dilingkupi sendiri.",
    "",
    "WARNA -- pakai HANYA daftar ini, semuanya sudah diukur cukup kontras:",
    "- teks utama #14252a",
    "- teks samar #566a70 (jangan lebih terang dari ini)",
    "- garis dan batas #d6e2e5",
    "- latar lembut #f4f7f8, aksen #13707f",
    "- akibat baik #0f5c3f, akibat buruk #8a2b2b",
    "JANGAN memakai abu-abu seperti #777, #888, atau #999 untuk teks. Semuanya",
    "gagal ambang kontras 4.5:1 dan ditolak pemeriksaan aksesibilitas.",
    "",
    "AKSESIBILITAS: mulai judul dari <h2>, tiap kotak pilihan dibungkus <label>,",
    "tiap tabel punya <th>, tiap gambar punya alt, dan harus terbaca di layar 320 piksel.",
    "",
    "Bahasa Indonesia, kalimat pendek, sapaan \"Anda\". Nama orang dan perusahaan",
    "dibuat-buat. Hanya memakai isi dokumen di bawah.",
    "",
    "--- DOKUMEN ---",
    sop.slice(0, MAKS_HURUF_SOP),
  ].join("\n")
}

/**
 * Membuang blok "#### Soal" terakhir bila ia tidak utuh.
 *
 * Utuh berarti: ada teks pertanyaan, minimal dua pilihan, dan tepat satu
 * pilihan bertanda `[x]`. Itu aturan yang sama dengan `validateQuizzes`,
 * ditegakkan lebih awal supaya penyusun tidak menemukannya saat menyimpan.
 */
export function buangSoalTakUtuh(markdown: string): string {
  const potongan = markdown.split(/^#### Soal\s*$/m)
  if (potongan.length < 2) return markdown.trimEnd()

  const terakhir = potongan[potongan.length - 1]
  const pilihan = terakhir.match(/^- \[[x ]\].*$/gim) ?? []
  const kunci = pilihan.filter((b) => /^- \[x\]/i.test(b)).length
  const adaPertanyaan = terakhir.split("\n").some((b) => b.trim() && !/^[->#]/.test(b.trim()))

  if (adaPertanyaan && pilihan.length >= 2 && kunci === 1) return markdown.trimEnd()

  return potongan.slice(0, -1).join("#### Soal").trimEnd()
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
