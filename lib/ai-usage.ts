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
 * Satu kursus menghabiskan sekitar 28 ribu token, jadi angka ini kira-kira
 * tujuh kursus sehari -- longgar untuk pemakaian sungguhan, rapat untuk
 * seseorang yang menekan tombolnya berulang kali.
 *
 * Dibatasi dengan TOKEN, bukan jumlah panggilan, karena yang dijaga adalah
 * biaya. Batas harian asisten pelajaran menghitung pertanyaan, dan karena itu
 * satu pertanyaan pendek dan satu pertanyaan yang membakar dua ribu token
 * dihitung sama -- kekeliruan yang tidak diulang di sini.
 */
export const BATAS_TOKEN_SOP_HARIAN = 200_000

/** Fitur yang dihitung terhadap batas di atas. */
export const FITUR_SOP: readonly string[] = ["sop_kerangka", "sop_revisi", "sop_tulis"]

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
