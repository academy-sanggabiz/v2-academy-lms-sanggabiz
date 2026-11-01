import type { CertificateType, CourseCertificateSettings } from "@/lib/courses-admin"
import type { CertificateLayout } from "@/components/certificates/CertificateDocument"

/**
 * Pengaturan sertifikat tingkat perusahaan, dan aturan bagaimana pengaturan
 * sebuah kursus mewarisinya.
 *
 * Aturannya satu kalimat: **NULL pada kursus berarti "ikut pengaturan utama",
 * bukan "kosongkan".** Kursus perusahaan sendiri karena itu tidak perlu
 * mengisi apa pun, sementara kursus hasil kerja sama dengan perusahaan lain
 * cukup mengisi ruas yang memang berbeda.
 *
 * Konsekuensi yang perlu disadari: kursus tidak bisa lagi menyatakan "tanpa
 * penanda tangan" dengan mengosongkan ruasnya. Itu disengaja -- sertifikat
 * tanpa penanda tangan terlihat belum selesai, dan tidak ada yang pernah
 * memintanya. Kalau suatu saat dibutuhkan, tambahkan penanda eksplisit,
 * jangan maknai ulang NULL.
 */
export type CertificateDefaults = {
  certificate_type: CertificateType
  custom_title: string | null
  description: string | null
  signature_url: string | null
  signer_name: string | null
  signer_title: string | null
  additional_text: string | null
  template_url: string | null
  layout: CertificateLayout
}

/**
 * Dipakai saat baris pengaturan utama belum ada -- termasuk sebelum
 * migrasinya dijalankan. Sertifikat tetap terbit dengan bentuk yang masuk
 * akal, bukan gagal.
 */
export const BUILT_IN_CERTIFICATE_DEFAULTS: CertificateDefaults = {
  certificate_type: "completion",
  custom_title: null,
  description: null,
  signature_url: null,
  signer_name: null,
  signer_title: null,
  additional_text: null,
  template_url: null,
  layout: "klasik",
}

/** Ruas yang bisa diwarisi. `enabled` sengaja tidak termasuk: apakah sebuah
 *  kursus menerbitkan sertifikat sama sekali adalah keputusan kursus itu. */
export const INHERITABLE_FIELDS = [
  "certificate_type",
  "custom_title",
  "description",
  "signature_url",
  "signer_name",
  "signer_title",
  "additional_text",
  "template_url",
  "layout",
] as const

export type InheritableField = (typeof INHERITABLE_FIELDS)[number]

export type ResolvedCertificateSettings = CertificateDefaults & {
  /** Ruas yang nilainya datang dari pengaturan utama, bukan dari kursus. */
  inherited: Record<InheritableField, boolean>
}

/**
 * Menggabungkan pengaturan kursus dengan pengaturan utama, sekaligus
 * melaporkan ruas mana yang diwarisi supaya antarmuka bisa mengatakannya
 * kepada penyusun. Tanpa laporan itu penyusun melihat ruas kosong dan
 * menyangka sertifikatnya memang akan kosong.
 */
export function resolveCertificateSettings(
  course: Partial<CourseCertificateSettings> | null | undefined,
  defaults: CertificateDefaults | null | undefined
): ResolvedCertificateSettings {
  const base = defaults ?? BUILT_IN_CERTIFICATE_DEFAULTS
  const inherited = {} as Record<InheritableField, boolean>
  const resolved = {} as CertificateDefaults

  for (const field of INHERITABLE_FIELDS) {
    const own = course?.[field] ?? null
    // String kosong diperlakukan sama dengan NULL. Kotak teks yang dikosongkan
    // pengguna kerap menyimpan "" dan bukan NULL, dan maksudnya jelas sama.
    const isSet = own !== null && own !== undefined && String(own).trim() !== ""
    inherited[field] = !isSet
    // @ts-expect-error -- setiap ruas disalin dari sumber bertipe sama
    resolved[field] = isSet ? own : base[field]
  }

  return { ...resolved, inherited }
}


/**
 * Melengkapi baris `course_certificate_settings` dari basis data menjadi
 * objek yang setiap ruasnya pasti ada.
 *
 * Ada karena satu bug yang sudah dua kali terjadi dengan bentuk yang sama:
 * sebuah ruas baru ditambahkan ke skema draf, kolomnya belum ada di basis
 * data karena migrasinya dijalankan tangan, baris lama mengembalikan
 * `undefined`, dan validasi menolak SELURUH draf -- sehingga setiap kursus
 * yang punya baris sertifikat tidak bisa disimpan sama sekali, dengan pesan
 * yang menunjuk sertifikat padahal penyusunnya sedang menyunting hal lain.
 *
 * Menambah ruas sertifikat baru berarti menambahkannya di sini juga. Dengan
 * begitu kolom yang belum ada menghasilkan NULL ("ikut pengaturan utama"),
 * bukan draf yang gagal divalidasi.
 */
export function normalizeCourseCertificateSettings(
  row: Partial<CourseCertificateSettings> | null | undefined
): CourseCertificateSettings | null {
  if (!row) return null
  return {
    enabled: row.enabled ?? false,
    template_url: row.template_url ?? null,
    certificate_type: row.certificate_type ?? null,
    custom_title: row.custom_title ?? null,
    description: row.description ?? null,
    signature_url: row.signature_url ?? null,
    signer_name: row.signer_name ?? null,
    signer_title: row.signer_title ?? null,
    additional_text: row.additional_text ?? null,
    layout: row.layout ?? null,
  }
}
