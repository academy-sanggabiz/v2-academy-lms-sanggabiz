import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText, Globe, Users } from "lucide-react"
import { getTranslations } from "@/lib/i18n/server"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CourseThumb } from "@/components/CourseThumb"
import { CourseCurriculum } from "@/components/learner/CourseCurriculum"
import { FeedbackTab } from "@/components/admin/courses/tabs/FeedbackTab"
import { getCourseDetailForAdmin } from "@/lib/courses-admin"
import { formatCourseAccess } from "@/lib/courses"
import { getCourseFeedback, getCourseFeedbackSummary } from "@/lib/feedback-admin"
import { parseListParams, type RawSearchParams } from "@/lib/pagination"

export default async function AdminCoursePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<RawSearchParams>
}) {
  const { t } = await getTranslations()
  const [{ id }, raw] = await Promise.all([params, searchParams])
  const feedbackParams = parseListParams<Record<string, never>>(raw, {
    prefix: "feedback",
    sortable: ["created_at"],
    defaultSort: "created_at",
    defaultDir: "desc",
  })

  const [course, feedbackSummary, feedback] = await Promise.all([
    getCourseDetailForAdmin(id),
    getCourseFeedbackSummary(id),
    getCourseFeedback(id, feedbackParams),
  ])
  if (!course) notFound()

  const price = formatCourseAccess(course, t.courses)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3.5">
        <Button
          variant="outline"
          size="icon"
          aria-label={t.courseDetail.backToEditor}
          render={<Link href={`/admin/courses/${course.id}/edit`} />}
          nativeButton={false}
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Button>
        <h1 className="text-2xl leading-tight font-bold">{course.title}</h1>
        <Badge
          variant={course.status === "published" ? "default" : "outline"}
          className={
            course.status === "published"
              ? "bg-success text-success-foreground"
              : "border-pill-border bg-draft-background text-destructive"
          }
        >
          {course.status === "published" ? t.editor.publishedBadge : t.editor.draftBadge}
        </Badge>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardContent>
              <div className="mb-3.5 text-lg font-bold">{t.courseDetail.summary}</div>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{course.description}</p>
              <div className="mt-4 flex gap-2 border-t border-muted pt-4 text-sm text-muted-foreground">
                <span>{course.lesson_count} {t.courses.lessons}</span>
                <span>·</span>
                <span>{course.duration_hours} {t.courses.hours}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="mb-2 text-lg font-bold">{t.courseDetail.contents}</div>
              <CourseCurriculum sections={course.sections} courseId={course.id} basePath="/admin-preview" />
            </CardContent>
          </Card>

          {course.who_for.length > 0 && (
            <Card>
              <CardContent>
                <div className="mb-3.5 text-lg font-bold">{t.courseDetail.whoFor}</div>
                <div className="flex flex-col gap-3.5 text-sm leading-relaxed text-muted-foreground">
                  {course.who_for.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {course.requirements.length > 0 && (
            <Card>
              <CardContent>
                <div className="mb-3.5 text-lg font-bold">{t.courseDetail.requirements}</div>
                <div className="flex flex-col gap-3.5 text-sm leading-relaxed text-muted-foreground">
                  {course.requirements.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="course-thumb-placeholder size-16 shrink-0 rounded-full" />
              <div>
                <div className="text-xl font-bold">{course.instructor?.name ?? "Tim Sanggabiz"}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">{t.courseDetail.instructorRole}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="mb-3.5 text-lg font-bold">{t.courseDetail.reviews}</div>
              <FeedbackTab summary={feedbackSummary} feedback={feedback} />
            </CardContent>
          </Card>
        </div>

        <div className="sticky top-20 rounded-xl border border-border bg-card p-5 shadow-sm">
          <CourseThumb
            src={course.thumbnail_url}
            title={course.title}
            seed={course.id}
            className="mb-4 h-[180px] rounded-md"
          />
          <div className="mb-4 flex items-center justify-between">
            <div className="text-2xl font-bold">{price}</div>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">{price}</span>
          </div>

          <Button
            size="xl"
            className="w-full bg-brand-gradient text-white hover:brightness-105"
            render={<Link href={`/admin/courses/${course.id}/edit`} />}
            nativeButton={false}
          >
            {t.editor.editCourse}
          </Button>

          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <FileText className="size-4" />
              {t.courseDetail.nResources.replace("{n}", String(course.resource_count))}
            </div>
            <div className="flex items-center gap-2.5">
              <Globe className="size-4" />
              {course.language}
            </div>
            {/* Ditampilkan hanya bila angkanya boleh diceritakan: di bawah
                ambang anonimitas `enrolled_count` bernilai null, dan "0
                peserta terdaftar" adalah pernyataan yang justru tidak boleh
                dibuat tentang kelompok sekecil itu. */}
            {course.enrolled_count !== null && (
              <div className="flex items-center gap-2.5">
                <Users className="size-4" />
                {t.courseDetail.nEnrolled.replace("{n}", String(course.enrolled_count))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
