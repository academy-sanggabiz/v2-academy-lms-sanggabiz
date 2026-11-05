"use client"

import { useRef, useState } from "react"
import { Images } from "lucide-react"
import { toast } from "sonner"

import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n/LocaleProvider"

export type UploadedImage = { url: string; fileName: string }

/**
 * Zona unggah banyak berkas sekaligus (docs/STANDAR-HALAMAN-DEPAN.md §3).
 *
 * Belasan logo atau foto dipilih sekali, lalu masing-masing jadi satu butir
 * blok. Berkas diunggah berurutan, bukan serentak: Storage menolak dengan
 * pesan yang jelas per berkas, dan satu yang gagal tidak membatalkan yang
 * lain -- yang berhasil tetap dikembalikan lewat `onUploaded`.
 */
export function BulkImageDropzone({
  label,
  hint,
  uploadFn,
  onUploaded,
  disabled,
}: {
  label: string
  hint: string
  uploadFn: (file: File) => Promise<{ url: string } | { error: string }>
  onUploaded: (images: UploadedImage[]) => void
  disabled?: boolean
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function uploadAll(files: File[]) {
    if (files.length === 0 || progress) return
    setProgress({ done: 0, total: files.length })
    const ok: UploadedImage[] = []
    let failed = 0
    for (const [i, file] of files.entries()) {
      const result = await uploadFn(file)
      if ("error" in result) {
        failed++
        toast.error(`${file.name}: ${result.error}`)
      } else {
        ok.push({ url: result.url, fileName: file.name })
      }
      setProgress({ done: i + 1, total: files.length })
    }
    setProgress(null)
    if (ok.length > 0) {
      onUploaded(ok)
      toast.success(t.superadmin.bulkUploadDone.replace("{n}", String(ok.length)))
    }
    if (failed > 0 && ok.length === 0) {
      toast.error(t.superadmin.bulkUploadFailed.replace("{n}", String(failed)))
    }
  }

  const busy = progress !== null

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ""
          void uploadAll(files)
        }}
      />
      <div
        role="button"
        tabIndex={0}
        aria-busy={busy || undefined}
        aria-disabled={disabled || undefined}
        onClick={() => !busy && !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !busy && !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy && !disabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (busy || disabled) return
          void uploadAll(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")))
        }}
        className={cn(
          "flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center",
          !busy && !disabled && "cursor-pointer hover:bg-muted/50",
          dragOver && "border-ring bg-secondary"
        )}
      >
        {busy ? (
          <span role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            {t.superadmin.bulkUploadProgress
              .replace("{done}", String(progress.done))
              .replace("{total}", String(progress.total))}
          </span>
        ) : (
          <>
            <Images className="size-5 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">{t.superadmin.bulkUploadLabel}</span>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
