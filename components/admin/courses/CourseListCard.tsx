"use client"

import Link from "next/link"
import { useTransition } from "react"
import { BookOpen, Clock, Eye, Pencil, Tag } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/components/i18n/LocaleProvider"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BusyGuardProvider } from "@/components/ui/busy-guard"
import { Spinner } from "@/components/ui/spinner"
import { CourseThumb } from "@/components/CourseThumb"
import { formatCourseAccess, type Course } from "@/lib/courses"
import { toggleCourseStatusAction } from "@/app/admin/courses/actions"

import { DeleteCourseDialog } from "./DeleteCourseDialog"

/** Lencana status yang merangkap tombol: saat bekerja ia berganti kata, bukan sekadar meredup (R4). */
function StatusBadge({ isPublished, pending }: { isPublished: boolean; pending: boolean }) {
  return (
    <Badge
      variant={isPublished ? "default" : "outline"}
      className={
        isPublished
          ? "bg-success text-success-foreground"
          : "border-pill-border bg-draft-background text-destructive"
      }
    >
      {pending ? (
        <>
          <Spinner className="size-3" />
          {isPublished ? "Memindahkan…" : "Menerbitkan…"}
        </>
      ) : isPublished ? (
        "Terbit"
      ) : (
        "Draf"
      )}
    </Badge>
  )
}

export function CourseListCard({ course }: { course: Course }) {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()
  const price = formatCourseAccess(course)
  const isPublished = course.status === "published"

  function handleToggleStatus() {
    startTransition(async () => {
      const result = await toggleCourseStatusAction(course.id, isPublished ? "draft" : "published")
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(isPublished ? "Dipindahkan ke draf" : "Diterbitkan")
    })
  }

  return (
    /*
     * Penguncian berhenti di kartu ini saja (kelas (b)): kartu kursus lain
     * tetap hidup. Yang dicegah adalah menghapus kursus yang statusnya sedang
     * diubah -- penghapusan menang, lalu pengubahan status gagal dan
     * memunculkan toast galat untuk kursus yang sudah tidak ada
     * (STANDAR-UMPAN-BALIK-UI.md R14).
     */
    <BusyGuardProvider busy={isPending} reason={isPublished ? "Memindahkan…" : "Menerbitkan…"}>
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-float">
      <CourseThumb
        src={course.thumbnail_url}
        title={course.title}
        seed={course.id}
        className="mb-4 h-[160px] rounded-md"
      >
        <div className="absolute top-3 left-3">
          {isPublished ? (
            /*
             * Menarik kursus yang sudah terbit mencabut aksesnya dari peserta
             * yang sedang belajar, jadi butuh konfirmasi lebih dulu
             * (STANDAR-UMPAN-BALIK-UI.md R8). Menerbitkan draf tidak: mudah
             * dikembalikan, dan tidak ada yang kehilangan apa pun.
             */
            <AlertDialog>
              <AlertDialogTrigger
                render={<button type="button" aria-label="Terbit. Klik untuk memindahkan ke draf" />}
              >
                <StatusBadge isPublished pending={isPending} />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Pindahkan &quot;{course.title}&quot; ke draf?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Kursus akan hilang dari katalog dan peserta yang sedang mengikutinya tidak bisa
                    lagi membukanya. Progres mereka tetap tersimpan, dan Anda bisa menerbitkannya
                    kembali kapan saja.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleToggleStatus}
                    pending={isPending}
                    pendingLabel="Memindahkan…"
                  >
                    Pindahkan ke draf
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isPending}
              aria-busy={isPending || undefined}
              aria-label="Draf. Klik untuk menerbitkan"
            >
              <StatusBadge isPublished={false} pending={isPending} />
            </button>
          )}
        </div>
        <span className="absolute top-3 right-3 rounded-full bg-ring px-3 py-1 text-xs font-semibold text-white">
          {price}
        </span>
      </CourseThumb>

      <div className="mb-3 line-clamp-2 min-h-[46px] text-base leading-snug font-bold">
        {course.title}
      </div>

      <div className="mb-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <BookOpen className="size-3.5" />
          {course.lesson_count} {t.courses.lessons}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {course.duration_hours} jam
        </span>
        <span className="flex items-center gap-1.5">
          <Tag className="size-3.5" />
          {price}
        </span>
      </div>

      <div className="mb-4 min-h-0 flex-1">
        {course.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        {/* Keduanya hanya berpindah halaman dan tidak menulis apa pun, jadi
            tetap bisa dipakai selama status kursus sedang diubah. */}
        <Button
          variant="outline"
          className="h-9 flex-1"
          aria-label="Pratinjau kursus"
          ignoreBusyGuard
          render={<Link href={`/admin/courses/preview/${course.id}`} />}
          nativeButton={false}
        >
          <Eye className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          className="h-9 flex-1"
          aria-label="Ubah kursus"
          ignoreBusyGuard
          render={<Link href={`/admin/courses/${course.id}/edit`} />}
          nativeButton={false}
        >
          <Pencil className="size-3.5" />
        </Button>
        <DeleteCourseDialog courseId={course.id} courseTitle={course.title} className="h-9 flex-1" />
      </div>
    </div>
    </BusyGuardProvider>
  )
}
