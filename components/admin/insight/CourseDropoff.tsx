import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CourseDropoff as CourseDropoffData } from "@/lib/insight-server"
import { cn } from "@/lib/utils"

/**
 * Di bagian mana peserta berhenti melanjutkan.
 *
 * Dua angka, dan perbedaannya penting:
 *
 * - **Selesai** menurun sepanjang kursus. Ia menunjukkan bentuk corongnya,
 *   tetapi tidak mengatakan di mana orang berhenti -- setiap pelajaran
 *   setelah titik berhenti juga ikut rendah.
 * - **Berhenti di sini** hanya menghitung peserta yang titik terjauhnya
 *   tepat pelajaran itu dan kursusnya belum selesai. Inilah yang menjawab
 *   pertanyaannya.
 *
 * Semuanya agregat; tidak ada nama peserta di layar ini. Yang per orang ada
 * di layar Pelacakan, tempat pengajar memang perlu tahu siapa yang tertinggal.
 */
export function CourseDropoff({ data }: { data: CourseDropoffData }) {
  if (!data.ready) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Analisis titik berhenti belum aktif: fungsi <code>admin_course_dropoff</code> belum ada di
        basis data. Jalankan{" "}
        <code>supabase/migrations/20261101130000_course_dropoff.sql</code> di SQL Editor Supabase.
      </div>
    )
  }

  if (data.steps.length === 0 || data.totalLearners === 0) return null

  // Pelajaran dengan jumlah berhenti terbanyak, selama angkanya memang
  // menonjol. Tanpa ambang ini, kursus yang pesertanya tersebar merata akan
  // tetap menyorot satu pelajaran seolah-olah ia bermasalah.
  const worst = data.steps.reduce((a, b) => (b.stalled > a.stalled ? b : a))
  const highlightId = worst.stalled >= 2 ? worst.lessonId : null

  return (
    <div className="mt-8 space-y-4">
      <div>
        <h2 className="text-lg font-bold">Di mana peserta berhenti</h2>
        <p className="text-sm text-muted-foreground">
          Dihitung dari penyelesaian pelajaran yang memang sudah dicatat untuk menjalankan kursus.
          Dari {data.totalLearners} peserta terdaftar, {data.notStarted} belum menyelesaikan satu
          pelajaran pun.
        </p>
      </div>

      {highlightId && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          Paling banyak berhenti di <strong>{worst.lessonTitle}</strong> — {worst.stalled} peserta
          berhenti tepat di sini.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <Table scrollLabel="Corong penyelesaian pelajaran, dapat digulir mendatar">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Pelajaran</TableHead>
              <TableHead>Modul</TableHead>
              <TableHead className="text-right">Selesai</TableHead>
              <TableHead className="text-right">Berhenti di sini</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.steps.map((s) => (
              <TableRow
                key={s.lessonId}
                className={cn("text-sm", s.lessonId === highlightId && "bg-muted/40")}
              >
                <TableCell>
                  <span className="text-muted-foreground">{s.stepNo}.</span> {s.lessonTitle}
                </TableCell>
                <TableCell className="text-muted-foreground">{s.sectionTitle}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {s.completed}
                  {s.completedPct !== null && (
                    <span className="ml-1.5 text-xs text-muted-foreground">({s.completedPct}%)</span>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    s.lessonId === highlightId && "font-semibold"
                  )}
                >
                  {s.stalled}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
