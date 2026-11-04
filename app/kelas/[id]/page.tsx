import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Award,
  BookOpen,
  Clock,
  FileText,
  Globe,
  HelpCircle,
  Infinity as InfinityIcon,
  Star,
  Users,
} from "lucide-react"

import { getCatalogCourse, isCertificateEnabled, isSignedIn } from "@/lib/catalog-server"
import { getCourseDetail } from "@/lib/courses-server"
import { getEnrollmentProgress } from "@/lib/enrollments-server"
import { getLandingTheme } from "@/lib/landing-server"
import { themeStyle } from "@/lib/landing-theme"
import { getTranslations } from "@/lib/i18n/server"
import { formatCourseAccess } from "@/lib/courses"
import { levelLabel, normalizeLevel } from "@/lib/course-level"
import { CourseThumb } from "@/components/CourseThumb"
import { PublicHeader } from "@/components/public/PublicHeader"
import { PublicFooter } from "@/components/public/PublicFooter"
import { PublicCurriculum } from "@/components/catalog/PublicCurriculum"
import { EnrollPanel, type EnrollState } from "@/components/catalog/EnrollPanel"
import { plural } from "@/lib/i18n/plural"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const course = await getCatalogCourse(id)
  if (!course) return { title: "Kelas" }
  return {
    title: course.title,
    description: course.description?.slice(0, 160) ?? undefined,
  }
}

/**
 * Pratinjau sebuah kelas untuk orang yang belum punya akun.
 *
 * Susunan informasinya mengikuti apa yang memang dicari orang sebelum
 * memutuskan ikut: apa isinya, berapa lama, untuk siapa, apa syaratnya, siapa
 * pengajarnya, dan apa yang didapat. Yang tidak ada datanya di sini tidak
 * dikarang -- tidak ada tanggal mulai, tidak ada jumlah alumni, tidak ada
 * diskon, karena platform ini belajar mandiri tanpa angkatan dan angka-angka
 * itu tidak ada di basis datanya.
 */
export default async function PratinjauKelasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [course, detail, { locale, t }, theme] = await Promise.all([
    getCatalogCourse(id),
    getCourseDetail(id),
    getTranslations(),
    getLandingTheme(),
  ])

  if (!course || !detail) notFound()

  const [{ enrolled }, bersertifikat, masuk] = await Promise.all([
    getEnrollmentProgress(id),
    isCertificateEnabled(id),
    isSignedIn(),
  ])

  const level = normalizeLevel(course.level)
  const price = formatCourseAccess(course, t.courses)
  const berbayar = course.price > 0

  // Urutannya penting: pengunjung yang belum masuk tidak boleh melihat tombol
  // daftar sama sekali, bahkan untuk kelas publik -- `enroll` akan menolaknya
  // karena tidak ada sesi, dan tombol yang pasti gagal lebih buruk daripada
  // tombol yang jujur menyebut langkah berikutnya.
  const state: EnrollState = enrolled
    ? "terdaftar"
    : !masuk
      ? "anon"
      : berbayar
        ? "berbayar"
        : "dapat-daftar"

  const jumlahModul = detail.sections.filter((s) => s.lessons.length > 0).length
  const jumlahKuis = detail.sections
    .flatMap((s) => s.lessons)
    .filter((l) => l.content_type === "quiz").length

  return (
    <div className="min-h-screen bg-background" style={themeStyle(theme)}>
      <PublicHeader locale={locale} active="kelas" />

      <main id="main-content" tabIndex={-1} className="outline-none">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-8 sm:py-12">
          <Link
            href="/kelas"
            className="mb-6 inline-flex min-h-6 items-center gap-1.5 rounded-md text-sm font-semibold text-ring underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t.catalog.backToCatalog}
          </Link>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex min-w-0 flex-col gap-8">
              <header>
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {price}
                  </span>
                  {level && (
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {levelLabel(level, t)}
                    </span>
                  )}
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {course.language}
                  </span>
                </div>

                <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                  {course.title}
                </h1>

                {course.description && (
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed whitespace-pre-line text-muted-foreground sm:text-base">
                    {course.description}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="size-4 shrink-0" aria-hidden />
                    {course.lesson_count} {t.courses.lessons}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4 shrink-0" aria-hidden />
                    {course.duration_hours} {t.courses.hours}
                  </span>
                  {course.learnerCount !== null && (
                    <span className="flex items-center gap-1.5">
                      <Users className="size-4 shrink-0" aria-hidden />
                      {plural(course.learnerCount, t.catalog.learnersOne, t.catalog.learners)}
                    </span>
                  )}
                  {course.rating && (
                    <span className="flex items-center gap-1.5">
                      <Star className="size-4 shrink-0 fill-current text-amber-500" aria-hidden />
                      {t.catalog.rating
                        .replace("{n}", String(course.rating.average))
                        .replace("{c}", String(course.rating.count))}
                    </span>
                  )}
                </div>
              </header>

              <section aria-labelledby="judul-manfaat">
                <h2 id="judul-manfaat" className="mb-4 text-xl font-bold">
                  {t.catalog.whatYouGet}
                </h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Manfaat
                    icon={InfinityIcon}
                    title={t.catalog.benefitLifetime}
                    desc={t.catalog.benefitLifetimeDesc}
                  />
                  <Manfaat
                    icon={Clock}
                    title={t.catalog.benefitSelfPaced}
                    desc={t.catalog.benefitSelfPacedDesc}
                  />
                  {detail.resource_count > 0 && (
                    <Manfaat
                      icon={FileText}
                      title={plural(detail.resource_count, t.catalog.benefitResourcesOne, t.catalog.benefitResources)}
                      desc={t.catalog.benefitResourcesDesc}
                    />
                  )}
                  {jumlahKuis > 0 && (
                    <Manfaat
                      icon={HelpCircle}
                      title={plural(jumlahKuis, t.catalog.benefitQuizzesOne, t.catalog.benefitQuizzes)}
                      desc={t.catalog.benefitQuizzesDesc}
                    />
                  )}
                  {bersertifikat && (
                    <Manfaat
                      icon={Award}
                      title={t.catalog.benefitCertificate}
                      desc={t.catalog.benefitCertificateDesc}
                    />
                  )}
                </ul>
              </section>

              <section aria-labelledby="judul-kurikulum">
                <h2 id="judul-kurikulum" className="text-xl font-bold">
                  {t.catalog.curriculum}
                </h2>
                <p className="mt-1 mb-1.5 text-sm text-muted-foreground">
                  {(jumlahModul === 1 ? t.catalog.curriculumCountOne : t.catalog.curriculumCount)
                    .replace("{modul}", String(jumlahModul))
                    .replace("{pelajaran}", String(course.lesson_count))}
                </p>
                <p className="mb-4 text-sm text-muted-foreground">{t.catalog.curriculumNote}</p>
                <PublicCurriculum sections={detail.sections} locale={locale} />
              </section>

              {course.who_for.length > 0 && (
                <section aria-labelledby="judul-untuk-siapa">
                  <h2 id="judul-untuk-siapa" className="mb-3 text-xl font-bold">
                    {t.courseDetail.whoFor}
                  </h2>
                  <ul className="flex flex-col gap-2.5 text-sm leading-relaxed text-muted-foreground">
                    {course.who_for.map((line, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {course.requirements.length > 0 && (
                <section aria-labelledby="judul-syarat">
                  <h2 id="judul-syarat" className="mb-3 text-xl font-bold">
                    {t.courseDetail.requirements}
                  </h2>
                  <ul className="flex flex-col gap-2.5 text-sm leading-relaxed text-muted-foreground">
                    {course.requirements.map((line, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section aria-labelledby="judul-instruktur">
                <h2 id="judul-instruktur" className="mb-3 text-xl font-bold">
                  {t.catalog.instructor}
                </h2>
                <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
                  <div className="course-thumb-placeholder size-14 shrink-0 rounded-full" />
                  <div className="min-w-0">
                    <div className="text-base font-bold">
                      {detail.instructor?.name ?? "Tim Sanggabiz"}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {detail.instructor?.bio || t.courseDetail.instructorRole}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-20">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <CourseThumb
                  src={course.thumbnail_url}
                  title={course.title}
                  seed={course.id}
                  className="mb-4 h-[170px] rounded-md"
                />

                <div className="mb-4">
                  <EnrollPanel courseId={course.id} state={state} priceLabel={price} />
                </div>

                <h2 className="mb-2.5 text-sm font-bold">{t.catalog.courseFacts}</h2>
                <dl className="flex flex-col gap-2.5 text-sm">
                  <Fakta icon={BookOpen} label={t.catalog.factLessons}>
                    {course.lesson_count}
                  </Fakta>
                  <Fakta icon={Clock} label={t.catalog.factDuration}>
                    {course.duration_hours} {t.courses.hours}
                  </Fakta>
                  {level && (
                    <Fakta icon={Award} label={t.catalog.factLevel}>
                      {levelLabel(level, t)}
                    </Fakta>
                  )}
                  <Fakta icon={Globe} label={t.catalog.factLanguage}>
                    {course.language}
                  </Fakta>
                  <Fakta icon={Award} label={t.catalog.factCertificate}>
                    {bersertifikat ? t.catalog.certificateYes : t.catalog.certificateNo}
                  </Fakta>
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <PublicFooter locale={locale} />
    </div>
  )
}

function Manfaat({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof BookOpen
  title: string
  desc: string
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-border bg-card p-4">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </li>
  )
}

function Fakta({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof BookOpen
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-muted pb-2.5 last:border-b-0 last:pb-0">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden />
        {label}
      </dt>
      <dd className="min-w-0 text-right font-medium">{children}</dd>
    </div>
  )
}
