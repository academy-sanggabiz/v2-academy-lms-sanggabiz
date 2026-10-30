"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { toggleLessonComplete } from "@/app/learn/[courseId]/actions"

/**
 * Kotak centang progres di sidebar pemutar.
 *
 * Centangnya berubah seketika (optimistic) karena menunggu balasan server
 * membuat peserta mengira kliknya tidak masuk, lalu mengklik lagi
 * (STANDAR-UMPAN-BALIK-UI.md R2). Bila server menolak, centang dikembalikan
 * dan alasannya ditampilkan -- dulu kegagalan di sini sepenuhnya diam (R7).
 */
export function LessonCompleteCheckbox({
  courseId,
  lessonId,
  title,
  isDone,
}: {
  courseId: string
  lessonId: string
  title: string
  isDone: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState<{ value: boolean; from: boolean } | null>(null)

  // Server sudah menyusul: lepaskan nilai sementara. Disetel saat render, bukan
  // di useEffect -- lint React Compiler repo ini menolak setState di effect.
  if (optimistic && optimistic.from !== isDone) setOptimistic(null)

  const done = optimistic ? optimistic.value : isDone

  function onToggle() {
    const next = !done
    setOptimistic({ value: next, from: isDone })

    startTransition(async () => {
      const result = await toggleLessonComplete({ courseId, lessonId, completed: next })
      if (!result.ok) {
        setOptimistic(null)
        toast.error(result.error)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      aria-busy={pending || undefined}
      aria-label={done ? `Tandai "${title}" belum selesai` : `Tandai "${title}" selesai`}
      /* Area sentuh 24px di sekitar kotak 18px (WCAG 2.5.8 target size). */
      className="-m-[3px] flex size-6 shrink-0 items-center justify-center rounded"
    >
      <span
        className={cn(
          "flex size-[18px] items-center justify-center rounded border transition-colors",
          done ? "border-ring bg-ring" : "border-input bg-card"
        )}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" aria-hidden>
            <path d="M5 13 L10 18 L19 7" />
          </svg>
        )}
      </span>
    </button>
  )
}
