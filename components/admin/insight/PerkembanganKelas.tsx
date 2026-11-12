import { getTranslations } from "@/lib/i18n/server"
import type { PerkembanganKursus } from "@/lib/perkembangan"
import { AMBANG_PASANGAN } from "@/lib/perkembangan"
import { BilahKenaikan } from "@/components/perkembangan/BilahKenaikan"

/**
 * Perkembangan kelas untuk mentor. Tanpa nama, dan ditahan seluruhnya di
 * bawah AMBANG_PASANGAN -- di kelas kecil, rata-rata per modul ditambah
 * sedikit pengetahuan tentang siapa ikut kelas itu menunjuk satu orang.
 */
export async function PerkembanganKelas({ data }: { data: PerkembanganKursus | null }) {
  if (!data) return null
  const { t } = await getTranslations()

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-bold">{t.perkembangan.classTitle}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{t.perkembangan.classSubtitle}</p>

      {!data.cukup ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {t.perkembangan.tooFew
            .replace("{n}", String(AMBANG_PASANGAN))
            .replace("{ada}", String(data.pasangan))}
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <div className="text-xs text-muted-foreground">{t.perkembangan.before}</div>
              <div className="text-2xl font-bold text-muted-foreground">{data.rataSebelum}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t.perkembangan.after}</div>
              <div className="text-2xl font-bold">{data.rataSesudah}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t.perkembangan.gain}</div>
              <div className="text-2xl font-bold text-primary">
                {data.rataSesudah - data.rataSebelum > 0 ? "+" : ""}
                {data.rataSesudah - data.rataSebelum}
              </div>
            </div>
          </div>

          <h3 className="mt-5 text-sm font-semibold">{t.perkembangan.perModule}</h3>
          <ul className="mt-1 divide-y divide-border">
            {data.modul.map((m) => (
              <BilahKenaikan key={m.sectionId} modul={m} label={t.perkembangan} />
            ))}
          </ul>
        </>
      )}

      {data.dibuang > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          {t.perkembangan.discarded.replace("{n}", String(data.dibuang))}
        </p>
      )}
    </section>
  )
}
