import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { QuestionDifficulty, QuizEffort } from "@/lib/insight-server"
import { getTranslations } from "@/lib/i18n/server"

/** Membuang tag HTML dari prompt soal supaya aman tampil sebagai teks biasa. */
function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

/**
 * Wawasan belajar per kursus: bagian mana yang sulit, dan seberapa keras
 * peserta harus berusaha untuk lulus.
 *
 * Seluruh angka di sini **agregat lintas peserta**, bukan per orang. Itu
 * disengaja: pertanyaan yang ingin dijawab pengajar adalah "bagian mana yang
 * sulit", dan itu pertanyaan tentang materinya. Melihat per orang tersedia di
 * layar Pelacakan, di mana memang ada keperluannya.
 */
export async function CourseInsight({
  questions,
  effort,
}: {
  questions: QuestionDifficulty[]
  effort: QuizEffort[]
}) {
  const { t } = await getTranslations()
  const answered = questions.filter((q) => q.answered > 0)
  if (answered.length === 0 && effort.length === 0) return null

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-lg font-bold">{t.insight.strugglesTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {t.insight.strugglesSubtitle}
        </p>
      </div>

      {answered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table scrollLabel={t.insight.scrollHardest}>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>{t.insight.colQuestion}</TableHead>
                <TableHead>{t.insight.colLesson}</TableHead>
                <TableHead>{t.insight.colCorrect}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {answered.map((q) => (
                <TableRow key={q.questionId} className="text-sm">
                  <TableCell className="max-w-md">
                    <span className="line-clamp-2">{plainText(q.prompt)}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {q.lessonTitle}
                    <span className="block text-xs">{q.sectionTitle}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {q.correctPct}%
                    <span className="block text-xs">
                      {t.insight.ofAnswers.replace("{benar}", String(q.correct)).replace("{total}", String(q.answered))}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {effort.length > 0 && (
        <>
          <div>
            <h2 className="text-lg font-bold">{t.insight.effortTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {t.insight.effortSubtitle}
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <Table scrollLabel={t.insight.scrollEffort}>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>{t.admin.colQuiz}</TableHead>
                  <TableHead>{t.insight.colPassed}</TableHead>
                  <TableHead>{t.insight.colAttemptsToPass}</TableHead>
                  <TableHead>{t.insight.colFirstScore}</TableHead>
                  <TableHead>{t.insight.colBestScore}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {effort.map((e) => (
                  <TableRow key={e.quizId} className="text-sm">
                    <TableCell className="font-semibold">{e.lessonTitle}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.insight.passedOf.replace("{lulus}", String(e.passed)).replace("{total}", String(e.learners))}
                      <span className="block text-xs">{t.insight.attemptsTotal.replace("{n}", String(e.attempts))}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {/* Tanda pisah, bukan nol: belum ada yang lulus bukan berarti nol kali. */}
                      {e.avgAttemptsToPass === null ? "—" : `${e.avgAttemptsToPass}×`}
                      <span className="block text-xs">
                        {e.avgAttemptsToPass === null ? t.insight.nonePassed : t.insight.average}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.avgFirstScore === null ? "—" : e.avgFirstScore}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.avgBestScore === null ? "—" : e.avgBestScore}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
