"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StatusMessage } from "@/components/ui/status-message"
import { StarRating } from "@/components/learner/StarRating"
import { submitCourseFeedback } from "@/app/learner/courses/feedback-actions"

const MIN_COMMENT_LENGTH = 10

export function CourseFeedbackForm({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canSubmit = rating > 0 && comment.trim().length >= MIN_COMMENT_LENGTH

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await submitCourseFeedback({ courseId, rating, comment })
      if (!result.ok) {
        setError(result.error)
        return
      }
      // Keberhasilan terbaca dari panel yang berganti menjadi tampilan
      // sertifikat setelah refresh, jadi tidak ada toast tambahan (R6).
      router.refresh()
    })
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3.5 text-left">
      <StarRating value={rating} onChange={setRating} size="md" />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Bagaimana pendapat Anda tentang kursus ini?"
        aria-label="Ulasan kursus"
        className="min-h-[90px] bg-card"
        disabled={isPending}
      />
      <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
        <span>Minimal {MIN_COMMENT_LENGTH} karakter</span>
        <span>{comment.trim().length}/{MIN_COMMENT_LENGTH}</span>
      </div>
      <StatusMessage className="w-full">{error}</StatusMessage>
      <Button
        className="w-full bg-brand-gradient text-white hover:brightness-105"
        disabled={!canSubmit}
        pending={isPending}
        pendingLabel="Mengirim…"
        onClick={handleSubmit}
      >
        Kirim ulasan &amp; buka sertifikat
      </Button>
    </div>
  )
}
