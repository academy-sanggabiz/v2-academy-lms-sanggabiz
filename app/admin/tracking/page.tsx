import { Activity, GraduationCap } from "lucide-react"

import { getTrackingStats, listTrackingEnrollments } from "@/lib/tracking-server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { parseListParams, type RawSearchParams } from "@/lib/pagination"
import { StatCard } from "@/components/admin/StatCard"
import { TrackingListClient } from "@/components/admin/tracking/TrackingListClient"
import { getTranslations } from "@/lib/i18n/server"
import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { getBehaviorSummary } from "@/lib/behavior-server"
import { BehaviorSummary } from "@/components/admin/tracking/BehaviorSummary"

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

  // Lama belajar adalah data perilaku per orang, bukan data penyampaian
  // kursus -- jadi hanya superadmin, sejalan dengan docs/STANDAR-PERAN.md §2.
  const superadmin = (await resolveSuperAdminProfile()).status === "ok"
  const behavior = superadmin ? await getBehaviorSummary() : null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t.admin.tracking}</h1>
        <p className="text-sm text-muted-foreground">
          {t.admin.trackingSubtitle}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={GraduationCap} label="Pendaftaran Dipantau" value={stats.totalEnrollments} />
        <StatCard icon={Activity} label="Rata-rata Penyelesaian Modul" value={`${stats.avgModulePct}%`} />
      </div>

      <TrackingListClient page={page} />

      {behavior && (
        <div className="mt-10">
          <BehaviorSummary data={behavior} />
        </div>
      )}
    </div>
  )
}
