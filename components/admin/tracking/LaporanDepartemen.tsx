import { getTranslations } from "@/lib/i18n/server"
import { AMBANG_LAPORAN, keAngkaRingkas, samaAngka } from "@/lib/laporan-departemen"
import type { LaporanDepartemen as Data, RingkasanTersimpan } from "@/lib/laporan-departemen-server"
import type { RingkasanLaporan as Isi } from "@/lib/ai/report-summary"
import { RingkasanLaporan } from "@/components/admin/tracking/RingkasanLaporan"

/**
 * Laporan pelatihan per departemen (F3), untuk superadmin.
 *
 * Duduk sebagai bagian di `/admin/tracking`, bukan layar sendiri. Alasannya
 * bukan kemalasan: `docs/STANDAR-PLATFORM-DIGITAL-LEARNING.md` butir A4
 * mencatat menu pengelola sudah di sebelas entri dan memperingatkan
 * pertumbuhannya, sementara halaman ini memang sudah tempat angka agregat
 * tinggal -- "Lama belajar" (`BehaviorSummary`) persis di bawahnya.
 *
 * **Kelompok di bawah lima orang tidak menampilkan angka.** Yang ditahan
 * angkanya, bukan barisnya: menghilangkan departemennya membuat jumlah tidak
 * pernah cocok dan terbaca seperti data rusak, sedangkan baris yang
 * mengatakan kenapa angkanya kosong justru memberi tahu apa yang kurang.
 */
export async function LaporanDepartemen({
  data,
  ringkasan,
}: {
  data: Data
  ringkasan: RingkasanTersimpan | null
}) {
  const { t } = await getTranslations()

  if (data.baris.length === 0) {
    return (
      <div className="space-y-3">
        <Judul t={t} />
        <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          {t.laporanDepartemen.empty}
        </p>
      </div>
    )
  }

  const angkaSekarang = keAngkaRingkas(data.baris, t.laporanDepartemen.noDepartment)
  const bisaDiringkas = angkaSekarang.departemen.length > 0

  /*
   * "Basi" dinilai dengan membandingkan angka yang disimpan bersama ringkasan
   * terhadap angka hari ini. Itulah gunanya `ai_report_summaries.figures`:
   * tanpanya, ringkasan bulan lalu tampil persis sewibawa ringkasan tadi
   * pagi, dan tidak ada cara pembacanya tahu.
   */
  let isi: Isi | null = null
  if (ringkasan) {
    try {
      const diurai = JSON.parse(ringkasan.teks) as Isi
      if (typeof diurai?.ringkas === "string") isi = diurai
    } catch {
      // Ringkasan lama yang bukan JSON ditampilkan apa adanya daripada hilang.
      isi = { ringkas: ringkasan.teks, temuan: [], saran: [] }
    }
  }
  const basi = ringkasan !== null && !samaAngka(ringkasan.angka, angkaSekarang)

  const ditahan = data.total.ditahan

  return (
    <div className="space-y-3">
      <Judul t={t} />

      <RingkasanLaporan
        isi={isi}
        dibuatPada={ringkasan?.dibuatPada ?? null}
        basi={basi}
        bisaDiringkas={bisaDiringkas}
      />

      {ditahan > 0 && (
        <p className="text-sm text-muted-foreground">
          {t.laporanDepartemen.withheldCount
            .replace("{n}", String(ditahan))
            .replace("{ambang}", String(AMBANG_LAPORAN))}
        </p>
      )}

      {/*
        Wadah yang bisa digulir harus bisa dicapai papan ketik (WCAG 2.1.1);
        polanya sama dengan `components/ui/table.tsx`.
      */}
      <div
        tabIndex={0}
        role="group"
        aria-label={t.laporanDepartemen.scrollTable}
        className="overflow-x-auto rounded-lg border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">
                {t.laporanDepartemen.colDepartment}
              </th>
              <Th>{t.laporanDepartemen.colPeople}</Th>
              <Th>{t.laporanDepartemen.colEnrollments}</Th>
              <Th>{t.laporanDepartemen.colCompleted}</Th>
              <Th>{t.laporanDepartemen.colCertificates}</Th>
              <Th>{t.laporanDepartemen.colOverdue}</Th>
              <Th>{t.laporanDepartemen.colNotStarted}</Th>
            </tr>
          </thead>
          <tbody>
            {data.baris.map((b) => (
              <tr key={b.id ?? "tanpa"} className="border-t border-border">
                <td className="px-3 py-2">{b.nama ?? t.laporanDepartemen.noDepartment}</td>
                <Td>{b.orang}</Td>
                {b.angka ? (
                  <>
                    <Td>{b.angka.pendaftaran}</Td>
                    <Td>
                      {b.angka.selesai}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({b.angka.persenSelesai}%)
                      </span>
                    </Td>
                    <Td>{b.angka.sertifikat}</Td>
                    <Td>{b.angka.lewatTenggat}</Td>
                    <Td>{b.angka.wajibBelumMulai}</Td>
                  </>
                ) : (
                  /*
                    Satu sel menjelaskan penahanannya, bukan lima sel berisi
                    tanda hubung. Tanda hubung terbaca sebagai nol, dan nol
                    pendaftaran adalah pernyataan yang justru tidak boleh
                    dibuat tentang kelompok sekecil ini.
                  */
                  <td colSpan={5} className="px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {t.laporanDepartemen.withheld}
                    </span>{" "}
                    {t.laporanDepartemen.withheldWhy.replace("{n}", String(AMBANG_LAPORAN))}
                  </td>
                )}
              </tr>
            ))}
            <tr className="border-t-2 border-border bg-muted/30 font-semibold">
              <td className="px-3 py-2">{t.laporanDepartemen.totalRow}</td>
              <Td>{data.total.orang}</Td>
              <Td>{data.total.pendaftaran}</Td>
              <Td>
                {data.total.selesai}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({data.total.persenSelesai}%)
                </span>
              </Td>
              <Td>{data.total.sertifikat}</Td>
              <Td>{data.total.lewatTenggat}</Td>
              <Td>{data.total.wajibBelumMulai}</Td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Judul({ t }: { t: Awaited<ReturnType<typeof getTranslations>>["t"] }) {
  return (
    <div>
      <h2 className="text-lg font-bold">{t.laporanDepartemen.title}</h2>
      <p className="text-sm text-muted-foreground">{t.laporanDepartemen.subtitle}</p>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-right font-semibold">{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-right tabular-nums">{children}</td>
}
