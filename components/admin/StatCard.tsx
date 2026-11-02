import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Satu angka ringkasan.
 *
 * Dirapatkan dari versi sebelumnya (kartu 20px padding, label 14px, angka
 * 30px) karena dasbor jadi memakai sekitar sepertiga tinggi layar untuk
 * menampilkan empat angka satu digit, dan sisanya kosong.
 *
 * Dua perubahan yang membuat angkanya lebih berguna, bukan sekadar lebih
 * kecil:
 *
 * - **Label di atas, angka di bawah, ikon jadi pendamping.** Sebelumnya ikon
 *   dan label berbagi baris dengan bobot yang sama besar, sehingga yang
 *   pertama terbaca justru ikonnya, bukan angkanya.
 * - **`hint` selalu punya tempat.** Angka tanpa pembanding hanya bisa dilihat,
 *   tidak bisa dibaca -- "1" tidak berarti apa pun sampai ada "dari 2".
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon
  label: string
  value: number | string
  /** Pembanding singkat: "dari 2 diikuti", "+1 bulan ini". */
  hint?: string
  /** `positive` untuk perubahan yang memang kabar baik. */
  tone?: "default" | "positive"
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      {hint && (
        <div
          className={cn(
            "mt-1 text-xs",
            tone === "positive" ? "font-medium text-success-foreground" : "text-muted-foreground"
          )}
        >
          {hint}
        </div>
      )}
    </div>
  )
}
