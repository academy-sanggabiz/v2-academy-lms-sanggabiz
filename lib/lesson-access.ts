import type { LessonContentType } from "@/lib/courses"

/**
 * Pelajaran mana yang boleh dibuka, saat kursus disetel berurutan.
 *
 * Aturannya: sebuah pelajaran terbuka bila **seluruh** pelajaran sebelumnya
 * sudah tuntas. Untuk pelajaran biasa, tuntas berarti ditandai selesai. Untuk
 * pelajaran kuis, tuntas berarti **lulus** -- bukan sekadar dicentang.
 * Perkecualiannya kuis ukur (pretest/posttest): untuk itu tuntas berarti
 * sudah dikirim, karena nilainya tidak dipakai menilai.
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
  /**
   * Pelajaran ini kuis ukur (pretest/posttest). Opsional, dan `false` bila
   * tidak diisi -- pemanggil lama tetap mendapat perilaku lama.
   */
  isMeasureQuiz?: boolean
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

    // Kuis ukur tuntas begitu DIKIRIM, bukan begitu lulus. Pretest memang
    // dirancang untuk banyak dijawab salah -- mensyaratkan lulus akan
    // mengunci seluruh kursus di pelajaran pertamanya, yang persis kebalikan
    // dari gunanya. Penanda selesai ditulis oleh submitQuiz saat pengiriman.
    const cleared =
      lesson.quizId && !lesson.isMeasureQuiz
        ? passedQuizIds.has(lesson.quizId)
        : completedLessonIds.has(lesson.id)

    // Begitu satu pelajaran belum tuntas, sisanya tetap terkunci.
    if (!cleared) break
  }
  return unlocked
}
