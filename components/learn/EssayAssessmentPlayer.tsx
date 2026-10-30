"use client"

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react"
import { CheckCircle2, Clock, LinkIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BusyGuardProvider } from "@/components/ui/busy-guard"
import { BusyRegion } from "@/components/ui/busy-region"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { StatusMessage } from "@/components/ui/status-message"
import type { Question, Quiz } from "@/lib/courses"
import type { QuizAttemptInfo } from "@/lib/learn-server"
import { saveDraft, startAssessmentAttempt, submitQuiz } from "@/app/learn/[courseId]/quiz-actions"
import { useLearnBusy } from "@/components/learn/LearnBusyContext"
import { RichTextEditor } from "@/components/admin/courses/RichTextEditor"
import { QuestionPrompt } from "@/components/learn/QuestionPrompt"

type Phase = "form" | "pending" | "graded"

/**
 * Penyimpanan terakhir berjalan saat komponen sudah dilepas, jadi tidak ada
 * tempat di layar untuk menaruh pesannya. Toast membawa jawabannya sendiri di
 * dalam closure, sehingga "Coba lagi" bisa mengirim ulang teks yang sama tanpa
 * menahan perpindahan halaman.
 */
function warnDraftNotSaved(attemptId: string, answers: Record<string, string>, message: string) {
  toast.error(`${message} Draf terakhir Anda belum tersimpan.`, {
    duration: Infinity,
    action: {
      label: "Coba lagi",
      onClick: () => {
        saveDraft(attemptId, answers)
          .then((res) => {
            if ("error" in res) {
              warnDraftNotSaved(attemptId, answers, res.error)
              return
            }
            toast.success("Draf studi kasus tersimpan.")
          })
          .catch(() =>
            warnDraftNotSaved(attemptId, answers, "Draf studi kasus belum tersimpan. Periksa koneksi Anda.")
          )
      },
    },
  })
}

export function EssayAssessmentPlayer({
  quiz,
  attemptInfo,
}: {
  quiz: Quiz
  attemptInfo?: QuizAttemptInfo
}) {
  const attemptsUsed = attemptInfo?.attemptsUsed ?? 0
  const attemptsRemaining = quiz.max_attempts === null ? null : quiz.max_attempts - attemptsUsed
  const canAttempt = attemptsRemaining === null || attemptsRemaining > 0

  const initialPhase: Phase = attemptInfo?.pendingReview
    ? "pending"
    : attemptInfo?.lastPassed != null
      ? "graded"
      : "form"

  const [phase, setPhase] = useState<Phase>(initialPhase)
  const [attemptId, setAttemptId] = useState<string | null>(attemptInfo?.inProgressAttemptId ?? null)
  const [answers, setAnswers] = useState<Record<string, string>>(attemptInfo?.draftAnswers ?? {})
  // RichTextEditor's onChange is debounced, so a click that blurs the editor
  // and triggers Save/Submit in the same tick can still race the state
  // update -- this ref is the source of truth save/submit actually read
  // from, kept in lockstep with `answers` on every change.
  const answersRef = useRef(answers)
  // Isi yang sudah benar-benar ada di server, untuk membandingkan apakah masih
  // ada pekerjaan yang belum tersimpan saat halaman atau pelajaran ditinggalkan.
  const savedAnswersRef = useRef(JSON.stringify(attemptInfo?.draftAnswers ?? {}))
  const attemptIdRef = useRef(attemptId)
  const submittedRef = useRef(initialPhase !== "form")
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()
  const [isSubmitting, startSubmitting] = useTransition()
  const { setBusy } = useLearnBusy()

  function setAnswer(questionId: string, value: string) {
    const next = { ...answersRef.current, [questionId]: value }
    answersRef.current = next
    setAnswers(next)
  }

  // Esai studi kasus bisa panjang dan tidak punya autosave, jadi menutup tab
  // atau berpindah pelajaran tidak boleh membuangnya diam-diam. Penjaga ini
  // menyalin pola di LessonNotes.tsx.
  useEffect(() => {
    function hasUnsavedWork() {
      return !submittedRef.current && JSON.stringify(answersRef.current) !== savedAnswersRef.current
    }
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedWork()) e.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      const id = attemptIdRef.current
      if (!id || !hasUnsavedWork()) return
      const pending = answersRef.current
      saveDraft(id, pending)
        .then((res) => {
          if ("error" in res) warnDraftNotSaved(id, pending, res.error)
        })
        .catch(() =>
          warnDraftNotSaved(
            id,
            pending,
            "Draf studi kasus belum tersimpan. Periksa koneksi Anda."
          )
        )
    }
  }, [])

  // Get-or-create the learner's open attempt, caching its id locally so repeated
  // saves/submit reuse the same attempt rather than spawning duplicates.
  async function ensureAttempt(): Promise<string | null> {
    if (attemptId) return attemptId
    const res = await startAssessmentAttempt(quiz.id)
    if ("error" in res) {
      setError(res.error)
      return null
    }
    setAttemptId(res.attemptId)
    attemptIdRef.current = res.attemptId
    return res.attemptId
  }

  function handleSaveDraft() {
    setError(null)
    startSaving(async () => {
      const id = await ensureAttempt()
      if (!id) return
      const sent = answersRef.current
      const res = await saveDraft(id, sent)
      if ("error" in res) {
        setError(res.error)
        return
      }
      savedAnswersRef.current = JSON.stringify(sent)
      setSavedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }))
    })
  }

  function handleSubmit() {
    setError(null)
    // Sama seperti kuis biasa: pengiriman memakai satu percobaan, jadi daftar
    // isi dan panah pindah pelajaran dikunci sampai fase berganti ke "pending"
    // -- pergi di tengah membuat peserta tidak pernah melihat konfirmasinya
    // (STANDAR-UMPAN-BALIK-UI.md R16).
    setBusy(true, "Mengirim studi kasus…")
    startSubmitting(async () => {
      try {
        const id = await ensureAttempt()
        if (!id) return
        const sent = answersRef.current
        const res = await submitQuiz(id, sent)
        if ("error" in res) {
          setError(res.error)
          return
        }
        savedAnswersRef.current = JSON.stringify(sent)
        submittedRef.current = true
        setPhase("pending")
      } finally {
        setBusy(false)
      }
    })
  }

  if (phase === "pending") {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
            <Clock className="size-6 text-ring" />
          </div>
          <div className="text-xl font-bold">Terkirim, menunggu penilaian</div>
          <p className="max-w-md text-sm text-muted-foreground">
            Studi kasus Anda sudah dikirim ke instruktur untuk dinilai. Hasilnya akan tampil di sini
            setelah penilaian selesai.
          </p>
        </div>
      </Shell>
    )
  }

  if (phase === "graded") {
    const passed = attemptInfo?.lastPassed === true
    return (
      <Shell>
        <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-12 text-center">
          <div className="text-[15px] font-semibold text-muted-foreground">Hasil Studi Kasus</div>
          {attemptInfo?.lastScore != null ? (
            <div
              className={cn(
                "text-5xl font-bold",
                passed ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
              )}
            >
              {attemptInfo.lastScore}%
            </div>
          ) : (
            <div className="flex items-center gap-2 text-2xl font-bold">
              <CheckCircle2 className="size-6 text-emerald-700 dark:text-emerald-400" />
              Sudah dinilai
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {passed ? "Anda lulus studi kasus ini." : "Percobaan ini belum lulus."}
          </p>
          {canAttempt && (
            <Button
              size="xl"
              variant="outline"
              className="mt-2"
              onClick={() => {
                answersRef.current = {}
                savedAnswersRef.current = "{}"
                attemptIdRef.current = null
                submittedRef.current = false
                setAnswers({})
                setAttemptId(null)
                setSavedAt(null)
                setPhase("form")
              }}
            >
              Mulai Percobaan Baru
            </Button>
          )}
        </div>
      </Shell>
    )
  }

  if (!canAttempt) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Kesempatan mencoba studi kasus ini sudah habis.
        </div>
      </Shell>
    )
  }

  const isBusy = isSaving || isSubmitting

  // Permukaan ini dikunci sebatas formulirnya saja (kelas (c)): tombol Simpan
  // Draf berhenti menerima klik lewat guard -- bukan `disabled` -- supaya fokus
  // keyboard tidak hilang di tengah pengiriman (R11, R14).
  return (
    <BusyGuardProvider
      busy={isBusy}
      reason={isSubmitting ? "Mengirim studi kasus…" : "Menyimpan draf…"}
    >
      <Shell>
        <div className="text-2xl font-bold">{quiz.title}</div>

        {/* Esainya tidak boleh berubah selama yang lama sedang dikirim (R17). */}
        <BusyRegion busy={isSubmitting} label="Mengirim studi kasus…">
          <div className="flex flex-col gap-4">
            {quiz.questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                value={answers[question.id] ?? ""}
                onChange={(value) => setAnswer(question.id, value)}
              />
            ))}
          </div>
        </BusyRegion>

        <StatusMessage>{error}</StatusMessage>

        <div className="sticky bottom-0 flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-4 backdrop-blur">
          <div role="status" aria-live="polite" className="flex-1 text-xs text-muted-foreground">
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <Spinner className="size-3.5" />
                Menyimpan…
              </span>
            ) : savedAt ? (
              `Draf tersimpan pukul ${savedAt}`
            ) : (
              "Belum disimpan"
            )}
          </div>
          <Button
            variant="outline"
            size="lg"
            pending={isSaving}
            pendingLabel="Menyimpan…"
            onClick={handleSaveDraft}
          >
            Simpan Draf
          </Button>
          <Button
            size="lg"
            pending={isSubmitting}
            pendingLabel="Mengirim…"
            onClick={handleSubmit}
            className="bg-brand-gradient text-white hover:brightness-105"
          >
            Kirim Studi Kasus
          </Button>
        </div>
      </Shell>
    </BusyGuardProvider>
  )
}

function QuestionCard({
  question,
  index,
  value,
  onChange,
}: {
  question: Question
  index: number
  value: string
  onChange: (value: string) => void
}) {
  const isChoice = question.type === "multiple_choice" || question.type === "true_false"
  const selectedIds = isChoice ? value.split(",").filter(Boolean) : []

  function toggleOption(optionId: string) {
    if (question.type === "multiple_choice" && question.allow_multiple) {
      const next = selectedIds.includes(optionId)
        ? selectedIds.filter((id) => id !== optionId)
        : [...selectedIds, optionId]
      onChange(next.join(","))
    } else {
      onChange(optionId)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-7">
      <div className="text-sm font-semibold text-muted-foreground">Soal {index + 1}</div>

      <QuestionPrompt prompt={question.prompt} className="text-[17px]" />

      {isChoice ? (
        <div className="flex flex-col gap-3">
          {question.options.map((option) => {
            const selected = selectedIds.includes(option.id)
            const multi = question.type === "multiple_choice" && question.allow_multiple
            return (
              <button
                key={option.id}
                type="button"
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
                <div className="text-[15px] font-semibold">{option.text}</div>
              </button>
            )
          })}
        </div>
      ) : question.type === "essay" ? (
        <RichTextEditor ariaLabel="Jawaban Anda" value={value} onChange={onChange} />
      ) : question.type === "file_upload" ? (
        <FileUploadAnswer value={value} onChange={onChange} />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ketik jawaban Anda..."
          aria-label="Jawaban Anda"
          className="min-h-[120px] w-full resize-y rounded-lg border border-input bg-card p-3.5 text-[15px] outline-none focus:border-ring"
        />
      )}
    </div>
  )
}

// Renders a file_upload answer as a plain link field -- the learner pastes a
// URL to their file (e.g. a Google Drive share link) instead of uploading a
// binary, so `value` is always a plain URL string, viewable directly.
export function FileUploadAnswer({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://drive.google.com/... (tautan ke PDF atau dokumen Anda)"
        aria-label="Tautan jawaban Anda"
      />
      {value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit items-center gap-2 text-sm text-ring underline underline-offset-4"
        >
          <LinkIcon className="size-4" />
          Buka tautan yang dikirim
        </a>
      )}
    </div>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[900px] flex-col gap-4 px-6 py-10">{children}</div>
}
