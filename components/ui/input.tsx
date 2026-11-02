import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * Ukuran ruas isian.
 *
 * `default` 44px adalah ukuran untuk ruas yang diisi orang: pendaftaran,
 * profil, pengaturan kursus. Sebelumnya seluruh aplikasi memakai 32px, yang
 * terbaca sebagai panel admin internal dan sempit untuk disentuh di ponsel.
 * Sebagai pembanding, Material Design menetapkan 56dp untuk ruas normal dan
 * 48dp untuk varian padat; 44px dipilih karena cukup lega tanpa membuat form
 * panjang berisi enam ruas jadi dua layar.
 *
 * `sm` 36px disediakan untuk tempat yang memang padat dan bukan form yang
 * diisi berurutan -- kotak cari di bilah alat, sel nilai di tabel penilaian.
 * Memaksa 44px di sana justru merusak kepadatan yang disengaja.
 */
type InputSize = "default" | "sm"

const SIZE_CLASS: Record<InputSize, string> = {
  default: "h-11 rounded-lg px-3 text-base",
  sm: "h-9 rounded-md px-2.5 text-sm",
}

function Input({
  className,
  type,
  inputSize = "default",
  ...props
}: React.ComponentProps<"input"> & { inputSize?: InputSize }) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Garis tepi sengaja lebih lembut daripada sebelumnya: begitu setiap
        // ruas punya label yang terlihat, kotaknya tidak perlu lagi berteriak
        // untuk menunjukkan dirinya sebagai ruas isian.
        "w-full min-w-0 border border-input bg-card transition-colors outline-none",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        SIZE_CLASS[inputSize],
        className
      )}
      {...props}
    />
  )
}

export { Input }
export type { InputSize }
