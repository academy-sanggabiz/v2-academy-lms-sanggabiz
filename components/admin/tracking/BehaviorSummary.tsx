import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { BehaviorSummary as Data } from "@/lib/behavior-server"

function durasi(detik: number): string {
  if (detik < 60) return `${detik} detik`
  const menit = Math.round(detik / 60)
  if (menit < 60) return `${menit} menit`
  const jam = Math.floor(menit / 60)
  return `${jam} jam ${menit % 60} menit`
}

/**
 * Lama belajar per kursus, dari peserta yang menyetujui pencatatan.
 *
 * Jumlah yang menyetujui ditampilkan di atas angkanya, bukan di catatan kaki.
 * "Rata-rata 40 menit" yang berasal dari tiga orang terbaca sama meyakinkannya
 * dengan yang berasal dari tiga ratus, dan itu persis kesalahan baca yang
 * paling mahal di layar seperti ini.
 */
export function BehaviorSummary({ data }: { data: Data }) {
  if (!data.ready) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Pelacakan perilaku belum aktif: fungsi <code>admin_behavior_summary</code> belum ada di
        basis data. Jalankan{" "}
        <code>supabase/migrations/20261102010000_tracking_consent.sql</code> di SQL Editor.
      </div>
    )
  }

  const total = data.consent.menyetujui + data.consent.menolak + data.consent.belumMemutuskan

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Lama belajar</h2>
        <p className="text-sm text-muted-foreground">
          Dicatat hanya untuk peserta yang menyetujuinya:{" "}
          <strong>{data.consent.menyetujui}</strong> dari {total} peserta
          {data.consent.menolak > 0 && ` (${data.consent.menolak} menolak)`}
          {data.consent.belumMemutuskan > 0 && `, ${data.consent.belumMemutuskan} belum memutuskan`}.
          Angka di bawah karena itu menggambarkan kelompok itu saja, bukan seluruh peserta.
        </p>
      </div>

      {data.courses.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          {data.consent.menyetujui === 0
            ? "Belum ada peserta yang menyetujui pencatatan, jadi belum ada yang bisa ditampilkan."
            : "Belum ada waktu belajar yang tercatat."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table scrollLabel="Lama belajar per kursus, dapat digulir mendatar">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Kursus</TableHead>
                <TableHead className="text-right">Peserta</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Rata-rata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.courses.map((c) => (
                <TableRow key={c.courseId} className="text-sm">
                  <TableCell>{c.courseTitle}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.peserta}</TableCell>
                  <TableCell className="text-right tabular-nums">{durasi(c.totalDetik)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {durasi(c.rataDetikPerPeserta)}
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
