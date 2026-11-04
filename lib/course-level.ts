import type { Dictionary } from "@/lib/i18n/dictionaries"

/**
 * Tingkat kursus, satu kosakata tersimpan untuk seluruh aplikasi.
 *
 * Sebelum ini kolom `courses.level` diisi oleh dua penulis dengan dua
 * kosakata berbeda: pemilih di editor kursus menyimpan `beginner` /
 * `intermediate` / `advanced`, sedangkan pengimpor berkas .md menyimpan apa
 * adanya yang ditulis penyusun -- dan panduannya menyuruh menulis "Pemula",
 * "Menengah", "Lanjutan". Selama tingkat tidak pernah ditampilkan kepada
 * peserta, perbedaan itu tidak kelihatan. Begitu katalog publik perlu
 * *menyaring* menurut tingkat, satu gagasan yang sama pecah menjadi dua
 * kelompok yang tidak pernah bertemu.
 *
 * `normalizeLevel()` menerima keduanya supaya baris lama tetap terbaca benar
 * walau migrasinya belum dijalankan; labelnya diambil dari kamus supaya
 * tingkat ikut dwibahasa, bukan tersimpan sebagai teks Indonesia.
 */
export const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const

export type CourseLevel = (typeof COURSE_LEVELS)[number]

/** Ejaan lama yang pernah tersimpan, dipetakan ke kosakata kanonis. */
const ALIAS: Record<string, CourseLevel> = {
  beginner: "beginner",
  pemula: "beginner",
  dasar: "beginner",
  basic: "beginner",
  intermediate: "intermediate",
  menengah: "intermediate",
  advanced: "advanced",
  lanjutan: "advanced",
  mahir: "advanced",
}

export function normalizeLevel(value: string | null | undefined): CourseLevel | null {
  if (!value) return null
  return ALIAS[value.trim().toLowerCase()] ?? null
}

export function isCourseLevel(value: unknown): value is CourseLevel {
  return typeof value === "string" && (COURSE_LEVELS as readonly string[]).includes(value)
}

export function levelLabel(level: CourseLevel, t: Dictionary): string {
  return {
    beginner: t.editor.levelBeginner,
    intermediate: t.editor.levelIntermediate,
    advanced: t.editor.levelAdvanced,
  }[level]
}
