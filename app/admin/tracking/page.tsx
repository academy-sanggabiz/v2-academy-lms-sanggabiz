import { Activity, GraduationCap } from "lucide-react"

import { getTrackingStats, listTrackingEnrollments } from "@/lib/tracking-server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { parseListParams, type RawSearchParams } from "@/lib/pagination"
import { StatCard } from "@/components/admin/StatCard"
import { TrackingListClient } from "@/components/admin/tracking/TrackingListClient"
import { getTranslations } from "@/lib/i18n/server"

export default async function AdminTrackingPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const { t } = await getTranslations()
  await requireAdmin()

  const raw = await searchParams
  const params = parseListParams<Record<string, never>>(raw, {
    sortable: ["enrolled_at"],
    defaultSort: "enrolled_at",
    defaultDir: "desc",
  })

  const [page, stats] = await Promise.all([listTrackingEnrollments(params), getTrackingStats()])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[30px] font-bold">{t.admin.tracking}</h1>
        <p className="text-sm text-muted-foreground">
          Pantau penyelesaian modul dan tugas setiap peserta per kursus
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={GraduationCap} label="Pendaftaran Dipantau" value={stats.totalEnrollments} />
        <StatCard icon={Activity} label="Rata-rata Penyelesaian Modul" value={`${stats.avgModulePct}%`} />
      </div>

      <TrackingListClient page={page} />
    </div>
  )
}
