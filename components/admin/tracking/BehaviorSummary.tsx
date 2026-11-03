import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { BehaviorSummary as Data } from "@/lib/behavior-server"
import { getTranslations } from "@/lib/i18n/server"
import type { Dictionary } from "@/lib/i18n/dictionaries"

function durasi(detik: number, t: Dictionary): string {
  if (detik < 60) return t.insight.seconds.replace("{n}", String(detik))
  const menit = Math.round(detik / 60)
  if (menit < 60) return t.insight.minutes.replace("{n}", String(menit))
  const jam = Math.floor(menit / 60)
  return t.insight.hoursMinutes.replace("{j}", String(jam)).replace("{m}", String(menit % 60))
}

/**
 * Lama belajar per kursus, dari peserta yang menyetujui pencatatan.
 *
 * Jumlah yang menyetujui ditampilkan di atas angkanya, bukan di catatan kaki.
 * "Rata-rata 40 menit" yang berasal dari tiga orang terbaca sama meyakinkannya
 * dengan yang berasal dari tiga ratus, dan itu persis kesalahan baca yang
 * paling mahal di layar seperti ini.
 */
export async function BehaviorSummary({ data }: { data: Data }) {
  const { t } = await getTranslations()
  if (!data.ready) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        {t.insight.behaviorNotReadyPrefix} <code>admin_behavior_summary</code>{" "}
        {t.insight.notReadyMiddle}{" "}
        <code>supabase/migrations/20261102010000_tracking_consent.sql</code> {t.insight.notReadyEnd}
      </div>
    )
  }

  const total = data.consent.menyetujui + data.consent.menolak + data.consent.belumMemutuskan

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">{t.insight.behaviorTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {t.insight.consentPrefix}{" "}
          <strong>{data.consent.menyetujui}</strong> {t.insight.ofLearners.replace("{total}", String(total))}
          {data.consent.menolak > 0 && ` ${t.insight.declinedSuffix.replace("{n}", String(data.consent.menolak))}`}
          {data.consent.belumMemutuskan > 0 &&
            t.insight.undecidedSuffix.replace("{n}", String(data.consent.belumMemutuskan))}
          . {t.insight.consentTail}
        </p>
      </div>

      {data.courses.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          {data.consent.menyetujui === 0 ? t.insight.noConsentYet : t.insight.noTimeYet}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table scrollLabel={t.insight.scrollStudyTime}>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>{t.admin.colCourse}</TableHead>
                <TableHead className="text-right">{t.insight.colLearnersHead}</TableHead>
                <TableHead className="text-right">{t.insight.colTotal}</TableHead>
                <TableHead className="text-right">{t.insight.colAverage}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.courses.map((c) => (
                <TableRow key={c.courseId} className="text-sm">
                  <TableCell>{c.courseTitle}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.peserta}</TableCell>
                  <TableCell className="text-right tabular-nums">{durasi(c.totalDetik, t)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {durasi(c.rataDetikPerPeserta, t)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
