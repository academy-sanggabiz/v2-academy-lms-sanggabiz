import Link from "next/link"
import { AlertTriangle, CalendarClock } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { CourseThumb } from "@/components/CourseThumb"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { sisaHari, type JobCourseRow } from "@/lib/org"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

/**
 * Kartu "Untuk jabatan Anda" di dasbor peserta.
 *
 * **Menggantikan kartu "Kursus rekomendasi" hanya untuk orang yang punya
 * jabatan.** Yang tidak punya jabatan melihat kartu lama, persis seperti
 * sebelumnya -- itu sebabnya `getMyJobCourses()` mengembalikan daftar kosong
 * alih-alih melempar, dan pemanggilnyalah yang memilih kartu mana yang
 * dirender.
 *
 * **Setiap baris menyebut alasannya.** Standar v2 sendiri mencatat
 * "rekomendasi tanpa alasan" sebagai anti-pattern, dan kartu lama persis
 * begitu: dua kursus terbit pertama yang belum diikuti, tanpa sepatah kata
 * kenapa. Di sini alasannya datang dari data ("Wajib untuk Staf Gudang"),
 * bukan dari kalimat yang ditempel di komponen.
 *
 * **Tenggat ditampilkan, tidak menghukum.** `enrollments.due_at` tidak
 * memengaruhi nilai, kelulusan, maupun penerbitan sertifikat -- komentarnya
 * ada di migrasi. Tenggat yang lewat diberi tanda, bukan dikunci.
 */
export function JobCoursesCard({
  rows,
  jobTitleName,
  locale,
}: {
  rows: JobCourseRow[]
  jobTitleName: string
  locale: Locale
}) {
  const t = getDictionary(locale)
  const tanggal = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

  return (
    <Card className="min-h-[280px]">
      <CardContent>
        <h2 className="mb-1 text-lg font-bold">{t.dashboard.forYourJob}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{jobTitleName}</p>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.dashboard.jobNoneYet}</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => {
              const wajib = row.requirement === "wajib"
              const sisa = row.dueAt ? sisaHari(row.dueAt) : null
              const lewat = sisa !== null && sisa < 0

              return (
                <li key={row.courseId}>
                  <Link
                    href={
                      row.enrolled
                        ? `/learn/${row.courseId}`
                        : `/learner/courses/${row.courseId}`
                    }
                    className="flex gap-3 rounded-xl border border-border p-2.5 hover:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <CourseThumb
                      src={row.thumbnailUrl}
                      title={row.title}
                      seed={row.courseId}
                      className="h-14 w-20 shrink-0 rounded-lg"
                      initialsClassName="text-base"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm leading-snug font-semibold">
                        {row.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                        {/*
                          Lencana wajib/disarankan berupa KATA, bukan hanya
                          warna: standar aksesibilitas v2 melarang keadaan yang
                          hanya dibedakan warnanya.
                        */}
                        <span
                          className={cn(
                            "rounded-full border px-1.5 py-0.5 font-semibold",
                            wajib
                              ? "border-ring bg-secondary text-primary"
                              : "border-border text-muted-foreground"
                          )}
                        >
                          {wajib ? t.dashboard.jobRequired : t.dashboard.jobSuggested}
                        </span>
                        <span>
                          {(wajib
                            ? t.dashboard.jobReasonRequired
                            : t.dashboard.jobReasonSuggested
                          ).replace("{jabatan}", jobTitleName)}
                        </span>
                      </p>
                      {row.dueAt && (
                        <p
                          className={cn(
                            "mt-1 flex items-center gap-1 text-xs font-medium",
                            lewat ? "text-destructive" : "text-muted-foreground"
                          )}
                        >
                          {lewat ? (
                            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                          ) : (
                            <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                          )}
                          {(lewat ? t.dashboard.jobOverdue : t.dashboard.jobDueIn).replace(
                            "{tanggal}",
                            tanggal(row.dueAt)
                          )}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
