import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Tampilan untuk daftar yang masih kosong.
 *
 * Dibuat karena aplikasi ini punya 45 keadaan kosong, hampir semuanya satu
 * kalimat abu-abu yang ditulis ulang di tiap layar: "Belum ada pendaftaran",
 * "Belum ada kursus". Di dasbor pengelola tiga di antaranya muncul sekaligus,
 * sehingga layar pertama pengelola baru adalah tiga kotak kosong yang tidak
 * memberi tahu apa pun.
 *
 * Keadaan kosong adalah tempat terbaik untuk mengajari pengguna, dan di sini
 * ia terbuang. Komponen ini meminta tiga hal yang membuatnya berguna:
 *
 * - **`title`** menyebut apa yang kosong, bukan cuma bahwa ia kosong.
 * - **`description`** menjelaskan KAPAN ia akan terisi. Inilah yang membedakan
 *   "fitur ini belum jalan" dari "memang belum ada datanya" -- dan tanpa itu
 *   pengguna baru tidak bisa membedakan keduanya.
 * - **`action`** memberi satu langkah berikutnya, bila memang ada yang bisa
 *   dilakukan pengguna. Kalau tidak ada, jangan dipaksakan.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon
  title: string
  /** Kapan daftar ini akan terisi. Bukan pengulangan judulnya. */
  description?: string
  action?: React.ReactNode
  className?: string
  /** Untuk kartu kecil di dasbor: lingkaran ikon dan jarak dirapatkan. */
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-10",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-secondary text-primary",
          compact ? "size-10" : "size-12"
        )}
      >
        <Icon className={compact ? "size-5" : "size-6"} />
      </span>

      <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-[15px]")}>
        {title}
      </p>

      {description && (
        <p className="max-w-[34ch] text-xs leading-relaxed text-muted-foreground">{description}</p>
      )}

      {action && <div className={compact ? "mt-1" : "mt-2"}>{action}</div>}
    </div>
  )
}
