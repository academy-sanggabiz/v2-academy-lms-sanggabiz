import { getTranslations } from "@/lib/i18n/server"
import type { PerkembanganPeserta } from "@/lib/perkembangan"
import { BilahKenaikan } from "./BilahKenaikan"

/**
 * Kartu perkembangan untuk peserta, di halaman detail kursus.
 *
 * Tidak dirender sama sekali bila kursusnya tidak punya kuis ukur -- itulah
 * yang membuat fitur ini tidak terlihat oleh kursus yang sedang berjalan.
 */
export async function PerkembanganPesertaCard({ data }: { data: PerkembanganPeserta | null }) {
  if (!data) return null
  const { t } = await getTranslations()

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-bold">{t.perkembangan.title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{t.perkembangan.subtitle}</p>

      {data.sebelum === null ? (
        <p className="mt-4 text-sm text-muted-foreground">{t.perkembangan.noPair}</p>
      ) : data.sesudah === null ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {t.perkembangan.waiting.replace("{n}", `${data.sebelum}%`)}
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <div className="text-xs text-muted-foreground">{t.perkembangan.before}</div>
              <div className="text-2xl font-bold text-muted-foreground">{data.sebelum}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t.perkembangan.after}</div>
              <div className="text-2xl font-bold">{data.sesudah}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t.perkembangan.gain}</div>
              <div className="text-2xl font-bold text-primary">
                {data.sesudah - data.sebelum > 0 ? "+" : ""}
                {data.sesudah - data.sebelum}
              </div>
            </div>
          </div>

          {data.modul.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-semibold">{t.perkembangan.perModule}</h3>
              <ul className="mt-1 divide-y divide-border">
                {data.modul.map((m) => (
                  <BilahKenaikan key={m.sectionId} modul={m} label={t.perkembangan} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  )
}
