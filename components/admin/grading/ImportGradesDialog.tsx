"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { UploadCloud } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { importGradesAction, type ImportGradesSummary } from "@/app/admin/grading/actions"

export function ImportGradesDialog() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [fileName, setFileName] = useState<string | null>(null)
  const [summary, setSummary] = useState<ImportGradesSummary | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /*
   * Impor menilai satu percobaan per baris CSV, berurutan, dan bisa berjalan
   * beberapa menit. Prosesnya tidak atomik dan tidak dapat dilanjutkan: menutup
   * tab di tengah jalan menghentikannya pada baris yang tidak diketahui
   * siapa pun, dengan sebagian nilai sudah masuk dan sebagian belum. Dialognya
   * sudah menolak ditutup; ini menutup jalan keluar yang satu lagi (R16).
   */
  useEffect(() => {
    if (!isPending) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isPending])

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      toast.error(t.grading.pickCsv)
      return
    }

    setFileName(file.name)
    setSummary(null)

    startTransition(async () => {
      const text = await file.text()
      const result = await importGradesAction(text)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setSummary(result.data)
      if (result.data.failedRows.length === 0) {
        toast.success(t.grading.attemptsGraded.replace("{n}", String(result.data.gradedCount)))
      }
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // An import grades one attempt per CSV row, so closing mid-run would
        // hide a job that keeps writing grades for minutes afterwards.
        if (!next && isPending) return
        setOpen(next)
        if (!next) {
          setFileName(null)
          setSummary(null)
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        {t.grading.importGrades}
      </DialogTrigger>
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t.grading.importTitle}</DialogTitle>
          <DialogDescription>
            {t.grading.importDescription}
          </DialogDescription>
        </DialogHeader>

        <div
          onClick={() => !isPending && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          aria-busy={isPending || undefined}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-8 text-center transition-colors",
            isDragging && "border-ring bg-muted/50",
            isPending && "pointer-events-none opacity-60"
          )}
        >
          {isPending ? (
            <Spinner className="size-6 text-muted-foreground" />
          ) : (
            <UploadCloud className="size-6 text-muted-foreground" />
          )}
          {fileName ? (
            <p className="text-sm font-medium">{fileName}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.grading.dropHere} <span className="font-medium text-foreground">{t.grading.clickToChoose}</span>
            </p>
          )}
          {isPending && (
            <p className="text-sm font-medium">
              {t.grading.importingDontClose}
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            disabled={isPending}
            className="hidden"
          />
        </div>

        <div role="status" aria-live="polite">
          {summary && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div>{t.grading.succeededSummary.replace("{n}", String(summary.gradedCount))}</div>
              {summary.failedRows.length > 0 && (
                <div className="mt-2 text-destructive">
                  {t.grading.rowsFailed.replace("{n}", String(summary.failedRows.length))}
                  <ul className="mt-1 list-disc pl-4">
                    {summary.failedRows.map((r, i) => (
                      <li key={i}>
                        {r.attemptId}: {r.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} pending={isPending} pendingLabel={t.grading.importing}>
            {t.grading.done}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
