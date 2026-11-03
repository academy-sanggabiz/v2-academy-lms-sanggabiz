"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { checkAndIssueCertificate } from "@/lib/certificates"

export type SubmitQuizResult = {
  pending: boolean
  score: number | null
  passed: boolean | null
  correctCount: number
  total: number
  perQuestion: Record<string, boolean | null>
  /** question_id -> author's explanation; only questions that have one. */
  explanations: Record<string, string>
  /**
   * Soal yang masih salah pada percobaan INI dan sudah tiga kali atau lebih
   * salah secara kumulatif. Aturan adaptif pertama (Day 12): pemutar memakai
   * ini untuk MENYARANKAN membuka ulang materi, lengkap dengan alasannya --
   * tidak pernah mengubah jalur diam-diam, dan mencoba lagi tetap boleh.
   */
  repeatedStruggles: { questionId: string; timesWrong: number; prompt: string }[]
}

export async function startQuiz(
  quizId: string
): Promise<{ attemptId: string; attemptNumber: number; questionIds: string[] | null } | { error: string }> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return { error: "Anda belum masuk." }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("lesson_id")
    .eq("id", quizId)
    .single()

  if (quizError || !quiz) return { error: "Kuis tidak ditemukan." }

  // grade_attempt() (called from submitQuiz) also enforces enrollment before
  // it will score anything, but that check only runs at submit time -- an
  // unenrolled learner shouldn't even be able to open the attempt, so it's
  // checked here too.
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("section:course_sections(course_id)")
    .eq("id", quiz.lesson_id)
    .single()

  if (lessonError || !lesson) return { error: "Kuis tidak ditemukan." }
  const section = Array.isArray(lesson.section) ? lesson.section[0] : lesson.section
  const courseId = section?.course_id
  if (!courseId) return { error: "Kuis tidak ditemukan." }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("learner_id", userId)
    .eq("course_id", courseId)
    .maybeSingle()

  if (enrollmentError) return { error: userFacingError(enrollmentError.message) }
  if (!enrollment) return { error: "Anda belum terdaftar di kursus ini." }

  const { data: existing, error: existingError } = await supabase
    .from("quiz_attempts")
    .select("attempt_number")
    .eq("quiz_id", quizId)
    .eq("learner_id", userId)
    .order("attempt_number", { ascending: false })
    .limit(1)

  if (existingError) return { error: userFacingError(existingError.message) }

  // Tanpa batas percobaan untuk kuis biasa: lihat migrasi
  // 20261101050000_unlimited_quiz_attempts.sql. Studi kasus tetap dibatasi
  // quizzes.max_attempts, ditegakkan di trigger dan di resumeAttempt di bawah.
  const attemptsUsed = existing?.[0]?.attempt_number ?? 0
  const attemptNumber = attemptsUsed + 1

  const { data: attempt, error: insertError } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      learner_id: userId,
      attempt_number: attemptNumber,
      started_at: new Date().toISOString(),
    })
    // question_ids diisi trigger draw_attempt_questions di basis data, bukan
    // di sini: percobaan dibuat oleh sesi peserta, jadi daftar soal yang
    // dipilih aplikasi bisa diganti lewat REST oleh orang yang dinilai.
    .select("id, question_ids")
    .single()

  if (insertError || !attempt) return { error: insertError ? userFacingError(insertError.message) : "Gagal memulai kuis. Coba lagi." }

  return {
    attemptId: attempt.id,
    attemptNumber,
    questionIds: (attempt.question_ids as string[] | null) ?? null,
  }
}

/**
 * Assessment (essay/study-case) mode has no "Start Quiz" gate -- the learner
 * just starts writing. This get-or-creates their open attempt: it reuses an
 * existing `in_progress` attempt (so repeated Save-draft/Submit calls don't
 * spawn duplicate empty attempts) and only inserts a fresh one when none is
 * open, enforcing the same enrollment + max_attempts rules as startQuiz.
 */
export async function startAssessmentAttempt(
  quizId: string
): Promise<{ attemptId: string; attemptNumber: number } | { error: string }> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return { error: "Anda belum masuk." }

  // Reuse an already-open attempt if there is one.
  const { data: open, error: openError } = await supabase
    .from("quiz_attempts")
    .select("id, attempt_number")
    .eq("quiz_id", quizId)
    .eq("learner_id", userId)
    .eq("status", "in_progress")
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (openError) return { error: userFacingError(openError.message) }
  if (open) return { attemptId: open.id, attemptNumber: open.attempt_number }

  // No open attempt -- create one (same checks as startQuiz).
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("max_attempts, lesson_id")
    .eq("id", quizId)
    .single()

  if (quizError || !quiz) return { error: "Kuis tidak ditemukan." }

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("section:course_sections(course_id)")
    .eq("id", quiz.lesson_id)
    .single()

  if (lessonError || !lesson) return { error: "Kuis tidak ditemukan." }
  const section = Array.isArray(lesson.section) ? lesson.section[0] : lesson.section
  const courseId = section?.course_id
  if (!courseId) return { error: "Kuis tidak ditemukan." }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("learner_id", userId)
    .eq("course_id", courseId)
    .maybeSingle()

  if (enrollmentError) return { error: userFacingError(enrollmentError.message) }
  if (!enrollment) return { error: "Anda belum terdaftar di kursus ini." }

  const { data: existing, error: existingError } = await supabase
    .from("quiz_attempts")
    .select("attempt_number")
    .eq("quiz_id", quizId)
    .eq("learner_id", userId)
    .order("attempt_number", { ascending: false })
    .limit(1)

  if (existingError) return { error: userFacingError(existingError.message) }

  const attemptsUsed = existing?.[0]?.attempt_number ?? 0
  if (quiz.max_attempts !== null && attemptsUsed >= quiz.max_attempts) {
    return { error: "Kesempatan mencoba sudah habis." }
  }

  const attemptNumber = attemptsUsed + 1

  const { data: attempt, error: insertError } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      learner_id: userId,
      attempt_number: attemptNumber,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (insertError || !attempt) return { error: insertError ? userFacingError(insertError.message) : "Gagal memulai studi kasus. Coba lagi." }

  return { attemptId: attempt.id, attemptNumber }
}

/**
 * Persists in-progress assessment answers to quiz_attempts.draft_answers so a
 * learner can leave and resume a study case across days. Not scored -- only the
 * answers passed to submitQuiz()/grade_attempt() at submit time are graded.
 * RLS ("own quiz attempts updatable") restricts the write to the learner's own
 * attempt, so the where-clause ownership check is defence-in-depth.
 */
export async function saveDraft(
  attemptId: string,
  answers: Record<string, string>
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return { error: "Anda belum masuk." }

  const { error } = await supabase
    .from("quiz_attempts")
    .update({ draft_answers: answers })
    .eq("id", attemptId)
    .eq("learner_id", userId)
    .eq("status", "in_progress")

  if (error) return { error: userFacingError(error.message) }

  return { ok: true }
}

/**
 * Scoring itself runs inside the public.grade_attempt() Postgres function
 * (SECURITY DEFINER) -- it's the only place question_options.is_correct is
 * ever read on a learner's behalf, and it re-derives the course/lesson from
 * the attempt's quiz server-side rather than trusting client-supplied ids.
 * See supabase/migrations/databaseSetup.sql.
 */
export async function submitQuiz(
  attemptId: string,
  answers: Record<string, string>
): Promise<SubmitQuizResult | { error: string }> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return { error: "Anda belum masuk." }

  const { data, error } = await supabase.rpc("grade_attempt", {
    p_attempt_id: attemptId,
    p_answers: answers,
  })

  if (error) return { error: userFacingError(error.message) }

  const result = {
    ...(data as Omit<SubmitQuizResult, "explanations" | "repeatedStruggles">),
    explanations: {},
    repeatedStruggles: [],
  } as SubmitQuizResult

  // Explanations become readable (RLS) only now that this attempt is
  // submitted -- see supabase/migrations/20261028000000_question_explanations.sql.
  const { data: attemptRow } = await supabase.from("quiz_attempts").select("quiz_id").eq("id", attemptId).single()
  if (attemptRow) {
    const { data: explanationRows, error: explanationError } = await supabase
      .from("question_explanations")
      .select("question_id, explanation, question:questions!inner(quiz_id)")
      .eq("question.quiz_id", attemptRow.quiz_id)
    if (explanationError) console.error("submitQuiz explanations lookup failed:", explanationError.message)
    for (const row of explanationRows ?? []) {
      if (row.explanation.trim()) result.explanations[row.question_id] = row.explanation
    }

    /*
     * Aturan adaptif pertama: soal yang masih salah SEKARANG dan sudah >= 3
     * kali salah sepanjang riwayat peserta ini pada kuis ini.
     *
     * Dihitung dengan klien pemanggil, bukan service role: policy "own quiz
     * responses readable" membuat RLS sendiri yang membatasi hitungan ke
     * jawaban milik peserta ini, jadi tidak ada id yang perlu dipercaya dari
     * parameter. Ambangnya tiga -- dua kali salah masih wajar saat belajar;
     * tiga kali pada soal yang sama adalah pola, bukan kebetulan.
     */
    const masihSalah = Object.entries(result.perQuestion)
      .filter(([, benar]) => benar === false)
      .map(([id]) => id)

    if (masihSalah.length > 0) {
      const { data: salahRows, error: salahError } = await supabase
        .from("quiz_responses")
        .select("question_id, attempt:quiz_attempts!inner(quiz_id)")
        .eq("is_correct", false)
        .in("question_id", masihSalah)
        .eq("attempt.quiz_id", attemptRow.quiz_id)

      if (salahError) {
        console.error("submitQuiz struggle lookup failed:", salahError.message)
      } else {
        const hitung = new Map<string, number>()
        for (const row of salahRows ?? []) {
          hitung.set(row.question_id, (hitung.get(row.question_id) ?? 0) + 1)
        }
        const berulang = [...hitung].filter(([, n]) => n >= 3)

        if (berulang.length > 0) {
          const { data: soal } = await supabase
            .from("questions")
            .select("id, prompt")
            .in("id", berulang.map(([id]) => id))

          result.repeatedStruggles = berulang.map(([id, n]) => ({
            questionId: id,
            timesWrong: n,
            prompt: soal?.find((q) => q.id === id)?.prompt ?? "",
          }))
        }
      }
    }
  }

  if (result.passed) {
    const { data: attempt } = await supabase
      .from("quiz_attempts")
      .select("quiz:quizzes(lesson_id)")
      .eq("id", attemptId)
      .single()

    const quiz = attempt ? (Array.isArray(attempt.quiz) ? attempt.quiz[0] : attempt.quiz) : null
    const lessonId = quiz?.lesson_id

    if (lessonId) {
      const { data: lesson } = await supabase
        .from("lessons")
        .select("section:course_sections(course_id)")
        .eq("id", lessonId)
        .single()

      const section = lesson ? (Array.isArray(lesson.section) ? lesson.section[0] : lesson.section) : null
      const courseId = section?.course_id

      if (courseId) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("learner_id", userId)
          .eq("course_id", courseId)
          .maybeSingle()

        if (enrollment) {
          await checkAndIssueCertificate(supabase, { enrollmentId: enrollment.id, courseId, learnerId: userId })
        }
      }
    }
  }

  revalidatePath("/learn/[courseId]", "page")

  return result
}

/**
 * Database/RPC errors arrive in English (grade_attempt raises a few on
 * purpose). Show the learner Indonesian text; the raw message is logged.
 */
function userFacingError(message: string): string {
  console.error("quiz action failed:", message)
  if (/not signed in/i.test(message)) return "Anda belum masuk."
  if (/attempt not found/i.test(message)) return "Percobaan tidak ditemukan."
  if (/already submitted/i.test(message)) return "Percobaan ini sudah dikirim."
  if (/not enrolled/i.test(message)) return "Anda belum terdaftar di kursus ini."
  return "Terjadi kesalahan. Coba lagi."
}
