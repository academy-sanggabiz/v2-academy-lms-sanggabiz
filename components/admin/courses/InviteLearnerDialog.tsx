"use client"

import { useEffect, useState, useTransition, type TransitionStartFunction } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BusyGuardProvider } from "@/components/ui/busy-guard"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { LearnerSearchResult } from "@/lib/learners-admin"
import { enrollLearnerAction, searchLearnersAction } from "@/app/admin/courses/roster-actions"

const MIN_QUERY_LENGTH = 2

export function InviteLearnerDialog({
  courseId,
  open,
  onClose,
  onEnrolled,
}: {
  courseId: string
  open: boolean
  onClose: () => void
  onEnrolled: () => void
}) {
  // Transisinya dipegang di sini, bukan di dalam isi dialog, supaya penutupan
  // dialog bisa ditolak selama pendaftaran masih ditulis ke server.
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Escape, klik di luar, dan tombol X semuanya lewat sini. Menutup di
        // tengah pendaftaran menghilangkan catatan siapa yang baru didaftarkan
        // (STANDAR-UMPAN-BALIK-UI.md R16).
        if (!next && isPending) return
        if (!next) onClose()
      }}
    >
      <DialogContent className="max-w-[460px]">
        {/* "Selesai" ikut menolak klik selama proses. */}
        <BusyGuardProvider busy={isPending} reason="Mendaftarkan…">
          {/* Remount per open so the query/results don't persist between sessions */}
          {open && (
            <InviteLearnerDialogContent
              courseId={courseId}
              onClose={onClose}
              onEnrolled={onEnrolled}
              isPending={isPending}
              startTransition={startTransition}
            />
          )}
        </BusyGuardProvider>
      </DialogContent>
    </Dialog>
  )
}

function InviteLearnerDialogContent({
  courseId,
  onClose,
  onEnrolled,
  isPending,
  startTransition,
}: {
  courseId: string
  onClose: () => void
  onEnrolled: () => void
  isPending: boolean
  startTransition: TransitionStartFunction
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<LearnerSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  // The transition is shared by every row, so the row actually being enrolled
  // is tracked separately -- otherwise the whole list reads as busy.
  const [busyLearnerId, setBusyLearnerId] = useState<string | null>(null)
  // Locally enrolled this session, so rows disappear without a round trip.
  const [justEnrolled, setJustEnrolled] = useState<Set<string>>(() => new Set())

  const trimmed = query.trim()

  useEffect(() => {
    // Below the threshold there's nothing to search and nothing to reset: the
    // render below branches on `trimmed` first, so any leftover results from a
    // previous query are already unreachable.
    if (trimmed.length < MIN_QUERY_LENGTH) return

    // Debounce: a search would otherwise fire per keystroke. `cancelled` guards
    // against an earlier slow request overwriting a later one's results. All
    // setState calls live inside the timeout rather than the effect body, so
    // they can't cascade renders synchronously.
    let cancelled = false
    const timer = setTimeout(async () => {
      setIsSearching(true)
      const result = await searchLearnersAction(trimmed, courseId)
      if (cancelled) return
      setIsSearching(false)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setResults(result.data)
      setHasSearched(true)
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [trimmed, courseId])

  function handleEnroll(learner: LearnerSearchResult) {
    setBusyLearnerId(learner.id)
    startTransition(async () => {
      const result = await enrollLearnerAction(courseId, learner.id)
      setBusyLearnerId(null)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setJustEnrolled((prev) => new Set(prev).add(learner.id))
      toast.success(`${learner.name} didaftarkan`)
      onEnrolled()
    })
  }

  const selectable = results.filter((r) => !r.alreadyEnrolled && !justEnrolled.has(r.id))

  return (
    <>
      <DialogHeader>
        <DialogTitle>Undang peserta</DialogTitle>
        <DialogDescription>
          Cari peserta berdasarkan nama atau email, lalu daftarkan ke kursus ini.
        </DialogDescription>
      </DialogHeader>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nama atau email…"
          aria-label="Cari peserta berdasarkan nama atau email"
          className="bg-card pl-9"
        />
      </div>

      <div className="flex max-h-[50vh] min-h-[120px] flex-col gap-2 overflow-auto">
        {trimmed.length < MIN_QUERY_LENGTH ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Ketik minimal {MIN_QUERY_LENGTH} karakter untuk mencari.
          </p>
        ) : isSearching ? (
          <p
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"
          >
            <Spinner className="size-4" />
            Mencari…
          </p>
        ) : selectable.length === 0 ? (
          <p role="status" aria-live="polite" className="py-8 text-center text-sm text-muted-foreground">
            {hasSearched && results.length > 0
              ? "Semua peserta yang cocok sudah terdaftar."
              : "Peserta tidak ditemukan."}
          </p>
        ) : (
          selectable.map((learner) => {
            const busy = busyLearnerId === learner.id
            return (
              <button
                key={learner.id}
                type="button"
                disabled={isPending}
                aria-busy={busy || undefined}
                onClick={() => handleEnroll(learner)}
                className="flex items-center gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-ring">
                  {learner.initial}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{learner.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{learner.email}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold whitespace-nowrap">
                  {busy && <Spinner className="size-3" />}
                  {busy ? "Mendaftarkan…" : "Daftarkan"}
                </span>
              </button>
            )
          })
        )}
      </div>

      <DialogFooter>
        <Button onClick={onClose}>Selesai</Button>
      </DialogFooter>
    </>
  )
}
