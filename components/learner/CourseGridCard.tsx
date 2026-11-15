import Link from "next/link"
import { BookOpen, CircleCheck, Clock, Eye, Tag } from "lucide-react"
import { useI18n } from "@/components/i18n/LocaleProvider"

import { Button } from "@/components/ui/button"
import { CourseThumb } from "@/components/CourseThumb"
import { EnrollButton } from "@/components/learner/EnrollButton"
import { formatCourseAccess, type Course } from "@/lib/courses"
import type { KemajuanKursus } from "@/lib/enrollments-server"

export function CourseGridCard({
  course,
  enrolled,
  started,
  kemajuan,
}: {
  course: Course
  enrolled: boolean
  started: boolean
  /** Tidak ada bila peserta belum mendaftar di kursus ini. */
  kemajuan?: KemajuanKursus
}) {
  const { t } = useI18n()
  const price = formatCourseAccess(course, t.courses)

  /*
    Persennya dihitung dari jumlah pelajaran yang BENAR-BENAR ada di kurikulum
    (`totalCount`), bukan dari kolom `courses.lesson_count`. Kolom itu angka
    yang diketik penyusun di Info Dasar dan bisa tertinggal dari kurikulumnya;
    memakai keduanya akan memunculkan "6 dari 5 pelajaran" di layar peserta.
  */
  const persen =
    kemajuan && kemajuan.totalCount > 0
      ? Math.round((kemajuan.doneCount / kemajuan.totalCount) * 100)
      : null

  return (
    <div className="@container flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-float">
      <Link href={`/learner/courses/${course.id}`} className="block">
        <CourseThumb
          src={course.thumbnail_url}
          title={course.title}
          seed={course.id}
          className="mb-4 h-[190px] rounded-md"
        >
          <span className="absolute top-3 right-3 rounded-full bg-ring px-3 py-1 text-xs font-semibold text-white">
            {price}
          </span>
        </CourseThumb>

        <div className="mb-3 line-clamp-2 min-h-[46px] text-xl leading-snug font-bold">
          {course.title}
        </div>
      </Link>

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

      {/*
        Emblem dan kemajuan hanya untuk kursus yang diikuti. Statusnya diambil
        dari `enrollments.status`, bukan dari "persen sudah 100": kursus bisa
        punya semua pelajaran terbuka sementara kuisnya belum lulus, dan
        emblem yang muncul lebih dulu daripada sertifikatnya akan terasa
        sebagai janji yang diingkari.
      */}
      {kemajuan && (
        <div className="mb-3.5">
          {kemajuan.selesai ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success-foreground/25 bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground">
              <CircleCheck className="size-3.5 shrink-0" aria-hidden />
              {t.courses.finishedBadge}
            </span>
          ) : (
            <>
              {/*
                Bilahnya hiasan: `aria-hidden`, dan angkanya ditulis sebagai
                teks di bawahnya. Status tidak boleh hanya warna atau hanya
                panjang (STANDAR-DIGITAL-LEARNING: setiap status punya teks).
              */}
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div
                  className="h-full rounded-full bg-brand-gradient transition-[width]"
                  style={{ width: `${persen ?? 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {persen === 0
                  ? t.courses.notStartedYet
                  : `${t.courses.progressOf
                      .replace("{selesai}", String(kemajuan.doneCount))
                      .replace("{total}", String(kemajuan.totalCount))} · ${t.courses.progressPercent.replace(
                      "{persen}",
                      String(persen ?? 0)
                    )}`}
              </p>
            </>
          )}
        </div>
      )}

      <div className="mb-4 min-h-0 flex-1">
        {course.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        )}
      </div>

      {/*
        Ditumpuk kalau kartunya sempit, berdampingan kalau lebar. Ukurannya
        diambil dari lebar KARTU (`@container`), bukan lebar layar: di layar
        lebar pun kartu ini hanya selebar sepertiga kisi, dan dua tombol
        berdampingan membuat label "Lanjutkan belajar" menyembul keluar dari
        batas tombol -- `flex-1` tidak menolong karena isi tombol tidak bisa
        menyusut di bawah lebar teksnya. Menumpuknya juga memperbesar sasaran
        sentuh (standar G3).
      */}
      <div className="mt-auto flex flex-col gap-3 @[22rem]:flex-row">
        <Button
          variant="outline"
          className="h-11 min-w-0 @[22rem]:flex-1"
          render={<Link href={`/learner/courses/${course.id}`} />}
          nativeButton={false}
        >
          <Eye className="size-3.5" />
          Pratinjau
        </Button>
        <EnrollButton
          courseId={course.id}
          state={
            !enrolled
              ? "not_enrolled"
              : kemajuan?.selesai
                ? "completed"
                : started
                  ? "in_progress"
                  : "not_started"
          }
          className="h-11 min-w-0 @[22rem]:flex-1"
        />
      </div>
    </div>
  )
}
