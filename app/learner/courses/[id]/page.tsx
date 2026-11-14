import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Award, FileText, Globe, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CourseThumb } from "@/components/CourseThumb"
import { CourseCurriculumGate } from "@/components/learner/CourseCurriculumGate"
import { getLearnerCertificateForCourse } from "@/lib/certificates-server"
import { EnrollButton } from "@/components/learner/EnrollButton"
import { CourseNotes } from "@/components/learner/CourseNotes"
import { PerkembanganPesertaCard } from "@/components/perkembangan/PerkembanganPesertaCard"
import { getPerkembanganPeserta } from "@/lib/perkembangan-server"
import { getCourseDetail } from "@/lib/courses-server"
import { getEnrollmentProgress, getLearnerCourseGrade } from "@/lib/enrollments-server"
import { formatCourseAccess } from "@/lib/courses"
import { getCourseNotes } from "@/lib/notes-server"
import { getTranslations } from "@/lib/i18n/server"

/**
 * Batas "kursus panjang" (STANDAR-PLATFORM-DIGITAL-LEARNING butir C4): di atas
 * jumlah ini, total pelajaran saja mengintimidasi, jadi kami tunjukkan juga
 * tujuan terdekat seukuran satu modul.
 */
const BATAS_KURSUS_PANJANG = 10

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ enroll?: string }>
}) {
  const { id } = await params
  const { enroll: enrollParam } = await searchParams
  const course = await getCourseDetail(id)
  if (!course) notFound()

  const { enrolled, started, completedLessonIds } = await getEnrollmentProgress(course.id)
  const { t } = await getTranslations()
  const courseGrade = enrolled ? await getLearnerCourseGrade(course.id) : null
  // Jalan pintas ke sertifikat. Sebelumnya satu-satunya jalan adalah menebak
  // bahwa ia ada di tab profil -- peserta yang sudah menyelesaikan kursus
  // tidak melihat satu pun petunjuk di halaman kursusnya sendiri.
  const sertifikat = enrolled ? await getLearnerCertificateForCourse(course.id) : null
  const notes = enrolled ? await getCourseNotes(course.id) : null
  // null bila kursusnya tidak punya kuis ukur sama sekali; kartunya lalu
  // tidak dirender, jadi halaman kursus lama tidak berubah sebaris pun.
  const perkembangan = enrolled ? await getPerkembanganPeserta(course.id) : null
  const price = formatCourseAccess(course, t.courses)
  const initialOpen = enrollParam === "required"

  // Butir C4: kursus 64 pelajaran yang hanya menyodorkan totalnya membuat orang
  // mundur sebelum mulai. Tawarkan tujuan sebesar satu modul saja.
  let tujuanTerdekat: string | null = null
  if (course.lesson_count > BATAS_KURSUS_PANJANG) {
    const selesai = new Set(completedLessonIds)
    if (!started) {
      const modul = course.sections.find((s) => s.lessons.length > 0)
      if (modul) {
        const totalDetik = modul.lessons.reduce((a, l) => a + (l.duration_seconds ?? 0), 0)
        tujuanTerdekat = (totalDetik > 0 ? t.nearGoal.start : t.nearGoal.startNoTime)
          .replace("{modul}", modul.title)
          .replace("{n}", String(modul.lessons.length))
          .replace("{menit}", String(Math.max(1, Math.round(totalDetik / 60))))
      }
    } else {
      const modul = course.sections.find((s) => s.lessons.some((l) => !selesai.has(l.id)))
      if (modul) {
        tujuanTerdekat = t.nearGoal.resume
          .replace("{modul}", modul.title)
          .replace("{selesai}", String(modul.lessons.filter((l) => selesai.has(l.id)).length))
          .replace("{n}", String(modul.lessons.length))
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3.5">
        <Button
          variant="outline"
          size="icon"
          aria-label={t.courseDetail.backToCourses}
          render={<Link href="/learner/courses" />}
          nativeButton={false}
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Button>
        <h1 className="text-2xl leading-tight font-bold">{course.title}</h1>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6 min-w-0">
          <Card>
            <CardContent>
              <div className="mb-3.5 text-lg font-bold">{t.courseDetail.summary}</div>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{course.description}</p>
              <div className="mt-4 flex gap-2 border-t border-muted pt-4 text-sm text-muted-foreground">
                <span>{course.lesson_count} {t.courses.lessons}</span>
                <span>·</span>
                <span>{course.duration_hours} {t.courses.hours}</span>
              </div>
              {tujuanTerdekat && (
                <p className="mt-2 text-sm font-medium">{tujuanTerdekat}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="mb-2 text-lg font-bold">{t.courseDetail.contents}</div>
              <CourseCurriculumGate
                sections={course.sections}
                courseId={course.id}
                enrolled={enrolled}
                initialOpen={initialOpen}
              />
            </CardContent>
          </Card>

          <PerkembanganPesertaCard data={perkembangan} />

          {notes && <CourseNotes courseId={course.id} notes={notes} />}

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

          <EnrollButton
            courseId={course.id}
            state={!enrolled ? "not_enrolled" : started ? "in_progress" : "not_started"}
            size="xl"
            className="w-full"
          />

          {sertifikat && (
            <Button
              className="mt-3 w-full bg-brand-gradient text-white hover:brightness-105"
              render={<Link href="/learner/profile?tab=certificates" />}
              nativeButton={false}
            >
              <Award className="size-4" aria-hidden />
              {t.player.certificateShortcut}
            </Button>
          )}

          {courseGrade && courseGrade.available > 0 && (
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">{t.courseDetail.courseGrade}</span>
                <span className="text-lg font-bold">{courseGrade.grade}%</span>
              </div>
              {courseGrade.pendingCount > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.courseDetail.pendingGradeNote.replace("{n}", String(courseGrade.pendingCount))}
                </p>
              )}
            </div>
          )}

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
