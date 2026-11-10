/**
 * Struktur organisasi: departemen, jabatan, dan jalur kursus per jabatan.
 *
 * Bebas dari modul server supaya komponen di peramban bisa memakai tipenya
 * tanpa menarik klien basis data ke jalur render publik -- aturan yang sama
 * dengan `lib/landing.ts` dan `lib/courses.ts`.
 */

export type Department = {
  id: string
  name: string
  /** Berapa jabatan ada di departemen ini. Dipakai layar untuk memberi tahu
   *  akibat penghapusan SEBELUM tombolnya ditekan. */
  jobTitleCount: number
}

export type JobTitle = {
  id: string
  name: string
  departmentId: string | null
  /** Berapa orang memegang jabatan ini sekarang. */
  peopleCount: number
}

/** Wajib atau disarankan. Nilainya sama dengan enum `job_course_requirement`. */
export type Requirement = "wajib" | "disarankan"

/** Satu kursus pada jalur sebuah jabatan. */
export type JobCourse = {
  courseId: string
  requirement: Requirement
  /** Hari sejak orang terdaftar. null = tanpa tenggat. */
  dueDays: number | null
  autoEnroll: boolean
  position: number
}

/**
 * Satu baris di kartu "Untuk jabatan Anda".
 *
 * `reason` dirakit di server, bukan di komponen: standar v2 mencatat
 * "rekomendasi tanpa alasan" sebagai anti-pattern, dan alasan yang dirakit di
 * dua tempat cepat berbeda bunyinya.
 */
export type JobCourseRow = {
  courseId: string
  title: string
  thumbnailUrl: string | null
  lessonCount: number
  requirement: Requirement
  /** Tenggat yang sudah dihitung, bila orangnya sudah terdaftar. */
  dueAt: string | null
  enrolled: boolean
  /** Persen 0-100 untuk yang sudah terdaftar; null bila belum. */
  progress: number | null
}

/**
 * Berapa hari lagi sampai tenggat. Negatif berarti lewat.
 *
 * Dihitung dari awal hari, bukan dari jam sekarang: tenggat "besok" tidak
 * boleh berubah jadi "hari ini" hanya karena orangnya membuka dasbor lewat
 * tengah malam.
 */
export function sisaHari(dueAt: string, sekarang = new Date()): number {
  const batas = new Date(dueAt)
  const a = Date.UTC(batas.getFullYear(), batas.getMonth(), batas.getDate())
  const b = Date.UTC(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate())
  return Math.round((a - b) / 86_400_000)
}
