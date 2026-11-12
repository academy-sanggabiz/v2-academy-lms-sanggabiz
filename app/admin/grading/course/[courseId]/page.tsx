import { notFound } from "next/navigation"

import { getTranslations } from "@/lib/i18n/server"

import { getCourseGradingMatrix } from "@/lib/grading-server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { parseListParams, type RawSearchParams } from "@/lib/pagination"
import { GradingCourseMatrix } from "@/components/admin/grading/GradingCourseMatrix"
import { GradingBreadcrumb } from "@/components/admin/grading/GradingBreadcrumb"
import { ExportCourseCsvButton } from "@/components/admin/grading/ExportCourseCsvButton"
import { ImportGradesDialog } from "@/components/admin/grading/ImportGradesDialog"
import { getCourseDropoff, getQuestionDifficulty, getQuizEffort } from "@/lib/insight-server"
import { CourseInsight } from "@/components/admin/insight/CourseInsight"
import { CourseDropoff } from "@/components/admin/insight/CourseDropoff"
import { PerkembanganKelas } from "@/components/admin/insight/PerkembanganKelas"
import { getPerkembanganKursus } from "@/lib/perkembangan-server"

export default async function AdminGradingCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>
  searchParams: Promise<RawSearchParams>
}) {
  await requireAdmin()
  const { t } = await getTranslations()
  const [{ courseId }, raw] = await Promise.all([params, searchParams])

  const listParams = parseListParams<Record<string, never>>(raw, {
    sortable: ["learner"],
    defaultSort: "learner",
    defaultDir: "asc",
    defaultPageSize: 10,
  })

  const [matrix, questions, effort, dropoff, perkembangan] = await Promise.all([
    getCourseGradingMatrix(courseId, listParams),
    getQuestionDifficulty(courseId),
    getQuizEffort(courseId),
    getCourseDropoff(courseId),
    // null bila kursusnya tidak punya pretest DAN posttest -- komponennya
    // lalu tidak merender apa pun, jadi kursus lama tidak berubah.
    getPerkembanganKursus(courseId),
  ])
  if (!matrix) notFound()

  return (
    <div>
      <GradingBreadcrumb courseTitle={matrix.courseTitle} />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{matrix.courseTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {t.grading.matrixSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCourseCsvButton courseId={courseId} />
          <ImportGradesDialog />
        </div>
      </div>

      <GradingCourseMatrix matrix={matrix} />

      <PerkembanganKelas data={perkembangan} />

      <CourseDropoff data={dropoff} />

      <CourseInsight questions={questions} effort={effort} />
    </div>
  )
}
