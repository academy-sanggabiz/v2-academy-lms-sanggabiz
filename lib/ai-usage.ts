/**
 * Pemakaian AI: siapa memanggil apa, berapa token, berapa biayanya.
 *
 * Bebas dari modul server supaya komponen di peramban bisa memakai tipenya --
 * aturan yang sama dengan lib/org.ts dan lib/perkembangan.ts.
 *
 * == Kenapa ini ada ==
 *
 * `ai_usage` sudah mencatat tiap panggilan sejak fitur AI pertama, tetapi
 * tidak ada satu pun layar yang membacanya. Satu-satunya pembaca adalah batas
 * harian asisten pelajaran, dan ia menghitung JUMLAH PERTANYAAN, bukan token.
 * Artinya biaya yang sedang berjalan hanya bisa dilihat dengan bertanya
 * langsung ke basis data -- yang berarti, dalam praktiknya, tidak dilihat.
 */

/** Nama fitur sebagaimana ditulis ke `ai_usage.feature`. */
export const FITUR_AI = [
  "lesson-assistant",
  "quiz-feedback",
  "sop_kerangka",
  "sop_revisi",
  "sop_tulis",
  "report-summary",
] as const

export type FiturAi = (typeof FITUR_AI)[number]

export type BarisPemakaian = {
  userId: string
  nama: string
  email: string
  peran: string
  panggilan: number
  token: number
  /** null bila harga per token belum disetel. Lihat `rupiah()`. */
  biaya: number | null
  terakhir: string
}

export type RingkasanFitur = {
  fitur: string
  panggilan: number
  token: number
  biaya: number | null
}

export type LaporanPemakaian = {
  /** Berapa hari ke belakang yang dihitung. */
  hari: number
  totalPanggilan: number
  totalToken: number
  totalBiaya: number | null
  /** Harga per satu juta token dalam rupiah, atau null bila belum disetel. */
  hargaPerJuta: number | null
  orang: BarisPemakaian[]
  fitur: RingkasanFitur[]
}

/**
 * Rupiah dari token, atau null.
 *
 * Mengembalikan null -- bukan nol, bukan tebakan -- ketika harganya belum
 * disetel. Angka biaya yang dikarang lebih buruk daripada tidak ada angka
 * sama sekali: orang akan memutuskan sesuatu berdasarkan angka itu.
 *
 * `ai_usage.tokens` menyimpan TOTAL token (masuk + keluar) karena itulah yang
 * dikembalikan penyedia dalam satu ruas. Jadi harganya pun satu angka
 * gabungan, bukan tarif masuk dan keluar terpisah -- setel ke tarif keluar
 * bila ingin perkiraan yang aman, karena itu yang lebih mahal.
 */
export function rupiah(token: number, hargaPerJuta: number | null): number | null {
  if (hargaPerJuta === null) return null
  return Math.round((token / 1_000_000) * hargaPerJuta)
}

/**
 * Batas token per orang per hari untuk "Buat otomatis dengan AI".
 *
 * DIUKUR, bukan dikira: satu kursus enam modul dari dokumen 4.200 huruf
 * memakan 18.855 token (kerangka 3.573 + enam modul rata-rata 2.547), selesai
 * dalam 33 detik. Jadi angka ini kira-kira sepuluh kursus sehari -- longgar
 * untuk pemakaian sungguhan, rapat untuk seseorang yang menekan tombolnya
 * berulang kali.
 *
 * Angka pertama yang ditulis di sini adalah "28 ribu", hasil membagi total
 * satu sesi uji coba tanpa memperhatikan bahwa sesi itu memuat dua kerangka
 * dan satu revisi -- lebih dari satu kursus. Diukur ulang karena batas yang
 * alasannya salah adalah batas yang akan disetel salah nanti.
 *
 * Dibatasi dengan TOKEN, bukan jumlah panggilan, karena yang dijaga adalah
 * biaya. Batas harian asisten pelajaran menghitung pertanyaan, dan karena itu
 * satu pertanyaan pendek dan satu pertanyaan yang membakar dua ribu token
 * dihitung sama -- kekeliruan yang tidak diulang di sini.
 */
export const BATAS_TOKEN_SOP_HARIAN = 200_000

/** Fitur yang dihitung terhadap batas di atas. */
export const FITUR_SOP: readonly string[] = ["sop_kerangka", "sop_revisi", "sop_tulis"]

/**
 * Batas token per peserta per hari untuk "Bahas jawaban saya".
 *
 * Fitur ini pun sebelumnya tanpa pagar. Hasilnya memang disimpan per
 * percobaan, sehingga membuka ulang halaman hasil tidak memanggil AI lagi --
 * tetapi kuis biasa boleh diulang tanpa batas (lihat migrasi
 * 20261101050000_unlimited_quiz_attempts.sql), jadi tiap percobaan baru adalah
 * pembahasan baru yang sah. Singgahan per percobaan menahan pengulangan, bukan
 * pemakaian.
 *
 * Diukur: membahas dua jawaban salah memakan 723 token. Jadi angka ini
 * kira-kira dua puluh tujuh pembahasan sehari -- jauh di atas pemakaian
 * belajar yang wajar.
 */
export const BATAS_TOKEN_PEMBAHASAN_HARIAN = 20_000

/** Fitur yang dihitung terhadap batas pembahasan. */
export const FITUR_PEMBAHASAN: readonly string[] = ["quiz-feedback"]

/**
 * Batas token per pengelola per hari untuk ringkasan laporan departemen.
 *
 * Jauh lebih kecil daripada batas pembuatan kursus karena masukannya pun
 * jauh lebih kecil: yang dikirim hanya beberapa baris angka agregat, bukan
 * dokumen. Diukur pada enam departemen (dua di antaranya tampil, sisanya
 * ditahan ambang): 1.536 token untuk dua kali jalan, jadi sekitar 768 token
 * sekali ringkas. Angka ini karena itu kira-kira tiga puluh kali sehari.
 *
 * Pagarnya ada karena tombolnya bisa ditekan berulang-ulang tanpa biaya yang
 * terlihat oleh penekannya -- dan ringkasan yang sama dibuat dua kali adalah
 * uang yang dibakar untuk jawaban yang sudah ada di layar.
 */
export const BATAS_TOKEN_LAPORAN_HARIAN = 25_000

/** Fitur yang dihitung terhadap batas laporan. */
export const FITUR_LAPORAN: readonly string[] = ["report-summary"]

export function formatToken(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID").format(n)
}

export function formatRupiah(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n)
}

/**
 * Batas ukuran dokumen yang diubah jadi kursus (F1).
 *
 * Ditaruh di sini, bukan di `app/admin/courses/sop-actions.ts`, karena
 * dibutuhkan DUA sisi: aksi server menolak berkas kelewat besar, dan dialog
 * perlu menolaknya lebih dulu saat dilepas supaya orang tidak menunggu
 * unggahan 40 MB hanya untuk ditolak di ujung. Berkas aksi server tidak bisa
 * mengekspor tetapan -- "use server" hanya membolehkan fungsi async.
 */
export const MAKS_BERKAS_SOP = 10 * 1024 * 1024

/**
 * Jenis dokumen yang diterima, satu daftar untuk atribut `accept` dan untuk
 * pemeriksaan saat berkas DILEPAS. Keduanya harus sama: `accept` sama sekali
 * tidak berlaku pada seret-lepas, jadi tanpa pemeriksaan sendiri berkas apa
 * pun bisa masuk lewat jalur itu.
 */
export const EKSTENSI_DOKUMEN_SOP = [".pdf", ".docx", ".md", ".txt"] as const

export const ACCEPT_DOKUMEN_SOP =
  ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  ".pdf,application/pdf,.md,.txt,text/plain,text/markdown"

/** Benar bila nama berkasnya berakhiran salah satu jenis yang diterima. */
export function jenisDokumenDiterima(nama: string): boolean {
  const n = nama.toLowerCase()
  return EKSTENSI_DOKUMEN_SOP.some((e) => n.endsWith(e))
}
