import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { QuestionDifficulty, QuizEffort } from "@/lib/insight-server"

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
export function CourseInsight({
  questions,
  effort,
}: {
  questions: QuestionDifficulty[]
  effort: QuizEffort[]
}) {
  const answered = questions.filter((q) => q.answered > 0)
  if (answered.length === 0 && effort.length === 0) return null

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-lg font-bold">Di mana peserta kesulitan</h2>
        <p className="text-sm text-muted-foreground">
          Dihitung dari jawaban yang sudah masuk, digabung lintas peserta. Soal yang belum
          pernah dijawab tidak ditampilkan.
        </p>
      </div>

      {answered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table scrollLabel="Soal tersulit, dapat digulir mendatar">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Soal</TableHead>
                <TableHead>Pelajaran</TableHead>
                <TableHead>Benar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {answered.map((q) => (
                <TableRow key={q.questionId} className="text-[14px]">
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
                      {q.correct} dari {q.answered} jawaban
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
            <h2 className="text-lg font-bold">Seberapa berat kuisnya</h2>
            <p className="text-sm text-muted-foreground">
              Percobaan tidak dibatasi, jadi angka ini menunjukkan berapa kali peserta perlu
              mengulang sampai paham — bukan berapa kali ia boleh mencoba.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <Table scrollLabel="Beban kuis, dapat digulir mendatar">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Kuis</TableHead>
                  <TableHead>Lulus</TableHead>
                  <TableHead>Percobaan sampai lulus</TableHead>
                  <TableHead>Nilai percobaan pertama</TableHead>
                  <TableHead>Nilai terbaik</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {effort.map((e) => (
                  <TableRow key={e.quizId} className="text-[14px]">
                    <TableCell className="font-semibold">{e.lessonTitle}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.passed} dari {e.learners}
                      <span className="block text-xs">{e.attempts} percobaan seluruhnya</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {/* Tanda pisah, bukan nol: belum ada yang lulus bukan berarti nol kali. */}
                      {e.avgAttemptsToPass === null ? "—" : `${e.avgAttemptsToPass}×`}
                      <span className="block text-xs">
                        {e.avgAttemptsToPass === null ? "belum ada yang lulus" : "rata-rata"}
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
