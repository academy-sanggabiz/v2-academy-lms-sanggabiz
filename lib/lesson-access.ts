import type { LessonContentType } from "@/lib/courses"

/**
 * Pelajaran mana yang boleh dibuka, saat kursus disetel berurutan.
 *
 * Aturannya: sebuah pelajaran terbuka bila **seluruh** pelajaran sebelumnya
 * sudah tuntas. Untuk pelajaran biasa, tuntas berarti ditandai selesai. Untuk
 * pelajaran kuis, tuntas berarti **lulus** -- bukan sekadar dicentang.
 *
 * Perbedaan itu penting. Kotak centang di sidebar tidak terkunci, termasuk
 * pada pelajaran kuis, jadi kalau "selesai" saja yang dipakai, peserta bisa
 * melompati seluruh kuis dengan mencentangnya dan urutan wajib itu kehilangan
 * seluruh artinya.
 *
 * Pelajaran pertama selalu terbuka. Tanpa itu, kursus berurutan tidak punya
 * titik masuk sama sekali.
 *
 * Peserta yang kursusnya SUDAH dinyatakan selesai terbuka seluruhnya, apa pun
 * keadaan pelajarannya. Ini bukan kelonggaran, melainkan koreksi: ketika
 * penyusun menyisipkan pelajaran baru di tengah kursus yang sudah dikerjakan
 * orang, pelajaran baru itu belum tuntas -- dan tanpa pengecualian ini,
 * seluruh pelajaran SETELAHNYA ikut terkunci, termasuk yang sudah ia
 * selesaikan dan yang sertifikatnya sudah ia terima. Orang yang sudah lulus
 * tetap lulus; materi tambahan tersedia untuk dikerjakan, bukan dipaksakan
 * dengan mencabut akses yang sudah ia peroleh.
 */
export type AccessLesson = {
  id: string
  content_type: LessonContentType
  /** null bila pelajaran ini bukan kuis. */
  quizId: string | null
}

export function computeUnlockedLessons({
  lessons,
  completedLessonIds,
  passedQuizIds,
  sequential,
  courseCompleted = false,
}: {
  lessons: AccessLesson[]
  completedLessonIds: Set<string>
  passedQuizIds: Set<string>
  sequential: boolean
  /** Pendaftarannya sudah berstatus `completed`. */
  courseCompleted?: boolean
}): Set<string> {
  if (!sequential || courseCompleted) return new Set(lessons.map((l) => l.id))

  const unlocked = new Set<string>()
  for (const lesson of lessons) {
    unlocked.add(lesson.id)

    const cleared = lesson.quizId
      ? passedQuizIds.has(lesson.quizId)
      : completedLessonIds.has(lesson.id)

    // Begitu satu pelajaran belum tuntas, sisanya tetap terkunci.
    if (!cleared) break
  }
  return unlocked
}
