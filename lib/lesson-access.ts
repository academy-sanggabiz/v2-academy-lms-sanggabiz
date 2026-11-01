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
}: {
  lessons: AccessLesson[]
  completedLessonIds: Set<string>
  passedQuizIds: Set<string>
  sequential: boolean
}): Set<string> {
  if (!sequential) return new Set(lessons.map((l) => l.id))

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
