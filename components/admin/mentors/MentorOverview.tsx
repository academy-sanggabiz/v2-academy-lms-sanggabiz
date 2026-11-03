import { BookOpen, ClipboardCheck, Star, Users } from "lucide-react"

import { StatCard } from "@/components/admin/StatCard"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { completionPct, type MentorOverviewRow } from "@/lib/mentors-server"
import { getTranslations } from "@/lib/i18n/server"

/**
 * Angka-angka di sini sengaja berpasangan dengan jumlah data yang
 * mendasarinya: "100% dari 1 pendaftaran" dan "100% dari 200" adalah dua
 * kenyataan yang sangat berbeda, dan satu persen telanjang menyamarkan itu
 * (docs/STANDAR-PERAN.md §4).
 *
 * Tabel ini juga tidak diurutkan menurut skor apa pun dan tidak memberi
 * peringkat: mentor dengan satu kursus sulit untuk tiga peserta tidak
 * sebanding dengan mentor berisi lima kursus pengantar untuk dua ratus orang.
 */
export async function MentorOverview({ mentors }: { mentors: MentorOverviewRow[] }) {
  const { t } = await getTranslations()
  const totalPublished = mentors.reduce((n, m) => n + m.coursesPublished, 0)
  const totalLearners = mentors.reduce((n, m) => n + m.learners, 0)
  const totalPending = mentors.reduce((n, m) => n + m.pendingReviews, 0)

  const rated = mentors.filter((m) => m.avgRating !== null && m.ratingCount > 0)
  const ratingWeight = rated.reduce((n, m) => n + m.ratingCount, 0)
  const avgRating =
    ratingWeight > 0
      ? rated.reduce((n, m) => n + (m.avgRating ?? 0) * m.ratingCount, 0) / ratingWeight
      : null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t.superadmin.mentorTitle}</h1>
        <p className="text-sm text-muted-foreground">
          {t.superadmin.mentorSubtitle}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label={t.superadmin.mentorStat} value={mentors.length} />
        <StatCard icon={BookOpen} label={t.superadmin.publishedCourses} value={totalPublished} />
        <StatCard icon={Users} label={t.superadmin.learnersReached} value={totalLearners} />
        <StatCard
          icon={ClipboardCheck}
          label={t.superadmin.essaysPending}
          value={totalPending}
          hint={totalPending === 0 ? t.superadmin.noBacklog : t.superadmin.learnersWaiting}
        />
      </div>

      {mentors.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm font-semibold">{t.superadmin.noMentors}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.superadmin.noMentorsHint}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table scrollLabel={t.superadmin.scrollMentors}>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>{t.superadmin.colMentor}</TableHead>
                <TableHead>{t.admin.colCourse}</TableHead>
                <TableHead>{t.admin.colLearner}</TableHead>
                <TableHead>{t.superadmin.colCompletion}</TableHead>
                <TableHead>{t.superadmin.colReviews}</TableHead>
                <TableHead>{t.superadmin.colPendingGrade}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mentors.map((m) => {
                const pct = completionPct(m)
                return (
                  <TableRow key={m.mentorId} className="text-sm">
                    <TableCell>
                      <div className="font-semibold">{m.fullName}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.superadmin.nPublished.replace("{n}", String(m.coursesPublished))}
                      <span className="block text-xs">{t.superadmin.ofNCourses.replace("{n}", String(m.coursesTotal))}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.learners}
                      <span className="block text-xs">{t.superadmin.nEnrollments.replace("{n}", String(m.enrollments))}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {/* Tanda pisah, bukan 0%: belum ada pendaftaran bukan berarti gagal. */}
                      {pct === null ? "—" : `${pct}%`}
                      <span className="block text-xs">
                        {pct === null
                          ? t.superadmin.noEnrollmentsYet
                          : t.superadmin.completedOf
                              .replace("{selesai}", String(m.completed))
                              .replace("{total}", String(m.enrollments))}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.avgRating === null ? (
                        "—"
                      ) : (
                        <span className="flex items-center gap-1">
                          <Star className="size-3.5 fill-current text-amber-500" aria-hidden />
                          {m.avgRating.toFixed(1)}
                        </span>
                      )}
                      <span className="block text-xs">
                        {m.ratingCount === 0
                          ? t.superadmin.noReviewsYet
                          : t.superadmin.nReviews.replace("{n}", String(m.ratingCount))}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.pendingReviews}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {avgRating !== null && (
        <p className="mt-4 text-xs text-muted-foreground">
          {t.superadmin.avgAllMentors
            .replace("{nilai}", avgRating.toFixed(1))
            .replace("{n}", String(ratingWeight))}
        </p>
      )}
    </div>
  )
}
