"use client"

import { useI18n } from "@/components/i18n/LocaleProvider"
import { Card, CardContent } from "@/components/ui/card"
import { formatRupiah, formatToken, type LaporanPemakaian } from "@/lib/ai-usage"

/**
 * Pemakaian AI per orang dan per fitur.
 *
 * Hanya hitungan: siapa, berapa panggilan, berapa token, kapan terakhir.
 * Tidak pernah isi pertanyaan maupun jawabannya -- `ai_usage` memang tidak
 * menyimpannya, dan layar ini tidak boleh menjadi alasan untuk mulai
 * menyimpannya.
 */
export function AiUsageView({ laporan }: { laporan: LaporanPemakaian }) {
  const { t, locale } = useI18n()

  const tanggal = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
      day: "numeric",
      month: "short",
    })

  return (
    <div>
      <h1 className="text-3xl font-bold">{t.aiUsage.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.aiUsage.subtitle.replace("{hari}", String(laporan.hari))}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">{t.aiUsage.totalCalls}</div>
            <div className="mt-1 text-2xl font-bold">{formatToken(laporan.totalPanggilan, locale)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">{t.aiUsage.totalTokens}</div>
            <div className="mt-1 text-2xl font-bold">{formatToken(laporan.totalToken, locale)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">{t.aiUsage.totalCost}</div>
            <div className="mt-1 text-2xl font-bold">
              {laporan.totalBiaya === null ? "—" : formatRupiah(laporan.totalBiaya, locale)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Angka biaya yang dikarang lebih buruk daripada tidak ada angka: orang
          akan memutuskan sesuatu berdasarkan angka itu. Jadi ketika harganya
          belum disetel, layar mengatakannya, bukan menampilkan Rp 0. */}
      {laporan.hargaPerJuta === null && (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t.aiUsage.noPrice}
        </p>
      )}

      <h2 className="mt-8 text-lg font-bold">{t.aiUsage.perPerson}</h2>
      {laporan.orang.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t.aiUsage.empty}</p>
      ) : (
        // Wadah yang bisa digulir harus bisa dicapai papan ketik (WCAG 2.1.1):
        // tanpa tabIndex, kolom di luar layar 320px tidak terjangkau sama
        // sekali bagi orang yang tidak memakai tetikus. Pola dan kelasnya
        // mengikuti `components/ui/table.tsx`.
        <div
          tabIndex={0}
          role="group"
          aria-label={t.aiUsage.scrollTable}
          className="mt-2 overflow-x-auto rounded-lg border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{t.aiUsage.colPerson}</th>
                <th className="px-3 py-2 text-right font-semibold">{t.aiUsage.colCalls}</th>
                <th className="px-3 py-2 text-right font-semibold">{t.aiUsage.colTokens}</th>
                <th className="px-3 py-2 text-right font-semibold">{t.aiUsage.colCost}</th>
                <th className="px-3 py-2 text-right font-semibold">{t.aiUsage.colLast}</th>
              </tr>
            </thead>
            <tbody>
              {laporan.orang.map((o) => (
                <tr key={o.userId} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="font-medium">{o.nama}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.peran ? `${o.peran} · ` : ""}
                      {o.email}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatToken(o.panggilan, locale)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatToken(o.token, locale)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {o.biaya === null ? "—" : formatRupiah(o.biaya, locale)}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">
                    {tanggal(o.terakhir)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 text-lg font-bold">{t.aiUsage.perFeature}</h2>
      {laporan.fitur.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t.aiUsage.empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
          {laporan.fitur.map((f) => (
            <li key={f.fitur} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-2.5">
              <span className="text-sm font-medium">{t.aiUsage.featureNames[f.fitur] ?? f.fitur}</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {t.aiUsage.featureLine
                  .replace("{panggilan}", formatToken(f.panggilan, locale))
                  .replace("{token}", formatToken(f.token, locale))}
                {f.biaya !== null ? ` · ${formatRupiah(f.biaya, locale)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-muted-foreground">{t.aiUsage.privacyNote}</p>
    </div>
  )
}
