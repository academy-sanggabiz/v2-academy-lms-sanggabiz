import { BookOpen, Trophy, Users } from "lucide-react"

import { getAllAdminCourses } from "@/lib/courses-admin"
import { getAdminLearnerList, getAdminLearnerStats, type AdminLearnerFilters } from "@/lib/learners-admin"
import { parseListParams, type RawSearchParams } from "@/lib/pagination"
import { LearnerManagementClient } from "@/components/admin/learners/LearnerManagementClient"
import { StatCard } from "@/components/admin/StatCard"
import { KpiDefinitions } from "@/components/admin/KpiDefinitions"
import { getTranslations } from "@/lib/i18n/server"

export default async function AdminLearnersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const { t } = await getTranslations()
  const raw = await searchParams
  const params = parseListParams<AdminLearnerFilters>(raw, {
    sortable: ["name", "enrolled"],
    defaultSort: "name",
    defaultDir: "asc",
    filters: { filter: ["all", "enrolled", "completed"] },
  })

  const [page, stats, courses] = await Promise.all([
    getAdminLearnerList(params),
    getAdminLearnerStats(),
    getAllAdminCourses(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t.admin.learners}</h1>
        <p className="text-sm text-muted-foreground">
          {t.admin.learnersSubtitle}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label={t.admin.totalLearnersLabel} value={stats.totalLearners} />
        <StatCard icon={BookOpen} label={t.admin.totalEnrollmentsLabel} value={stats.totalEnrollments} />
        <StatCard icon={Trophy} label={t.admin.coursesCompletedLabel} value={stats.totalCompleted} />
      </div>

      <div className="-mt-3 mb-6">
        <KpiDefinitions
          title={t.kpi.title}
          noTarget={t.kpi.noTarget}
          items={[
            { label: t.admin.totalLearnersLabel, definition: t.kpi.defLearners },
            { label: t.admin.totalEnrollmentsLabel, definition: t.kpi.defEnrollments },
            { label: t.admin.coursesCompletedLabel, definition: t.kpi.defCompleted },
          ]}
        />
      </div>

      <LearnerManagementClient page={page} courses={courses} />
    </div>
  )
}
