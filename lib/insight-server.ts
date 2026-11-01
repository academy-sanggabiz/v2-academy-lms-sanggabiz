import { createClient } from "@/lib/supabase/server"

/**
 * Wawasan belajar per kursus, dibaca ulang dari data yang memang sudah sah
 * dikumpulkan untuk menyampaikan kursus (UU PDP 27/2022 Pasal 20 ayat (2)
 * huruf b). Tidak ada kolom baru yang dikumpulkan; dasar hukum dan batasnya
 * dijelaskan di docs/STANDAR-PELACAKAN.md.
 *
 * Penyaringan kepemilikan ada di dalam fungsinya (`owns_course()`), jadi mentor
 * yang memanggil endpoint ini untuk kursus orang lain tetap menerima daftar
 * kosong.
 */

export type DropoffStep = {
  stepNo: number
  lessonId: string
  lessonTitle: string
  sectionTitle: string
  contentType: string
  /** Berapa peserta menyelesaikan pelajaran ini. */
  completed: number
  /** Berapa peserta yang titik terjauhnya TEPAT di sini dan kursusnya belum
   *  selesai -- inilah angka "berhenti di sini". */
  stalled: number
  completedPct: number | null
}

export type CourseDropoff = {
  steps: DropoffStep[]
  totalLearners: number
  /** Belum menyelesaikan satu pelajaran pun. Dipisah dari "berhenti di
   *  pelajaran 1" karena keduanya masalah berbeda. */
  notStarted: number
  /** False bila fungsi SQL-nya belum ada di basis data. Migrasi proyek ini
   *  dijalankan tangan lewat SQL Editor, jadi selalu ada jeda antara kode
   *  ter-deploy dan SQL-nya dijalankan. */
  ready: boolean
}

export type QuestionDifficulty = {
  questionId: string
  prompt: string
  lessonTitle: string
  sectionTitle: string
  answered: number
  correct: number
  /** null = belum pernah dijawab siapa pun, bukan nol persen. */
  correctPct: number | null
}

export type QuizEffort = {
  quizId: string
  lessonTitle: string
  learners: number
  passed: number
  attempts: number
  /** Rata-rata percobaan ke berapa peserta akhirnya lulus; null bila belum ada yang lulus. */
  avgAttemptsToPass: number | null
  avgFirstScore: number | null
  avgBestScore: number | null
}

export async function getQuestionDifficulty(courseId: string): Promise<QuestionDifficulty[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_question_difficulty", { p_course_id: courseId })
  if (error) {
    console.error("getQuestionDifficulty failed:", error.message)
    return []
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    questionId: r.question_id as string,
    prompt: r.prompt as string,
    lessonTitle: r.lesson_title as string,
    sectionTitle: r.section_title as string,
    answered: r.answered as number,
    correct: r.correct as number,
    correctPct: r.correct_pct === null ? null : Number(r.correct_pct),
  }))
}

export async function getQuizEffort(courseId: string): Promise<QuizEffort[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_quiz_effort", { p_course_id: courseId })
  if (error) {
    console.error("getQuizEffort failed:", error.message)
    return []
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    quizId: r.quiz_id as string,
    lessonTitle: r.lesson_title as string,
    learners: r.learners as number,
    passed: r.passed as number,
    attempts: r.attempts as number,
    avgAttemptsToPass: r.avg_attempts_to_pass === null ? null : Number(r.avg_attempts_to_pass),
    avgFirstScore: r.avg_first_score === null ? null : Number(r.avg_first_score),
    avgBestScore: r.avg_best_score === null ? null : Number(r.avg_best_score),
  }))
}

/**
 * Corong penyelesaian pelajaran: di bagian mana peserta berhenti melanjutkan.
 *
 * Dibaca dari `lesson_progress` yang memang sudah sah dikumpulkan; tidak ada
 * data perilaku baru. Lihat docs/STANDAR-PELACAKAN.md.
 */
export async function getCourseDropoff(courseId: string): Promise<CourseDropoff> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_course_dropoff", { p_course_id: courseId })

  if (error) {
    console.error("getCourseDropoff failed:", error.message)
    return { steps: [], totalLearners: 0, notStarted: 0, ready: false }
  }

  const rows = (data ?? []) as Record<string, unknown>[]
  return {
    steps: rows.map((r) => ({
      stepNo: r.step_no as number,
      lessonId: r.lesson_id as string,
      lessonTitle: r.lesson_title as string,
      sectionTitle: r.section_title as string,
      contentType: r.content_type as string,
      completed: r.completed as number,
      stalled: r.stalled as number,
      completedPct: r.completed_pct === null ? null : Number(r.completed_pct),
    })),
    totalLearners: rows.length > 0 ? (rows[0].total_learners as number) : 0,
    notStarted: rows.length > 0 ? (rows[0].not_started as number) : 0,
    ready: true,
  }
}
