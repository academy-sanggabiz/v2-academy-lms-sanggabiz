import "server-only"

import { modelAi, tanyaTeks, type HasilAi } from "@/lib/ai/client"

/**
 * Asisten AI di pemutar pelajaran (F4).
 *
 * **Menjawab dari materi, bukan dari pengetahuan umum.** Konteksnya hanya tiga
 * hal: isi teks pelajaran yang sedang dibuka, transkripnya bila ada, dan judul
 * modul serta pelajaran di kursus itu. Pertanyaan di luar itu ditolak dengan
 * sopan -- bukan karena model tidak tahu jawabannya, tetapi karena asisten
 * yang menjawab apa saja berhenti bisa dipercaya sebagai asisten MATERI INI.
 *
 * **Pelajaran kuis dan studi kasus tidak punya asisten sama sekali.** Yang
 * diputuskan di pemanggil, bukan di sini: membantu menjawab penilaian adalah
 * hal lain dari membantu memahami bacaan.
 *
 * **Catatan saya tidak pernah masuk prompt.** `lesson_notes` privat secara
 * rancangan dan tidak punya policy baca pengelola; mengirimkannya ke model
 * akan menembus jaminan itu lewat pintu belakang.
 */

/** Mengubah HTML Tiptap jadi teks biasa. */
export function keTeks(html: string | null | undefined): string {
  if (!html) return ""
  return html
    /*
      `<style>` dan `<script>` dibuang BERIKUT isinya, bukan hanya tagnya.
      Materi interaktif menyimpan CSS penulis sebagai `<style>` di dalam
      `lessons.content`; tanpa baris ini seluruh CSS itu ikut terbaca sebagai
      "isi pelajaran" -- masuk ke pengetahuan chatbot dan ke bahan terjemahan
      sebagai ratusan baris `.materi-interaktif .kartu{...}`. `<script>` sudah
      tidak pernah tersimpan, tetapi dibuang juga di sini karena fungsi ini
      juga dipakai untuk isi yang datang dari jalan lain.
    */
    .replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    // Blok yang berakhir dipisah baris baru, supaya kalimat tidak menempel.
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export type KonteksPelajaran = {
  courseTitle: string
  lessonTitle: string
  /** Isi pelajaran, sudah jadi teks biasa. */
  content: string
  transcript: string
  /** Judul modul dan pelajaran lain, untuk menjawab "ada di pelajaran mana". */
  outline: string[]
}

/**
 * Batas panjang konteks.
 *
 * Pelajaran di LMS ini pendek (5-7 menit per pelajaran, sesuai standar
 * penulisan), jadi tidak perlu basis data vektor untuk MVP. Pemotongan di sini
 * adalah jaring pengaman untuk pelajaran panjang yang sudah terlanjur ada --
 * bukan cara kerja normalnya.
 */
const BATAS_AKSARA = 12_000

const SISTEM = `Anda asisten belajar yang HANYA menjawab dari materi yang diberikan.

Aturan yang tidak boleh dilanggar:
- Jawab hanya dari "ISI PELAJARAN", "TRANSKRIP", dan "DAFTAR ISI KURSUS" di bawah.
- Bila jawabannya tidak ada di materi itu, katakan terus terang bahwa materi
  ini tidak membahasnya, lalu sebutkan judul pelajaran lain di daftar isi yang
  mungkin membahasnya. Jangan menjawab dari pengetahuan umum.
- Jangan mengarang nama, angka, atau kutipan yang tidak ada di materi.
- Jangan memberi jawaban soal kuis atau penilaian.
- Bahasa sederhana, sapaan "Anda", tanpa tanda seru dan tanpa emoji.
- Jawaban maksimal empat kalimat, kecuali diminta merinci.`

function susunKonteks(k: KonteksPelajaran): string {
  const isi = k.content.slice(0, BATAS_AKSARA)
  const transkrip = k.transcript.slice(0, BATAS_AKSARA)
  return [
    `KURSUS: ${k.courseTitle}`,
    `PELAJARAN YANG SEDANG DIBUKA: ${k.lessonTitle}`,
    "",
    "ISI PELAJARAN:",
    isi || "(pelajaran ini tidak punya teks; mungkin video atau slide)",
    "",
    transkrip ? `TRANSKRIP:\n${transkrip}` : "TRANSKRIP: (tidak ada)",
    "",
    "DAFTAR ISI KURSUS:",
    k.outline.map((j) => `- ${j}`).join("\n"),
  ].join("\n")
}

/**
 * Menjawab satu pertanyaan.
 *
 * Riwayat percakapan diikutkan apa adanya dan dibatasi beberapa giliran
 * terakhir: percakapan panjang tentang satu pelajaran pendek hampir selalu
 * berputar pada hal yang sama, dan mengirim seluruhnya hanya menambah token.
 */
export async function jawabPertanyaan(
  konteks: KonteksPelajaran,
  riwayat: { role: "user" | "assistant"; content: string }[],
  pertanyaan: string,
  bahasa: "id" | "en"
): Promise<HasilAi<{ jawaban: string; model: string }>> {
  const percakapan = riwayat
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Peserta" : "Asisten"}: ${m.content}`)
    .join("\n")

  const hasil = await tanyaTeks({
    sistem:
      SISTEM +
      (bahasa === "en"
        ? "\n- Jawab dalam bahasa Inggris, tetapi kutip isi materi dalam bahasa aslinya."
        : ""),
    prompt: [
      susunKonteks(konteks),
      "",
      percakapan ? `PERCAKAPAN SEBELUMNYA:\n${percakapan}\n` : "",
      `PERTANYAAN PESERTA: ${pertanyaan}`,
    ].join("\n"),
    maxOutputTokens: 700,
  })

  if (!hasil.ok) return hasil
  return { ok: true, data: { jawaban: hasil.data.trim(), model: modelAi() }, token: hasil.token, terpotong: hasil.terpotong }
}
