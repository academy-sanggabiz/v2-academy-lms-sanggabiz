import type { CertificateType, CourseCertificateSettings } from "@/lib/courses-admin"

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
