"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { CourseThumb } from "@/components/CourseThumb"
import { formatCourseAccess, type Course } from "@/lib/courses"
import { useI18n } from "@/components/i18n/LocaleProvider"

export function CourseCard({
  course,
  className,
}: {
  course: Course
  className?: string
}) {
  const { t } = useI18n()

  return (
    /*
     * Kartunya sebuah tautan, bukan <div> ber-`cursor-pointer`.
     *
     * Sebelum ada halaman pratinjau kelas publik, kartu ini memang tidak
     * punya tujuan -- tetapi ia tetap memasang kursor tangan, jadi ia tampak
     * bisa diklik dan tidak melakukan apa pun. Kontrol yang terlihat bekerja
     * tetapi tidak membawa ke mana-mana adalah cacat menurut
     * STANDAR-DIGITAL-LEARNING §17, bukan sekadar kekurangan.
     */
    <Link
      href={`/kelas/${course.id}`}
      className={cn(
        "group block rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-float",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
    >
      <CourseThumb
        src={course.thumbnail_url}
        title={course.title}
        seed={course.id}
        className="mb-4 h-[180px] rounded-md"
      >
        <span className="absolute top-3 right-3 rounded-full bg-ring px-3 py-1 text-xs font-semibold text-white">
          {formatCourseAccess(course, t.courses)}
        </span>
      </CourseThumb>
      <div className="mb-2.5 min-h-[46px] text-base leading-snug font-bold group-hover:underline">
        {course.title}
      </div>
      <div className="text-sm text-muted-foreground">
        {course.lesson_count} {t.courses.lessons} · {course.duration_hours} {t.courses.hours}
      </div>
    </Link>
  )
}
