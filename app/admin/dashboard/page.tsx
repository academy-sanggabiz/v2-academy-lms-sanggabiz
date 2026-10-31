import Link from "next/link"
import { BookOpen, GraduationCap, Trophy, UserCog, Users } from "lucide-react"

import { getAdminCourseStats, getRecentCourses } from "@/lib/courses-admin"
import { getRecentEnrollments } from "@/lib/dashboard-admin"
import { getAdminLearnerStats } from "@/lib/learners-admin"
import { listTrackingEnrollments } from "@/lib/tracking-server"
import { parseListParams, type RawSearchParams } from "@/lib/pagination"
import { resolveAdminProfile } from "@/lib/auth/require-admin"
import { getMentorOverview } from "@/lib/mentors-server"
import { StatCard } from "@/components/admin/StatCard"
import { RecentEnrollmentsCard } from "@/components/admin/dashboard/RecentEnrollmentsCard"
import { RecentCoursesCard } from "@/components/admin/dashboard/RecentCoursesCard"
import { OnlineTrackingCard } from "@/components/admin/dashboard/OnlineTrackingCard"

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const raw = await searchParams
  const enrollParams = parseListParams<Record<string, never>>(raw, {
    prefix: "enroll",
    sortable: [],
    defaultSort: "enrolled_at",
    defaultPageSize: 5,
  })
  const courseParams = parseListParams<Record<string, never>>(raw, {
    prefix: "course",
    sortable: [],
    defaultSort: "created_at",
    defaultPageSize: 5,
  })
  const trackParams = parseListParams<Record<string, never>>(raw, {
    prefix: "track",
    sortable: ["enrolled_at"],
    defaultSort: "enrolled_at",
    defaultPageSize: 5,
  })

  const adminResult = await resolveAdminProfile()
  const isSuperadmin = adminResult.status === "ok" && adminResult.profile.role === "superadmin"

  const [learnerStats, courseStats, recentEnrollments, recentCourses, recentTracking, mentors] =
    await Promise.all([
      getAdminLearnerStats(),
      getAdminCourseStats(),
      getRecentEnrollments(enrollParams),
      getRecentCourses(courseParams),
      listTrackingEnrollments(trackParams),
      // Mengembalikan daftar kosong untuk siapa pun selain superadmin, jadi
      // tidak perlu percabangan di sini.
      getMentorOverview(),
    ])

  /*
   * Angka di layar ini sudah otomatis terbatas pada kursus milik pemanggil
   * lewat policy yang sama di seluruh basis data, jadi seorang mentor memang
   * melihat angkanya sendiri. Yang perlu dibedakan hanyalah labelnya: tanpa
   * itu, mentor baru membaca "Total Peserta 0" sebagai sistem rusak, padahal
   * artinya "belum ada peserta di kursus Anda" (docs/STANDAR-PERAN.md §5).
   */
  const scope = isSuperadmin
    ? { learners: "Total Peserta", courses: "Total Kursus", completed: "Kursus Selesai" }
    : { learners: "Peserta di Kursus Saya", courses: "Kursus Saya", completed: "Selesai di Kursus Saya" }

  // KPI utama: berapa bagian pendaftaran yang benar-benar diselesaikan.
  // null, bukan 0, ketika belum ada pendaftaran -- "0%" akan terbaca sebagai
  // kegagalan padahal yang terjadi adalah belum ada datanya.
  const completionRate =
    learnerStats.totalEnrollments > 0
      ? Math.round((learnerStats.totalCompleted / learnerStats.totalEnrollments) * 100)
      : null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[30px] font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {isSuperadmin
            ? "Ringkasan seluruh platform: peserta, kursus, dan aktivitas terbaru"
            : "Ringkasan kursus yang Anda kelola, peserta di dalamnya, dan aktivitas terbaru"}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label={scope.learners} value={learnerStats.totalLearners} />
        <StatCard
          icon={BookOpen}
          label={scope.courses}
          value={courseStats.totalCourses}
          hint={`${courseStats.publishedCourses} terbit`}
        />
        {/*
          * "Total Pendaftaran" dulu berdiri sendiri di sini. Angka itu hanya
          * naik dan tidak pernah memberi tahu apakah kursusnya berhasil --
          * vanity metric menurut STANDAR-DIGITAL-LEARNING §12. Yang ditampilkan
          * sekarang adalah rasionya, dengan angka mentahnya tetap terbaca di
          * bawah supaya tidak ada informasi yang hilang.
          */}
        <StatCard
          icon={GraduationCap}
          label="Tingkat Penyelesaian"
          value={completionRate === null ? "—" : `${completionRate}%`}
          hint={
            completionRate === null
              ? "Belum ada pendaftaran"
              : `${learnerStats.totalCompleted} selesai dari ${learnerStats.totalEnrollments} pendaftaran`
          }
        />
        <StatCard icon={Trophy} label={scope.completed} value={learnerStats.totalCompleted} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentEnrollmentsCard enrollments={recentEnrollments} />
        <RecentCoursesCard courses={recentCourses} />
      </div>

      <div className="mt-6">
        <OnlineTrackingCard rows={recentTracking} />
      </div>

      {/* Hanya superadmin yang bertanggung jawab atas mutu lintas mentor, jadi
          ringkasan ini tidak pernah muncul untuk mentor itu sendiri. */}
      {isSuperadmin && mentors.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UserCog className="size-[18px]" aria-hidden />
              Mentor
            </div>
            <Link
              href="/admin/mentor"
              className="rounded-md text-sm font-semibold text-ring underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Lihat evaluasi mentor
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            {mentors.length} mentor mengelola{" "}
            {mentors.reduce((n, m) => n + m.coursesPublished, 0)} kursus terbit untuk{" "}
            {mentors.reduce((n, m) => n + m.learners, 0)} peserta.
            {mentors.reduce((n, m) => n + m.pendingReviews, 0) > 0 &&
              ` ${mentors.reduce((n, m) => n + m.pendingReviews, 0)} esai menunggu dinilai.`}
          </p>
        </div>
      )}
    </div>
  )
}
