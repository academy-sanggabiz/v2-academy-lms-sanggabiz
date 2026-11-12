import { cn } from "@/lib/utils"
import type { ModulKenaikan } from "@/lib/perkembangan"

/**
 * Satu baris modul: sebelum, sesudah, dan selisihnya.
 *
 * Arah kenaikan ditulis dengan KATA, bukan hanya warna dan tanda panah
 * (WCAG 1.4.1). Baris yang turun tidak diberi merah menyala: modul yang tidak
 * naik adalah informasi untuk mentor, bukan tuduhan kepada peserta.
 */
export function BilahKenaikan({
  modul,
  label,
}: {
  modul: ModulKenaikan
  label: { nQuestions: string; up: string; down: string; flat: string }
}) {
  const arah = modul.selisih > 0 ? label.up : modul.selisih < 0 ? label.down : label.flat
  const tanda = modul.selisih > 0 ? "+" : ""

  return (
    <li className="grid gap-1.5 py-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="min-w-0 text-sm font-semibold break-words">{modul.title}</span>
        <span className="text-xs text-muted-foreground">
          {label.nQuestions.replace("{n}", String(modul.soal))}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Dua bilah bertumpuk, bukan satu bilah yang "tumbuh": nilai bisa
            TURUN, dan bilah yang hanya bisa memanjang akan menyembunyikannya. */}
        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div className="absolute inset-y-0 left-0 bg-muted-foreground/40" style={{ width: `${modul.sebelum}%` }} />
          <div className="absolute inset-y-0 left-0 h-1 bg-brand-gradient" style={{ width: `${modul.sesudah}%` }} />
        </div>
        <span
          className={cn(
            "w-28 shrink-0 text-right text-xs font-semibold",
            modul.selisih > 0 ? "text-emerald-700" : modul.selisih < 0 ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {modul.sebelum}% → {modul.sesudah}%
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {tanda}
        {modul.selisih} poin · {arah}
      </div>
    </li>
  )
}
