import { notFound } from "next/navigation"

import { getTrackingDetail } from "@/lib/tracking-server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { TrackingBreadcrumb } from "@/components/admin/tracking/TrackingBreadcrumb"
import { TrackingDetailView } from "@/components/admin/tracking/TrackingDetailView"
import { LearnerDifficulty } from "@/components/admin/tracking/LearnerDifficulty"
import { getLearnerDifficulty } from "@/lib/insight-server"

export default async function AdminTrackingDetailPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>
}) {
  await requireAdmin()
  const { enrollmentId } = await params
  const detail = await getTrackingDetail(enrollmentId)
  if (!detail) notFound()

  // Dibaca setelah `detail`, bukan bersamaan: kalau pendaftarannya bukan milik
  // pengelola ini, `detail` sudah null dan kueri kedua tidak perlu dijalankan.
  const kesulitan = await getLearnerDifficulty(enrollmentId)

  return (
    <div>
      <TrackingBreadcrumb learnerName={detail.learnerName} courseTitle={detail.courseTitle} />
      <TrackingDetailView detail={detail} />

      <div className="mt-6">
        <LearnerDifficulty rows={kesulitan} courseId={detail.courseId} />
      </div>
    </div>
  )
}
