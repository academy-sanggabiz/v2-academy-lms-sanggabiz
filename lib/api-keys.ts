/**
 * Kunci API untuk integrasi luar.
 *
 * Bebas dari modul server supaya layar pengelola bisa memakai tipenya --
 * aturan yang sama dengan lib/org.ts dan lib/ai-usage.ts.
 *
 * == Bentuk kuncinya ==
 *
 *   sgb_<8 huruf awalan>_<48 huruf rahasia>
 *
 * Awalan disimpan apa adanya, rahasianya TIDAK PERNAH disimpan -- yang
 * tersimpan hanya SHA-256 dari kunci utuh. Dua akibat yang disengaja:
 *
 *   * Kunci hanya bisa dilihat sekali, saat dibuat. Basis data yang bocor
 *     tidak memberi penyerang satu pun kunci yang bisa dipakai.
 *   * Awalan membuat pencarian tetap satu baris, tanpa perlu membandingkan
 *     hash seluruh tabel pada tiap permintaan.
 *
 * Awalan sengaja ikut terlihat di layar: ketika sebuah kunci harus dicabut
 * karena bocor di log, orang perlu tahu KUNCI YANG MANA, dan "sgb_a1b2c3d4"
 * bisa dicocokkan sementara hash tidak.
 */

export const AWALAN_KUNCI = "sgb"

/** Hak yang bisa diberikan ke satu kunci. */
export const LINGKUP = ["read", "write"] as const
export type Lingkup = (typeof LINGKUP)[number]

export type KunciApi = {
  id: string
  nama: string
  awalan: string
  lingkup: Lingkup[]
  dibuatPada: string
  terakhirDipakai: string | null
  dicabutPada: string | null
}

/** Kejadian yang bisa dilanggan sebuah webhook. */
export const KEJADIAN_WEBHOOK = [
  "enrollment.created",
  "course.completed",
  "certificate.issued",
] as const
export type KejadianWebhook = (typeof KEJADIAN_WEBHOOK)[number]

export type Endpoint = {
  id: string
  url: string
  keterangan: string | null
  kejadian: string[]
  aktif: boolean
  dibuatPada: string
}

export type Pengiriman = {
  id: string
  endpointId: string
  kejadian: string
  statusCode: number | null
  galat: string | null
  percobaan: number
  terkirimPada: string | null
  dibuatPada: string
}

/**
 * Jeda sebelum percobaan kirim berikutnya, membesar tiap kegagalan.
 *
 * Penerima yang mati sebentar tertolong oleh percobaan cepat di awal;
 * penerima yang mati berhari-hari tidak pantas dihujani permintaan. Setelah
 * percobaan terakhir barisnya dibiarkan apa adanya -- tercatat gagal, bisa
 * dilihat pengelola, tidak dicoba lagi selamanya.
 */
export const JEDA_COBA_ULANG_MENIT = [1, 5, 30, 120, 720] as const
export const MAKS_PERCOBAAN = JEDA_COBA_ULANG_MENIT.length

export function jedaBerikutnya(percobaanKe: number): number | null {
  return JEDA_COBA_ULANG_MENIT[percobaanKe] ?? null
}
