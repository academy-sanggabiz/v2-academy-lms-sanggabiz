import { CheckCircle2, Circle } from "lucide-react"

import type { TrackingDetail } from "@/lib/tracking-server"
import { Badge } from "@/components/ui/badge"
import { getTranslations } from "@/lib/i18n/server"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"

function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return "\u2014"
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function QuizStatusBadge({ quiz, t }: { quiz: TrackingDetail["quizzes"][number]; t: Dictionary }) {
  if (quiz.status === "not_started") {
    return <Badge variant="outline">{t.insight.badgeNotStarted}</Badge>
  }
  if (quiz.status === "in_progress") {
    return <Badge variant="outline">{t.insight.badgeInProgress}</Badge>
  }
  if (quiz.status === "pending_review") {
    return <Badge className="bg-draft-background text-foreground">{t.insight.badgePendingReview}</Badge>
  }
  return (
    <Badge
      className={
        quiz.passed
          ? "bg-success text-success-foreground"
          : "bg-destructive/10 text-destructive"
      }
    >
      {quiz.passed ? t.insight.badgePassed : t.insight.badgeNotPassed}
    </Badge>
  )
}

export async function TrackingDetailView({ detail }: { detail: TrackingDetail }) {
  const { locale, t } = await getTranslations()
  const sections = new Map<string, typeof detail.lessons>()
  for (const lesson of detail.lessons) {
    const list = sections.get(lesson.sectionTitle) ?? []
    list.push(lesson)
    sections.set(lesson.sectionTitle, list)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h1 className="text-xl font-bold">{detail.learnerName}</h1>
        <p className="text-sm text-muted-foreground">{detail.learnerEmail}</p>
        <p className="mt-1 text-sm font-medium">{detail.courseTitle}</p>
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <div className="text-muted-foreground">{t.insight.moduleCompletion}</div>
            <div className="text-lg font-bold">{detail.modulePct}%</div>
          </div>
          <div>
            {/* Lihat catatan di TrackingListClient: ini keikutsertaan kuis,
                bukan kelulusannya. */}
            <div className="text-muted-foreground">{t.insight.tasksDoneLabel}</div>
            <div className="text-lg font-bold">{detail.assignmentPct}%</div>
            <div className="text-xs text-muted-foreground">{t.insight.submittedNote}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">{t.insight.moduleHead}</h2>
        {sections.size === 0 ? (
          <p className="text-sm text-muted-foreground">{t.insight.noLessons}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {[...sections.entries()].map(([sectionTitle, lessons]) => (
              <div key={sectionTitle}>
                <div className="mb-2 text-xs font-semibold text-muted-foreground">{sectionTitle}</div>
                <div className="flex flex-col gap-1.5">
                  {lessons.map((lesson) => (
                    <div key={lesson.lessonId} className="flex items-center gap-2 text-sm">
                      {lesson.completed ? (
                        <CheckCircle2 className="size-4 shrink-0 text-success-foreground" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className={lesson.completed ? "" : "text-muted-foreground"}>{lesson.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">{t.insight.quizzesHead}</h2>
        {detail.quizzes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.insight.noQuizzesHere}</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 border-b border-border bg-muted/50 px-3 py-2.5 text-sm font-semibold text-muted-foreground">
              <div>{t.admin.colQuiz}</div>
              <div>{t.admin.colStatus}</div>
              <div>{t.insight.colScore}</div>
              <div>{t.insight.colSubmitted}</div>
            </div>
            {detail.quizzes.map((quiz) => (
              <div
                key={quiz.quizId}
                className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-3 border-b border-border px-3 py-3 text-sm last:border-b-0"
              >
                <div className="min-w-0 truncate font-medium">{quiz.quizTitle}</div>
                <div>
                  <QuizStatusBadge quiz={quiz} t={t} />
                </div>
                <div className="text-muted-foreground">{quiz.score !== null ? quiz.score : "—"}</div>
                <div className="text-muted-foreground">{formatDate(quiz.submittedAt, locale)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
