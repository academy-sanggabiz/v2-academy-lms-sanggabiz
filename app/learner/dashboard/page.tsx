import Link from "next/link"
import { ArrowRight, Award, BookOpen, CheckCircle2, ListChecks } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CourseThumb } from "@/components/CourseThumb"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import { getPublishedCourses } from "@/lib/courses-server"
import {
  getContinueLearning,
  getEnrolledCourseIds,
  type ContinueLearningItem,
} from "@/lib/enrollments-server"
import { getTranslations } from "@/lib/i18n/server"
import { getMyJobCourses, getMyJobTitle } from "@/lib/org-server"
import { JobCoursesCard } from "@/components/learner/JobCoursesCard"
import { RekomendasiCard } from "@/components/learner/RekomendasiCard"
import { getRekomendasi } from "@/lib/rekomendasi-server"
import { StatCard } from "@/components/admin/StatCard"
import { getTrackingConsent } from "@/lib/tracking-consent-server"
import { ConsentNudge } from "@/components/learner/ConsentNudge"
import type { Dictionary } from "@/lib/i18n/dictionaries"

export default async function LearnerDashboardPage() {
  const { t, locale } = await getTranslations()
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  const [
    { data: profile },
    { count: completedCount },
    { count: inProgressCount },
    enrolledCourseIds,
    publishedCourses,
    continueItems,
    { count: lessonsDone },
    { count: certificateCount },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", claims?.sub ?? "").single(),
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("learner_id", claims?.sub ?? "")
      .eq("status", "completed"),
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("learner_id", claims?.sub ?? "")
      .eq("status", "active"),
    getEnrolledCourseIds(),
    getPublishedCourses(),
    getContinueLearning(),
    // Dua angka tambahan supaya baris ringkasan benar-benar meringkas.
    // Keduanya dibatasi RLS ke peserta yang sedang masuk: lesson_progress
    // lewat join enrollments, certificates lewat enrollment miliknya.
    supabase.from("lesson_progress").select("*", { count: "exact", head: true }).eq("completed", true),
    supabase.from("certificates").select("*", { count: "exact", head: true }),
  ])

  // Ajakan persetujuan pelacakan hanya untuk yang BELUM pernah memutuskan:
  // yang sudah mengizinkan maupun menolak tidak perlu ditanya-tanya lagi.
  const { belumMemutuskan } = await getTrackingConsent()

  const displayName = profile?.full_name || claims?.email || "Peserta"
  const recommended = publishedCourses.filter((c) => !enrolledCourseIds.includes(c.id)).slice(0, 2)

  /*
    Kartu rekomendasi lama TIDAK diganti untuk semua orang.
    `getMyJobCourses()` mengembalikan daftar kosong untuk peserta tanpa
    jabatan -- dan peserta UMKM yang memakai LMS ini hari ini memang tidak
    punya jabatan. Jadi dasbor mereka tetap persis seperti sebelumnya.
  */
  const [jabatan, jobCourses, rekomendasi] = await Promise.all([
    getMyJobTitle(),
    getMyJobCourses(),
    /*
     * Rekomendasi dari riwayat sendiri, BERDAMPINGAN dengan yang dari
     * jabatan -- bukan menggantikannya. Keduanya menjawab pertanyaan
     * berbeda: jabatan menjawab "apa yang diwajibkan posisi saya", riwayat
     * menjawab "apa yang masuk akal saya pelajari berikutnya". Kosong untuk
     * peserta yang belum menuntaskan satu kursus pun, dan kartunya lalu
     * tidak dirender sama sekali.
     */
    getRekomendasi(),
  ])
  const pakaiKartuJabatan = !!jabatan.jobTitle && jobCourses.length > 0
  const [primary, ...others] = continueItems

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t.dashboard.greeting}, {displayName}
      </h1>

      {belumMemutuskan && <ConsentNudge />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label={t.dashboard.coursesInProgress}
          value={inProgressCount ?? 0}
          hint={`${t.dashboard.ofEnrolled.replace("{n}", String((inProgressCount ?? 0) + (completedCount ?? 0)))}`}
        />
        <StatCard
          icon={CheckCircle2}
          label={t.dashboard.coursesCompleted}
          value={completedCount ?? 0}
          tone={(completedCount ?? 0) > 0 ? "positive" : "default"}
          hint={(completedCount ?? 0) > 0 ? t.dashboard.keepGoing : undefined}
        />
        <StatCard icon={ListChecks} label={t.dashboard.lessonsCompleted} value={lessonsDone ?? 0} />
        <StatCard
          icon={Award}
          label={t.dashboard.certificates}
          value={certificateCount ?? 0}
          hint={(certificateCount ?? 0) > 0 ? t.dashboard.readyToDownload : undefined}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card className="min-h-[280px]">
          <CardContent>
            <h2 className="mb-4 text-lg font-bold">{t.dashboard.continueLearning}</h2>
            {primary ? (
              <div className="space-y-4">
                <ContinueRow item={primary} prominent t={t} />
                {others.map((item) => (
                  <ContinueRow key={item.courseId} item={item} t={t} />
                ))}
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">{t.dashboard.noneInProgress}</p>
                <Button variant="outline" render={<Link href="/learner/courses" />} nativeButton={false}>
                  Lihat kursus
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {pakaiKartuJabatan ? (
          <JobCoursesCard
            rows={jobCourses}
            jobTitleName={jabatan.jobTitle!.name}
            locale={locale}
          />
        ) : (
        <Card className="min-h-[280px]">
          <CardContent>
            <h2 className="mb-4 text-lg font-bold">{t.dashboard.recommended}</h2>
            {recommended.length > 0 ? (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {recommended.map((course) => (
                  <li key={course.id}>
                    <Link
                      href={`/learner/courses/${course.id}`}
                      className="block overflow-hidden rounded-xl border border-border hover:border-ring"
                    >
                      <CourseThumb
                        src={course.thumbnail_url}
                        title={course.title}
                        seed={course.id}
                        className="h-[110px]"
                        initialsClassName="text-3xl"
                      />
                      <div className="p-3.5">
                        <p className="line-clamp-2 text-sm leading-snug font-semibold">{course.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{course.lesson_count} {t.courses.lessons}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pt-2 text-sm text-muted-foreground">{t.dashboard.noRecommendations}</p>
            )}
          </CardContent>
        </Card>
        )}
      </div>

      <div className="mt-6">
        <RekomendasiCard items={rekomendasi} />
      </div>
    </div>
  )
}

/**
 * One active course: where the learner is, how far along, and the exact next
 * lesson (DL standard: honest progress counted from real lessons, plus a
 * labelled next step).
 */
function ContinueRow({
  item,
  prominent = false,
  t,
}: {
  item: ContinueLearningItem
  prominent?: boolean
  t: Dictionary
}) {
  const pct = Math.round((item.doneCount / item.totalCount) * 100)
  const href = item.nextLesson
    ? `/learn/${item.courseId}?lesson=${item.nextLesson.id}`
    : `/learn/${item.courseId}`

  return (
    <div className={cn("rounded-xl border border-border p-4", prominent && "bg-secondary/40")}>
      <p className="line-clamp-2 font-semibold">{item.title}</p>
      {item.nextLesson && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t.dashboard.nextLesson} {item.nextLesson.position} {t.dashboard.of} {item.totalCount} · {item.nextLesson.title}
        </p>
      )}
      <div className="mt-3 flex items-center gap-3">
        <div
          role="progressbar"
          aria-label={`Progres ${item.title}`}
          aria-valuemin={0}
          aria-valuemax={item.totalCount}
          aria-valuenow={item.doneCount}
          aria-valuetext={`${item.doneCount} ${t.dashboard.of} ${item.totalCount} ${t.dashboard.lessonsProgress}`}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
        >
          <div className="h-full bg-brand-gradient" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-semibold whitespace-nowrap text-primary">
          {item.doneCount} {t.dashboard.of} {item.totalCount} {t.dashboard.lessonsDone}
        </span>
      </div>
      {prominent ? (
        <Button
          className="mt-4 bg-brand-gradient text-white hover:brightness-105"
          render={<Link href={href} />}
          nativeButton={false}
        >
          {item.doneCount === 0 ? t.dashboard.start : t.dashboard.continue}: {item.nextLesson?.position ?? item.totalCount}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      ) : (
        <Link href={href} className="mt-3 inline-block text-sm font-semibold text-primary underline underline-offset-4">
          {t.dashboard.continue}
          <span className="sr-only"> {item.title}</span>
        </Link>
      )}
    </div>
  )
}
