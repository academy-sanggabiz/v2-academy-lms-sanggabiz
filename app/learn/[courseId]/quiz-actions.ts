"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { checkAndIssueCertificate } from "@/lib/certificates"
import { createAdminClient } from "@/lib/supabase/admin"
import { aiAktif } from "@/lib/ai/client"
import { buatPembahasan, type ItemPembahasan, type MasukanSoal } from "@/lib/ai/quiz-feedback"
import { getTranslations } from "@/lib/i18n/server"
import type { QuizMeasureKind } from "@/lib/courses"

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
    .select("lesson_id, measure_kind")
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

  /*
   * Pretest yang dibuka SETELAH orangnya mulai belajar ditandai di sini.
   *
   * Nilainya tetap miliknya dan tetap ditampilkan; yang ditolak hanyalah
   * memakainya dalam statistik kenaikan, karena "sebelum" dan "sesudah" sudah
   * tercampur. Ditandai saat percobaan DIBUAT, bukan dihitung belakangan:
   * jumlah pelajaran selesai terus bertambah, jadi pertanyaan yang sama akan
   * dijawab berbeda setiap kali ditanya nanti.
   *
   * Pagar ini di kode, bukan di basis data. Seseorang yang menyisipkan
   * barisnya sendiri lewat REST bisa menulis `false` di sini. Konsekuensinya
   * terbatas dan disengaja: kolom ini tidak menyentuh nilai, kelulusan,
   * maupun sertifikat siapa pun -- paling jauh ia mengotori satu pasangan
   * angka pada layar Perkembangan. Memindahkannya ke basis data berarti
   * menyentuh trigger yang menjaga SETIAP percobaan kuis semua orang, dan itu
   * ditunda sampai satu perubahan tersendiri dengan garis dasar sebagai
   * pembanding (scripts/garis-dasar.mjs).
   */
  let sudahMulaiBelajar = false
  if (quiz.measure_kind === "pretest") {
    const { count } = await supabase
      .from("lesson_progress")
      .select("lesson_id", { count: "exact", head: true })
      .eq("enrollment_id", enrollment.id)
      .eq("completed", true)
    sudahMulaiBelajar = (count ?? 0) > 0
  }

  const { data: attempt, error: insertError } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      learner_id: userId,
      attempt_number: attemptNumber,
      started_at: new Date().toISOString(),
      after_learning_started: sudahMulaiBelajar,
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
  const { data: attemptRow } = await supabase
    .from("quiz_attempts")
    .select("quiz_id, quiz:quizzes(lesson_id, measure_kind)")
    .eq("id", attemptId)
    .single()

  const kuis = attemptRow ? (Array.isArray(attemptRow.quiz) ? attemptRow.quiz[0] : attemptRow.quiz) : null
  const jenisUkur = (kuis?.measure_kind ?? null) as QuizMeasureKind | null

  /*
   * Pretest tidak memberi pembahasan, dan itu bukan penghematan panggilan AI.
   * Pretest diukur ulang oleh posttest atas soal yang sama; kalau kunci
   * jawabannya ditunjukkan sekarang, yang diukur posttest bukan lagi
   * "berapa banyak yang dipelajari" melainkan "berapa banyak yang diingat
   * dari halaman hasil". Posttest tetap diberi pembahasan -- setelah itu
   * tidak ada lagi yang diukur.
   */
  const bolehBahas = jenisUkur !== "pretest"

  if (attemptRow && bolehBahas) {
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

    // Tidak berlaku untuk kuis ukur: "salah tiga kali pada soal ini" adalah
    // pola belajar, dan kuis ukur hanya dikerjakan sekali. Menyarankan
    // mengulang materi setelah posttest juga keliru arah -- materinya sudah
    // selesai.
    if (masihSalah.length > 0 && jenisUkur === null) {
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

  /*
   * Kuis ukur dianggap TUNTAS begitu dikirim, bukan begitu lulus, jadi
   * pengirimannya menandai pelajarannya selesai. Tanpa ini, kursus berurutan
   * akan berhenti selamanya di pretest -- pretest yang dijawab salah semua
   * adalah hasil yang sah, bukan kegagalan.
   *
   * Penulisan pakai upsert yang sama dengan toggleLessonComplete, dan hanya
   * MENANDAI selesai, tidak pernah mencabutnya.
   */
  if (result.passed || jenisUkur !== null) {
    const lessonId = kuis?.lesson_id

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
          if (jenisUkur !== null) {
            const { error: progresError } = await supabase.from("lesson_progress").upsert(
              {
                enrollment_id: enrollment.id,
                lesson_id: lessonId,
                completed: true,
                completed_at: new Date().toISOString(),
              },
              { onConflict: "enrollment_id,lesson_id" }
            )
            if (progresError) console.error("submitQuiz measure progress upsert failed:", progresError.message)
          }

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

/* ------------------------------------------------------------------ *
 * F5: Bahas jawaban saya
 * ------------------------------------------------------------------ */

export type PembahasanHasil =
  | { ok: true; items: ItemPembahasan[] }
  | { ok: false; error: string }

/**
 * Membuat (atau mengambil ulang) pembahasan AI untuk satu percobaan kuis.
 *
 * Tiga pagar, dan ketiganya di server:
 *
 * 1. **Percobaan harus milik pemanggil dan sudah dikirim.** Memanggil ini
 *    untuk percobaan orang lain, atau untuk percobaan yang masih berjalan,
 *    ditolak -- bukan dengan menyembunyikan tombolnya, tetapi di sini.
 * 2. **Kunci jawaban dibaca dengan service role, bukan sesi peserta.**
 *    `question_options.is_correct` memang tidak pernah boleh terbaca peserta;
 *    yang menyeberang ke peramban hanyalah kalimat pembahasannya.
 * 3. **Hasilnya disimpan per percobaan.** Membuka ulang halaman hasil
 *    mengambil baris yang sama, jadi tidak ada pemanggilan AI kedua untuk
 *    percobaan yang sama -- itu juga yang membuat batas harian berarti.
 * 4. **Pretest ditolak.** Alasannya sama dengan pembahasan penulis di
 *    submitQuiz: posttest mengukur soal yang sama, jadi membahas jawaban
 *    pretest sekarang membuat angka kenaikannya mengukur ingatan atas
 *    pembahasan, bukan hasil belajar. Ditegakkan di sini, bukan dengan
 *    menyembunyikan tombolnya.
 */
export async function bahasJawabanSaya(attemptId: string): Promise<PembahasanHasil> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return { ok: false, error: "Anda belum masuk." }
  if (!aiAktif()) return { ok: false, error: "Fitur AI belum diaktifkan." }

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, learner_id, status, quiz:quizzes(measure_kind)")
    .eq("id", attemptId)
    .maybeSingle<{
      id: string
      learner_id: string
      status: string
      quiz: { measure_kind: QuizMeasureKind | null } | { measure_kind: QuizMeasureKind | null }[] | null
    }>()

  if (!attempt || attempt.learner_id !== userId) {
    return { ok: false, error: "Percobaan tidak ditemukan." }
  }
  if (attempt.status === "in_progress") {
    return { ok: false, error: "Kuis ini belum dikirim." }
  }

  const kuisPercobaan = Array.isArray(attempt.quiz) ? attempt.quiz[0] : attempt.quiz
  if (kuisPercobaan?.measure_kind === "pretest") {
    return { ok: false, error: "Pretest tidak dibahas. Pembahasannya tersedia setelah posttest." }
  }

  const admin = createAdminClient()

  // Sudah pernah dibahas? Kembalikan yang tersimpan.
  const { data: tersimpan } = await admin
    .from("ai_quiz_feedback")
    .select("items")
    .eq("attempt_id", attemptId)
    .maybeSingle<{ items: ItemPembahasan[] }>()
  if (tersimpan?.items) return { ok: true, items: tersimpan.items }

  const { data: responses } = await admin
    .from("quiz_responses")
    .select("question_id, response, is_correct")
    .eq("attempt_id", attemptId)

  const salah = ((responses ?? []) as {
    question_id: string
    response: unknown
    is_correct: boolean | null
  }[]).filter((r) => r.is_correct === false)

  if (salah.length === 0) return { ok: false, error: "Tidak ada jawaban salah untuk dibahas." }

  const ids = salah.map((r) => r.question_id)
  const [{ data: soal }, { data: opsi }, { data: penjelasan }] = await Promise.all([
    admin.from("questions").select("id, prompt, type").in("id", ids),
    admin.from("question_options").select("id, question_id, text, is_correct").in("question_id", ids),
    admin.from("question_explanations").select("question_id, explanation").in("question_id", ids),
  ])

  const petaSoal = new Map(
    ((soal ?? []) as { id: string; prompt: string; type: string }[]).map((q) => [q.id, q])
  )
  const petaPenjelasan = new Map(
    ((penjelasan ?? []) as { question_id: string; explanation: string }[]).map((e) => [
      e.question_id,
      e.explanation,
    ])
  )
  type Opsi = { id: string; question_id: string; text: string; is_correct: boolean }
  const opsiPerSoal = new Map<string, Opsi[]>()
  /** id opsi -> teksnya, untuk seluruh soal sekaligus. */
  const teksOpsi = new Map<string, string>()
  for (const o of (opsi ?? []) as Opsi[]) {
    if (!opsiPerSoal.has(o.question_id)) opsiPerSoal.set(o.question_id, [])
    opsiPerSoal.get(o.question_id)!.push(o)
    teksOpsi.set(o.id, o.text)
  }

  /**
   * Mengubah jawaban tersimpan menjadi kalimat yang bisa dibaca model.
   *
   * **Pilihan ganda disimpan sebagai id opsi**, bukan teksnya -- `QuizPlayer`
   * menyimpan `answer` sebagai id yang digabung koma. Mengirim id mentah ke AI
   * membuatnya membahas sebuah UUID: jawabannya tetap terdengar masuk akal,
   * tetapi ia menebak isi pilihannya. Itu persis yang membatalkan guna F5,
   * dan tidak terlihat dari layar mana pun -- ketahuan hanya karena keluaran
   * AI-nya diperiksa terhadap jawaban yang sebenarnya.
   */
  function bacaJawaban(questionId: string, response: unknown): string {
    const keTeks = (nilai: string): string => teksOpsi.get(nilai) ?? nilai

    if (typeof response === "string") {
      if (!response.trim()) return "(kosong)"
      return response
        .split(",")
        .map((bagian) => keTeks(bagian.trim()))
        .filter(Boolean)
        .join(", ")
    }
    if (Array.isArray(response)) return response.map((v) => keTeks(String(v))).join(", ")
    if (response && typeof response === "object") {
      const o = response as Record<string, unknown>
      if (typeof o.text === "string") return o.text
      if (Array.isArray(o.optionIds)) return o.optionIds.map((v) => keTeks(String(v))).join(", ")
      return JSON.stringify(response).slice(0, 200)
    }
    return "(kosong)"
  }

  const masukan: MasukanSoal[] = []
  for (const r of salah) {
    const q = petaSoal.get(r.question_id)
    if (!q) continue
    const daftar = opsiPerSoal.get(r.question_id) ?? []
    const benar = daftar.filter((o) => o.is_correct).map((o) => o.text).join(", ")
    masukan.push({
      questionId: r.question_id,
      prompt: q.prompt.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      jawabanPeserta: bacaJawaban(r.question_id, r.response),
      jawabanBenar: benar || "(tidak ada kunci tertulis)",
      penjelasanPenulis: petaPenjelasan.get(r.question_id),
    })
  }

  if (masukan.length === 0) return { ok: false, error: "Soalnya tidak bisa dibaca." }

  const { locale } = await getTranslations()
  const hasil = await buatPembahasan(masukan, locale)
  if (!hasil.ok) return { ok: false, error: hasil.error }

  // Disimpan dengan service role: tabelnya sengaja tidak punya policy INSERT
  // untuk siapa pun, seperti `notifications`.
  await admin.from("ai_quiz_feedback").insert({
    attempt_id: attemptId,
    items: hasil.data.items,
    model: hasil.data.model,
  })
  await admin.from("ai_usage").insert({
    user_id: userId,
    feature: "quiz-feedback",
    tokens: hasil.token,
    model: hasil.data.model,
  })

  return { ok: true, items: hasil.data.items }
}
