import Link from "next/link"
import { BookOpen, Clock, Star, Users } from "lucide-react"

import { CourseThumb } from "@/components/CourseThumb"
import { formatCourseAccess } from "@/lib/courses"
import { levelLabel, normalizeLevel } from "@/lib/course-level"
import { getDictionary } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"
import type { CatalogCourse } from "@/lib/catalog-server"
import { plural } from "@/lib/i18n/plural"

/**
 * Satu kelas di katalog publik.
 *
 * Seluruh kartunya satu tautan, bukan kartu berisi tombol "Lihat detail"
 * terpisah: tujuannya satu, jadi sasaran kliknya juga satu -- dan pengguna
 * papan ketik cukup satu kali Tab, bukan dua.
 *
 * Angka yang ditampilkan hanya yang benar-benar ada datanya. Jumlah peserta
 * dan rata-rata ulasan disembunyikan selama belum melewati ambang anonimitas
 * (lihat lib/catalog-server.ts) -- kosong lebih jujur daripada angka yang
 * menunjuk satu orang tertentu.
 */
export function CatalogCard({ course, locale }: { course: CatalogCourse; locale: Locale }) {
  const t = getDictionary(locale)
  const level = normalizeLevel(course.level)
  const price = formatCourseAccess(course, t.courses)

  return (
    <li className="h-full">
      <Link
        href={`/kelas/${course.id}`}
        className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-float focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <CourseThumb
          src={course.thumbnail_url}
          title={course.title}
          seed={course.id}
          className="mb-4 h-[150px] rounded-lg"
        />

        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
            {price}
          </span>
          {level && (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {levelLabel(level, t)}
            </span>
          )}
        </div>

        <h3 className="mb-1.5 line-clamp-2 text-base leading-snug font-bold group-hover:underline">
          {course.title}
        </h3>

        {course.description && (
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-muted pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="size-3.5 shrink-0" aria-hidden />
            {course.lesson_count} {t.courses.lessons}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            {course.duration_hours} {t.courses.hours}
          </span>
          {course.learnerCount !== null && (
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0" aria-hidden />
              {plural(course.learnerCount, t.catalog.learnersOne, t.catalog.learners)}
            </span>
          )}
          {course.rating && (
            <span className="flex items-center gap-1.5">
              <Star className="size-3.5 shrink-0 fill-current text-amber-500" aria-hidden />
              {t.catalog.rating
                .replace("{n}", String(course.rating.average))
                .replace("{c}", String(course.rating.count))}
            </span>
          )}
        </div>
      </Link>
    </li>
  )
}
