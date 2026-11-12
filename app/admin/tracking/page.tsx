import { Activity, GraduationCap } from "lucide-react"

import { getTrackingStats, listTrackingEnrollments } from "@/lib/tracking-server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { parseListParams, type RawSearchParams } from "@/lib/pagination"
import { StatCard } from "@/components/admin/StatCard"
import { KpiDefinitions } from "@/components/admin/KpiDefinitions"
import { TrackingListClient } from "@/components/admin/tracking/TrackingListClient"
import { getTranslations } from "@/lib/i18n/server"
import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { getBehaviorSummary } from "@/lib/behavior-server"
import { BehaviorSummary } from "@/components/admin/tracking/BehaviorSummary"
import { getLaporanDepartemen, getRingkasanTerakhir } from "@/lib/laporan-departemen-server"
import { LaporanDepartemen } from "@/components/admin/tracking/LaporanDepartemen"

export default async function AdminTrackingPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const { t, locale } = await getTranslations()
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
  /*
   * Laporan per departemen menyatukan angka SELURUH organisasi, jadi ia
   * berada di pagar yang sama dengan lama belajar: superadmin saja, sejalan
   * dengan docs/STANDAR-PERAN.md §2. Seorang mentor berhak atas kursusnya
   * sendiri, bukan atas gambaran lintas departemen.
   */
  const [behavior, laporan, ringkasan] = await Promise.all([
    superadmin ? getBehaviorSummary() : null,
    superadmin ? getLaporanDepartemen() : null,
    superadmin ? getRingkasanTerakhir(locale) : null,
  ])

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

      <div className="-mt-3 mb-6">
        <KpiDefinitions
          title={t.kpi.title}
          noTarget={t.kpi.noTarget}
          items={[
            { label: "Pendaftaran Dipantau", definition: t.kpi.defTrackedEnrollments },
            { label: "Rata-rata Penyelesaian Modul", definition: t.kpi.defAvgModulePct },
          ]}
        />
      </div>

      <TrackingListClient page={page} />

      {laporan && (
        <div className="mt-10">
          <LaporanDepartemen data={laporan} ringkasan={ringkasan} />
        </div>
      )}

      {behavior && (
        <div className="mt-10">
          <BehaviorSummary data={behavior} />
        </div>
      )}
    </div>
  )
}
