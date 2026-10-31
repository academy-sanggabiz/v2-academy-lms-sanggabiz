import type { SupabaseClient } from "@supabase/supabase-js"

import { computeCourseGrade, quizGradeWeight } from "@/lib/course-grade"
import { pickRepresentativeAttempt } from "@/lib/quiz-attempt-selection"

/**
 * Apa yang masih kurang sebelum sebuah kursus benar-benar selesai.
 *
 * Dibuat setelah seorang peserta menandai seluruh pelajaran selesai -- termasuk
 * pelajaran kuis, yang kotak centangnya di sidebar memang tidak terkunci --
 * lalu melihat layar "Selamat, Anda telah menyelesaikan kursus", mencoba
 * menulis ulasan, dan ditolak server tanpa alasan yang bisa dibaca. Ulasan
 * memang dijaga RLS pada `enrollments.status = 'completed'`, dan status itu
 * tidak pernah berubah karena kuisnya belum lulus.
 *
 * Akarnya: layar memakai "semua pelajaran ditandai selesai" sebagai arti
 * "kursus selesai", padahal `checkAndIssueCertificate()` memakai aturan yang
 * jauh lebih ketat. Dua definisi untuk satu kata, dan peserta berdiri di
 * antaranya tanpa penjelasan. Berkas ini membuat aturan yang ketat itu bisa
 * dibaca layar, lengkap dengan alasannya.
 */

export type QuizRequirement = {
  lessonId: string
  title: string
  passScore: number
  /** Skor terbaik yang pernah dicapai; null bila belum pernah mengerjakan. */
  bestScore: number | null
  passed: boolean
  attemptsUsed: number
  /** null = tanpa batas percobaan. */
  maxAttempts: number | null
  /** Percobaan habis dan belum lulus: peserta mentok tanpa bantuan pengelola. */
  exhausted: boolean
}

export type CourseRequirements = {
  met: boolean
  lessonsDone: number
  lessonsTotal: number
  quizzes: QuizRequirement[]
  /** null ketika kursus tidak punya kuis sama sekali. */
  grade: { now: number; needed: number; met: boolean } | null
}

type SectionRow = {
  lessons: {
    id: string
    title: string
    quiz: { id: string; is_assessment: boolean; pass_score: number; max_attempts: number | null }[] | null
  }[]
}

type AttemptRow = {
  quiz_id: string
  attempt_number: number
  score: number | null
  passed: boolean | null
  status: string
}

/**
 * Dihitung dengan klien pemanggil, jadi tetap dibatasi RLS-nya: ini hanya
 * menjelaskan keadaan peserta kepada peserta itu sendiri, bukan memberi
 * kewenangan baru. Penerbitan sertifikat tetap dihitung ulang secara terpisah
 * di lib/certificates.ts dengan service role.
 */
export async function getCourseRequirements(
  supabase: SupabaseClient,
  { courseId, enrollmentId, learnerId }: { courseId: string; enrollmentId: string; learnerId: string }
): Promise<CourseRequirements | null> {
  const { data: sections, error } = await supabase
    .from("course_sections")
    .select("lessons(id, title, quiz:quizzes(id, is_assessment, pass_score, max_attempts))")
    .eq("course_id", courseId)

  if (error || !sections) {
    if (error) console.error("getCourseRequirements: sections lookup failed", error.message)
    return null
  }

  const lessons = (sections as SectionRow[]).flatMap((s) => s.lessons ?? [])
  if (lessons.length === 0) return null

  const quizLessons = lessons
    .map((l) => ({ lesson: l, quiz: Array.isArray(l.quiz) ? l.quiz[0] : l.quiz }))
    .filter((x): x is { lesson: (typeof lessons)[number]; quiz: NonNullable<SectionRow["lessons"][number]["quiz"]>[number] } =>
      x.quiz != null
    )

  const [{ data: progressRows }, { data: attemptRows }, { data: course }] = await Promise.all([
    supabase.from("lesson_progress").select("lesson_id").eq("enrollment_id", enrollmentId).eq("completed", true),
    quizLessons.length > 0
      ? supabase
          .from("quiz_attempts")
          .select("quiz_id, attempt_number, score, passed, status")
          .eq("learner_id", learnerId)
          .in("quiz_id", quizLessons.map((q) => q.quiz.id))
          .order("attempt_number", { ascending: true })
      : Promise.resolve({ data: [] as AttemptRow[] }),
    supabase.from("courses").select("passing_grade").eq("id", courseId).single(),
  ])

  const doneIds = new Set((progressRows ?? []).map((r) => r.lesson_id as string))
  const lessonsDone = lessons.filter((l) => doneIds.has(l.id)).length

  const byQuiz = new Map<string, AttemptRow[]>()
  for (const a of (attemptRows ?? []) as AttemptRow[]) {
    const bucket = byQuiz.get(a.quiz_id) ?? []
    bucket.push(a)
    byQuiz.set(a.quiz_id, bucket)
  }

  const quizzes: QuizRequirement[] = quizLessons.map(({ lesson, quiz }) => {
    const attempts = byQuiz.get(quiz.id) ?? []
    const graded = attempts.filter((a) => a.status !== "in_progress")
    const bestScore = graded.reduce<number | null>(
      (best, a) => (a.score === null ? best : best === null || a.score > best ? a.score : best),
      null
    )
    const passed = attempts.some((a) => a.passed === true)
    const attemptsUsed = graded.length
    const maxAttempts = quiz.max_attempts ?? null

    return {
      lessonId: lesson.id,
      title: lesson.title,
      passScore: quiz.pass_score,
      bestScore,
      passed,
      attemptsUsed,
      maxAttempts,
      exhausted: !passed && maxAttempts !== null && attemptsUsed >= maxAttempts,
    }
  })

  let grade: CourseRequirements["grade"] = null
  if (quizLessons.length > 0) {
    const needed = course?.passing_grade ?? 0
    const { grade: now } = computeCourseGrade(
      quizLessons.map(({ quiz }) => {
        const representative = pickRepresentativeAttempt(
          (byQuiz.get(quiz.id) ?? []).filter((a) => a.status !== "in_progress"),
          quiz.is_assessment
        )
        return {
          score: representative?.score ?? null,
          weight: quizGradeWeight(quiz.is_assessment),
          pending: representative?.status === "pending_review",
        }
      })
    )
    grade = { now, needed, met: now >= needed }
  }

  const met =
    lessonsDone === lessons.length &&
    quizzes.every((q) => q.passed) &&
    (grade === null || grade.met)

  return { met, lessonsDone, lessonsTotal: lessons.length, quizzes, grade }
}
