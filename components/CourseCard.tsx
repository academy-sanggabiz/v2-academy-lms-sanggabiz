"use client"

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
    <div
      className={cn(
        "cursor-pointer rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-float",
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
          {formatCourseAccess(course)}
        </span>
      </CourseThumb>
      <div className="mb-2.5 min-h-[46px] text-base leading-snug font-bold">
        {course.title}
      </div>
      <div className="text-sm text-muted-foreground">
        {course.lesson_count} {t.courses.lessons} · {course.duration_hours} {t.courses.hours}
      </div>
    </div>
  )
}
