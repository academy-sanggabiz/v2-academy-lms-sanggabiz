import type { CourseDraft, DraftLesson } from "@/lib/course-draft"

/**
 * Apakah satu pelajaran sudah punya isi yang bisa dipelajari.
 *
 * Aturan ini dulu hanya hidup di dalam LessonsTab sebagai lencana
 * "Lengkap"/"Belum lengkap", sehingga editor memberi tahu penulis bahwa
 * pelajarannya belum lengkap lalu tetap mengizinkannya menekan "Terbitkan".
 * Hasilnya kursus terbit berisi "Pelajaran Tanpa Judul" yang kosong, dan
 * peserta yang membukanya tidak menemukan apa-apa. Sekarang lencana dan
 * gerbang terbit membaca fungsi yang sama, jadi keduanya tidak bisa berbeda
 * pendapat.
 */
export function isLessonComplete(lesson: DraftLesson): boolean {
  if (lesson.title.trim().length === 0) return false

  switch (lesson.content_type) {
    case "video":
    case "ppt":
      return (lesson.video_url ?? "").trim().length > 0
    case "text":
      return (lesson.content ?? "").replace(/<[^>]*>/g, "").trim().length > 0
    case "quiz":
      return (lesson.quiz?.questions.length ?? 0) > 0
    default:
      return true
  }
}

export type IncompleteLesson = {
  sectionTitle: string
  lessonTitle: string
  /** Nomor urut untuk pelajaran yang judulnya masih kosong. */
  lessonNumber: number
}

/** Semua pelajaran yang belum layak dibaca peserta, berurutan seperti di editor. */
export function findIncompleteLessons(draft: CourseDraft): IncompleteLesson[] {
  const found: IncompleteLesson[] = []

  draft.sections.forEach((section, sectionIndex) => {
    section.lessons.forEach((lesson, lessonIndex) => {
      if (isLessonComplete(lesson)) return
      found.push({
        sectionTitle: section.title.trim() || `Modul ${sectionIndex + 1}`,
        lessonTitle: lesson.title.trim() || `Pelajaran ${lessonIndex + 1}`,
        lessonNumber: lessonIndex + 1,
      })
    })
  })

  return found
}

/** Kalimat siap tampil untuk satu pelajaran yang belum lengkap. */
export function describeIncompleteLesson(item: IncompleteLesson): string {
  return `"${item.lessonTitle}" di ${item.sectionTitle} belum punya judul atau isi`
}
