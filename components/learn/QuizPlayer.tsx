"use client"

import { useState, useTransition, useMemo} from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, CircleHelp, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StatusMessage } from "@/components/ui/status-message"
import { type Quiz } from "@/lib/courses"
import { orderQuestionsForAttempt } from "@/lib/quiz-shuffle"
import type { QuizAttemptInfo } from "@/lib/learn-server"
import { startQuiz, submitQuiz, type SubmitQuizResult } from "@/app/learn/[courseId]/quiz-actions"
import { FileUploadAnswer } from "@/components/learn/EssayAssessmentPlayer"
import { QuestionPrompt } from "@/components/learn/QuestionPrompt"
import { useLearnBusy } from "@/components/learn/LearnBusyContext"
import { useI18n } from "@/components/i18n/LocaleProvider"

type Stage = "intro" | "active" | "results"

/** Cuplikan soal untuk kalimat saran: paragraf pertama, tanpa markup,
 *  dipenggal di batas kata. Soal utuhnya sudah tampil di daftar bawah. */
function cuplikanSoal(html: string): string {
  const paragraf = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  const teks = (paragraf ? paragraf[1] : html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  if (teks.length <= 70) return teks
  return teks.slice(0, 70).replace(/\s+\S*$/, "") + "\u2026"
}

export function QuizPlayer({
  quiz,
  attemptInfo,
  nextHref,
  reviewLessons,
  onReachEnd,
}: {
  quiz: Quiz
  attemptInfo?: QuizAttemptInfo
  /** Pelajaran berikutnya, atau null bila kuis ini yang terakhir. */
  nextHref: string | null
  /**
   * Pelajaran materi di modul yang sama, untuk ditautkan saat jawaban salah.
   * STANDAR-DIGITAL-LEARNING §14: setiap soal harus bisa ditelusuri kembali ke
   * materi yang mengajarkannya -- skor tanpa jalan kembali tidak mengajari
   * apa pun.
   */
  reviewLessons: { href: string; title: string }[]
  onReachEnd: () => void
}) {
  const [stage, setStage] = useState<Stage>("intro")
  const [isPending, startTransition] = useTransition()
  const { t } = useI18n()
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [attemptNumber, setAttemptNumber] = useState(1)
  /** Soal yang ditarik basis data untuk percobaan ini; null = semuanya. */
  const [drawnIds, setDrawnIds] = useState<string[] | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)

  /*
   * Urutan tampil untuk percobaan ini. Dihitung dari id percobaan, jadi tetap
   * sama selama percobaan berlangsung -- menyegarkan halaman atau mundur ke
   * soal sebelumnya tidak mengacak ulang. Lihat lib/quiz-shuffle.ts.
   */
  const questions = useMemo(
    () => orderQuestionsForAttempt(quiz.questions, { enabled: quiz.shuffle, attemptId, drawnIds }),
    [quiz.questions, quiz.shuffle, attemptId, drawnIds]
  )
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<SubmitQuizResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { setBusy } = useLearnBusy()

  const attemptsUsed = attemptInfo?.attemptsUsed ?? 0
  /*
   * Kuis biasa tidak lagi dibatasi jumlah percobaan: kuis bernilai lulus
   * mengukur apakah peserta akhirnya paham, bukan apakah ia paham dalam tiga
   * kali. Batas lama membuat peserta yang gagal tiga kali mentok permanen --
   * tidak bisa lulus, tidak bisa menulis ulasan, tidak akan pernah menerima
   * sertifikat. Studi kasus tetap bisa dibatasi lewat quizzes.max_attempts
   * karena dinilai manusia (lihat EssayAssessmentPlayer).
   */
  const canAttempt = true
  const alreadyPassed = attemptInfo?.lastPassed === true

  function handleStart() {
    setError(null)
    startTransition(async () => {
      const res = await startQuiz(quiz.id)
      if ("error" in res) {
        setError(res.error)
        return
      }
      setAttemptId(res.attemptId)
      setAttemptNumber(res.attemptNumber)
      setDrawnIds(res.questionIds)
      setQuestionIndex(0)
      setAnswers({})
      setStage("active")
    })
  }

  function handleNext(isLast: boolean) {
    if (!isLast) {
      setQuestionIndex((i) => i + 1)
      return
    }
    if (!attemptId) return
    setError(null)
    // Pengiriman memakai satu jatah percobaan dan layar hasilnya tidak bisa
    // dibuka ulang, jadi daftar isi dan panah pindah pelajaran dikunci sampai
    // hasilnya tampil (STANDAR-UMPAN-BALIK-UI.md R16).
    setBusy(true, "Menilai jawaban Anda…")
    startTransition(async () => {
      try {
        const res = await submitQuiz(attemptId, answers)
        if ("error" in res) {
          setError(res.error)
          return
        }
        setResult(res)
        setStage("results")
      } finally {
        setBusy(false)
      }
    })
  }

  if (stage === "intro") {
    return (
      <div className="mx-auto w-full max-w-[640px] px-6">
        <div className="rounded-2xl border border-border bg-card p-14 text-center shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-secondary">
              <CircleHelp className="size-6 text-ring" />
            </div>
            <div className="text-xl font-bold">{quiz.title}</div>
            <p className="text-sm text-muted-foreground">
              {questions.length} soal · uji pemahaman Anda tentang modul ini
            </p>
            {attemptInfo?.pendingReview && (
              <p className="text-sm text-muted-foreground">Percobaan terakhir Anda sedang menunggu penilaian instruktur.</p>
            )}
            <StatusMessage>{error}</StatusMessage>
            {canAttempt ? (
              <Button
                size="xl"
                pending={isPending}
                pendingLabel="Menyiapkan…"
                onClick={handleStart}
                className="bg-brand-gradient text-white hover:brightness-105"
              >
                {attemptsUsed > 0 ? "Ulangi Kuis" : "Mulai Kuis"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {alreadyPassed ? "Anda sudah lulus kuis ini." : "Kesempatan mencoba sudah habis."}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (stage === "active") {
    const question = questions[questionIndex]
    const isLast = questionIndex === questions.length - 1
    const isChoice = question.type === "multiple_choice" || question.type === "true_false"
    const selectedIds = isChoice ? (answers[question.id] ?? "").split(",").filter(Boolean) : []
    const hasAnswer = isChoice ? selectedIds.length > 0 : !!answers[question.id]?.trim()

    function toggleOption(optionId: string) {
      if (question.type === "multiple_choice" && question.allow_multiple) {
        const next = selectedIds.includes(optionId)
          ? selectedIds.filter((id) => id !== optionId)
          : [...selectedIds, optionId]
        setAnswers((a) => ({ ...a, [question.id]: next.join(",") }))
      } else {
        setAnswers((a) => ({ ...a, [question.id]: optionId }))
      }
    }

    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-5 p-10">
        <div className="rounded-2xl border border-border bg-card p-7">
          <div className="flex items-start justify-between gap-3.5">
            <div className="text-2xl font-bold">
              Soal {questionIndex + 1} dari {questions.length}
            </div>
            <div className="shrink-0 rounded-full bg-secondary px-4 py-2 text-sm font-semibold whitespace-nowrap">
              Percobaan {attemptNumber}
            </div>
          </div>
          <QuestionPrompt prompt={question.prompt} className="mt-4 text-xl" />
        </div>

        {isChoice ? (
          <div
            role={question.type === "multiple_choice" && question.allow_multiple ? "group" : "radiogroup"}
            aria-label="Pilihan jawaban"
            className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-6"
          >
            {question.type === "multiple_choice" && question.allow_multiple && (
              <p className="text-sm text-muted-foreground">Pilih semua jawaban yang sesuai.</p>
            )}
            {question.options.map((option) => {
              const selected = selectedIds.includes(option.id)
              const multi = question.type === "multiple_choice" && question.allow_multiple
              return (
                <button
                  key={option.id}
                  type="button"
                  role={multi ? "checkbox" : "radio"}
                  aria-checked={selected}
                  onClick={() => toggleOption(option.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-5 py-4 text-left hover:border-ring",
                    selected ? "border-ring" : "border-input"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center border-2",
                      multi ? "rounded-sm" : "rounded-full",
                      selected ? "border-ring" : "border-input"
                    )}
                  >
                    {selected && <div className={cn("size-2 bg-ring", multi ? "rounded-xs" : "rounded-full")} />}
                  </div>
                  <div className="text-base font-semibold">{option.text}</div>
                </button>
              )
            })}
          </div>
        ) : question.type === "file_upload" ? (
          <div className="rounded-2xl border border-border bg-card p-6">
            <FileUploadAnswer
              value={answers[question.id] ?? ""}
              onChange={(value) => setAnswers((a) => ({ ...a, [question.id]: value }))}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6">
            <textarea
              aria-label="Jawaban Anda"
              value={answers[question.id] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [question.id]: e.target.value }))}
              placeholder="Ketik jawaban Anda..."
              className="min-h-[120px] w-full resize-y rounded-lg border border-input bg-card p-3.5 text-base outline-none focus:border-ring"
            />
          </div>
        )}

        <StatusMessage>{error}</StatusMessage>

        {/*
         * Tombolnya sengaja tidak dimatikan saat jawaban masih kosong. Tombol
         * mati tidak bisa ditanyai: peserta menekannya, tidak terjadi apa-apa,
         * dan tidak ada yang memberi tahu kenapa (STANDAR-DIGITAL-LEARNING §14,
         * "tombol submit tidak mati tanpa penjelasan"). Sekarang ia menjawab.
         */}
        <Button
          size="xl"
          pending={isPending}
          pendingLabel={isLast ? "Mengirim…" : "Memuat…"}
          onClick={() => {
            if (!hasAnswer) {
              setError(
                isChoice
                  ? "Pilih salah satu jawaban dulu sebelum lanjut."
                  : "Tuliskan jawaban Anda dulu sebelum lanjut."
              )
              return
            }
            handleNext(isLast)
          }}
          className="w-full bg-brand-gradient text-white hover:brightness-105"
        >
          {isLast ? "Kirim Kuis" : "Soal Berikutnya"}
        </Button>
      </div>
    )
  }

  if (stage === "results" && result) {
    const canRetry = true

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-5 p-10">
        <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-10 text-center">
          <div className="text-base font-semibold text-muted-foreground">Hasil Kuis</div>
          {result.pending ? (
            <>
              <div className="text-2xl font-bold text-muted-foreground">Menunggu penilaian</div>
              <p className="text-sm text-muted-foreground">
                Kuis ini berisi soal yang dinilai oleh instruktur. Nilai akhir Anda akan
                tampil setelah penilaian selesai.
              </p>
            </>
          ) : (
            <>
              <div
                className={cn(
                  "text-5xl font-bold",
                  result.passed ? "text-emerald-700" : "text-destructive"
                )}
              >
                {result.score}%
              </div>
              <div className="text-sm text-muted-foreground">
                {result.correctCount} dari {result.total} benar · {result.passed ? "Lulus" : "Belum lulus"}
              </div>
              {/* Feedback ends with the next step (Hattie & Timperley: where to next). */}
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {result.passed
                  ? "Anda lulus kuis ini. Lanjutkan ke pelajaran berikutnya."
                  : canRetry
                    ? "Baca penjelasan di bawah, pelajari kembali materi terkait, lalu coba lagi."
                    : "Baca penjelasan di bawah dan pelajari kembali materi terkait."}
              </p>
            </>
          )}
        </div>

        {/*
          Aturan adaptif pertama, dan tiga syarat Day 12 yang dipenuhinya:
          TERLIHAT (kotak tersendiri, bukan perubahan diam-diam), BERALASAN
          (menyebut data pemicunya: soal mana, berapa kali), dan BISA
          DIABAIKAN (kalimat terakhir menegaskan mencoba lagi tetap boleh,
          dan tombol Coba Lagi tidak berubah sedikit pun).
        */}
        {result.repeatedStruggles.length > 0 && reviewLessons.length > 0 && (
          <section
            aria-label={t.adaptive.suggestTitle}
            className="rounded-xl border border-ring/40 bg-secondary/40 p-4 text-left"
          >
            <p className="text-sm font-semibold">{t.adaptive.suggestTitle}</p>
            <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
              {result.repeatedStruggles.map((item) => (
                <li key={item.questionId}>
                  {t.adaptive.struggled
                    .replace("{soal}", cuplikanSoal(item.prompt))
                    .replace("{n}", String(item.timesWrong))}
                </li>
              ))}
            </ul>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span>{t.adaptive.reason}</span>
              {reviewLessons.map((lesson) => (
                <Link
                  key={lesson.href}
                  href={lesson.href}
                  className="font-semibold text-ring underline underline-offset-4"
                >
                  {lesson.title}
                </Link>
              ))}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{t.adaptive.freedom}</p>
          </section>
        )}

        <div className="flex flex-col gap-3">
          {questions.map((question) => {
            const isCorrect = result.perQuestion[question.id]
            const answer = answers[question.id] ?? ""
            const answerText =
              question.type === "multiple_choice" || question.type === "true_false"
                ? answer
                    .split(",")
                    .filter(Boolean)
                    .map((id) => question.options.find((o) => o.id === id)?.text ?? "—")
                    .join(", ") || "—"
                : question.type === "file_upload"
                  ? answer
                    ? "Tautan terkirim"
                    : "—"
                  : answer || "—"

            return (
              <div
                key={question.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4.5"
              >
                {isCorrect === true && (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden />
                )}
                {isCorrect === false && (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
                )}
                {isCorrect === null && (
                  <CircleHelp className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  {/* State in words, not only by icon colour (WCAG 1.4.1). */}
                  <div
                    className={cn(
                      "mb-1 text-xs font-semibold tracking-wide uppercase",
                      isCorrect === true && "text-emerald-700",
                      isCorrect === false && "text-destructive",
                      isCorrect === null && "text-muted-foreground"
                    )}
                  >
                    {isCorrect === true ? "Benar" : isCorrect === false ? "Salah" : "Menunggu penilaian"}
                  </div>
                  <QuestionPrompt prompt={question.prompt} className="text-sm font-semibold" />
                  <div className="mt-1 text-sm text-muted-foreground">Jawaban Anda: {answerText}</div>
                  {result.explanations?.[question.id] && (
                    <p className="mt-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm leading-relaxed text-foreground">
                      <span className="font-semibold">Penjelasan: </span>
                      {result.explanations[question.id]}
                    </p>
                  )}
                  {isCorrect === false && reviewLessons.length > 0 && (
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Pelajari lagi:</span>
                      {reviewLessons.map((lesson) => (
                        <Link
                          key={lesson.href}
                          href={lesson.href}
                          className="text-ring underline underline-offset-4"
                        >
                          {lesson.title}
                        </Link>
                      ))}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          {canRetry && (
            <Button
              size="xl"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setResult(null)
                setStage("intro")
              }}
            >
              Ulangi Kuis
            </Button>
          )}
          {nextHref ? (
            <Button
              size="xl"
              className="flex-1 bg-brand-gradient text-white hover:brightness-105"
              render={<Link href={nextHref} />}
              nativeButton={false}
            >
              Pelajaran berikutnya
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              size="xl"
              className="flex-1 bg-brand-gradient text-white hover:brightness-105"
              onClick={onReachEnd}
            >
              Selesaikan kursus
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return null
}
