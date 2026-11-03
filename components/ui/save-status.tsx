"use client"

import { AlertCircle, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { useI18n } from "@/components/i18n/LocaleProvider"

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
  unsavedLabel,
  className,
}: {
  state: SaveState
  savedAt?: Date | null
  unsavedLabel?: string
  className?: string
}) {
  const { locale, t } = useI18n()
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn("flex items-center gap-1.5 text-sm", className)}
    >
      {state === "saving" && (
        <>
          <Spinner className="size-3.5" />
          <span className="text-muted-foreground">{t.common.saving}</span>
        </>
      )}

      {state === "saved" && (
        <>
          <Check className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="text-success-foreground">
            {savedAt
              ? t.editor.statusSavedAt.replace(
                  "{waktu}",
                  savedAt.toLocaleTimeString(locale === "en" ? "en-US" : "id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                )
              : t.editor.statusSaved}
          </span>
        </>
      )}

      {state === "unsaved" && <span className="text-muted-foreground">{unsavedLabel ?? t.editor.statusUnsaved}</span>}

      {state === "error" && (
        <>
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="text-destructive">{t.editor.statusError}</span>
        </>
      )}
    </p>
  )
}

export { SaveStatus, type SaveState }
