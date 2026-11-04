import Link from "next/link"
import { BookOpen, Clock, Eye, Tag } from "lucide-react"
import { useI18n } from "@/components/i18n/LocaleProvider"

import { Button } from "@/components/ui/button"
import { CourseThumb } from "@/components/CourseThumb"
import { EnrollButton } from "@/components/learner/EnrollButton"
import { formatCourseAccess, type Course } from "@/lib/courses"

export function CourseGridCard({
  course,
  enrolled,
  started,
}: {
  course: Course
  enrolled: boolean
  started: boolean
}) {
  const { t } = useI18n()
  const price = formatCourseAccess(course, t.courses)

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
          state={!enrolled ? "not_enrolled" : started ? "in_progress" : "not_started"}
          className="h-11 min-w-0 @[22rem]:flex-1"
        />
      </div>
    </div>
  )
}
