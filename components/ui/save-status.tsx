"use client"

import { AlertCircle, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error"

/**
 * Indikator tiga keadaan untuk pekerjaan yang disimpan bertahap
 * (STANDAR-UMPAN-BALIK-UI.md R12). Setiap keadaan punya **kata**, bukan hanya
 * ikon atau warna, dan seluruhnya duduk di dalam satu live region supaya
 * perubahannya terbaca tanpa memindahkan fokus.
 */
function SaveStatus({
  state,
  savedAt,
  unsavedLabel = "Belum disimpan",
  className,
}: {
  state: SaveState
  savedAt?: Date | null
  unsavedLabel?: string
  className?: string
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn("flex items-center gap-1.5 text-[13px]", className)}
    >
      {state === "saving" && (
        <>
          <Spinner className="size-3.5" />
          <span className="text-muted-foreground">Menyimpan…</span>
        </>
      )}

      {state === "saved" && (
        <>
          <Check className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="text-success-foreground">
            {savedAt
              ? `Tersimpan pukul ${savedAt.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Tersimpan"}
          </span>
        </>
      )}

      {state === "unsaved" && <span className="text-muted-foreground">{unsavedLabel}</span>}

      {state === "error" && (
        <>
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="text-destructive">Gagal menyimpan</span>
        </>
      )}
    </p>
  )
}

export { SaveStatus, type SaveState }
