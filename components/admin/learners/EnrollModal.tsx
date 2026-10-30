"use client"

import { useEffect, useState, useTransition, type TransitionStartFunction } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BusyGuardProvider } from "@/components/ui/busy-guard"
import { Spinner } from "@/components/ui/spinner"
import type { Course } from "@/lib/courses"
import type { AdminLearner } from "@/lib/learners-admin"
import { getLearnerEnrolledCourseIdsAction, toggleLearnerEnrollmentAction } from "@/app/admin/learners/actions"

export function EnrollModal({
  learner,
  courses,
  onClose,
}: {
  learner: AdminLearner | null
  courses: Course[]
  onClose: () => void
}) {
  // Transisinya dipegang di sini, bukan di dalam isi modal, supaya penutupan
  // dialog bisa ditolak selama pendaftaran masih ditulis ke server.
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog
      open={!!learner}
      onOpenChange={(open) => {
        // Escape, klik di luar, dan tombol X semuanya lewat sini. Menutup di
        // tengah penulisan menghilangkan catatan kursus mana yang baru saja
        // diubah (STANDAR-UMPAN-BALIK-UI.md R16).
        if (!open && isPending) return
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-[460px]">
        {/* "Selesai" dan "Batal" di dalamnya ikut menolak klik selama proses. */}
        <BusyGuardProvider busy={isPending} reason="Menyimpan…">
          {learner && (
            <EnrollModalContent
              key={learner.id}
              learner={learner}
              courses={courses}
              onClose={onClose}
              isPending={isPending}
              startTransition={startTransition}
            />
          )}
        </BusyGuardProvider>
      </DialogContent>
    </Dialog>
  )
}

function EnrollModalContent({
  learner,
  courses,
  onClose,
  isPending,
  startTransition,
}: {
  learner: AdminLearner
  courses: Course[]
  onClose: () => void
  isPending: boolean
  startTransition: TransitionStartFunction
}) {
  const [enrolledIds, setEnrolledIds] = useState<Set<string> | null>(null)
  // The transition is shared by every row, so the row actually being changed
  // is tracked separately -- otherwise the whole list reads as busy.
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null)
  const [confirmFor, setConfirmFor] = useState<string | null>(null)

  // The paginated learner list no longer carries each row's enrolled course
  // ids, so fetch them for this one learner when the modal opens.
  useEffect(() => {
    let cancelled = false
    getLearnerEnrolledCourseIdsAction(learner.id).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        toast.error(result.error)
        setEnrolledIds(new Set())
        return
      }
      setEnrolledIds(new Set(result.data))
    })
    return () => {
      cancelled = true
    }
  }, [learner.id])

  function toggle(courseId: string, currentlyEnrolled: boolean) {
    setBusyCourseId(courseId)
    startTransition(async () => {
      const result = await toggleLearnerEnrollmentAction(learner.id, courseId, !currentlyEnrolled)
      setBusyCourseId(null)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setConfirmFor(null)
      setEnrolledIds((prev) => {
        const next = new Set(prev)
        if (currentlyEnrolled) next.delete(courseId)
        else next.add(courseId)
        return next
      })
      toast.success(currentlyEnrolled ? "Pendaftaran dibatalkan" : "Didaftarkan")
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Daftarkan {learner.name}</DialogTitle>
        <DialogDescription>Pilih kursus untuk mendaftarkan atau membatalkan pendaftaran peserta ini</DialogDescription>
      </DialogHeader>

      {enrolledIds === null ? (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"
        >
          <Spinner className="size-4" />
          Memuat…
        </div>
      ) : (
        <div className="flex max-h-[50vh] flex-col gap-2 overflow-auto">
          {courses.map((course) => {
            const enrolled = enrolledIds.has(course.id)
            const busy = busyCourseId === course.id
            const badgeLabel = busy
              ? enrolled
                ? "Membatalkan…"
                : "Mendaftarkan…"
              : enrolled
                ? "Terdaftar ✓"
                : "Daftarkan"
            const badge = (
              <span
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                  enrolled ? "bg-secondary text-ring" : "bg-muted text-muted-foreground"
                }`}
              >
                {busy && <Spinner className="size-3" />}
                {badgeLabel}
              </span>
            )
            const rowClassName =
              "flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted disabled:pointer-events-none disabled:opacity-60"

            if (!enrolled) {
              return (
                <button
                  key={course.id}
                  type="button"
                  disabled={isPending}
                  aria-busy={busy || undefined}
                  onClick={() => toggle(course.id, false)}
                  className={rowClassName}
                >
                  <span className="truncate text-sm font-semibold">{course.title}</span>
                  {badge}
                </button>
              )
            }

            return (
              <AlertDialog
                key={course.id}
                open={confirmFor === course.id}
                onOpenChange={(next) => {
                  if (!next && isPending) return
                  setConfirmFor(next ? course.id : null)
                }}
              >
                <AlertDialogTrigger
                  render={
                    <button
                      type="button"
                      disabled={isPending}
                      aria-busy={busy || undefined}
                      className={rowClassName}
                    />
                  }
                >
                  <span className="truncate text-sm font-semibold">{course.title}</span>
                  {badge}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Batalkan pendaftaran {learner.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Pendaftaran beserta progres belajar peserta ini di &quot;{course.title}&quot;
                      akan dihapus. Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                      pending={busy}
                      pendingLabel="Membatalkan…"
                      onClick={() => toggle(course.id, true)}
                    >
                      Batalkan pendaftaran
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          })}
        </div>
      )}

      <DialogFooter>
        <Button onClick={onClose}>Selesai</Button>
      </DialogFooter>
    </>
  )
}
