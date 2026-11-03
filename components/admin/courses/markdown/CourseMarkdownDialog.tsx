"use client"

import { useState, useTransition } from "react"
import { Download, FileText, Upload, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { importCourseMarkdownAction } from "@/app/admin/courses/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { StatusMessage } from "@/components/ui/status-message"
import { courseToMarkdown, type ParseReport } from "@/lib/course-markdown"
import type { CourseDraft } from "@/lib/course-draft"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n/LocaleProvider"

/**
 * Jembatan ke AI yang sudah dipakai penyusun kursus, tanpa LMS ini memanggil
 * AI sama sekali.
 *
 * Alurnya tiga langkah dan dialognya mengikuti urutan itu apa adanya: unduh
 * panduan, bawa ke asisten AI bersama materi sendiri, unggah hasilnya. Tombol
 * unduh panduan sengaja ada **di sini**, bukan di halaman dokumentasi
 * terpisah: orang membutuhkannya justru saat sedang berdiri di layar ini.
 *
 * Hasil impor tidak pernah langsung tersimpan. Ia masuk ke draf di editor,
 * penyusun memeriksanya, lalu menekan Simpan sendiri -- satu berkas yang
 * meleset tidak boleh menghapus pekerjaan tanpa jejak.
 */
export function CourseMarkdownDialog({
  courseId,
  draft,
  canImport,
  learnerCount,
  openOnMount = false,
  onImported,
}: {
  courseId: string
  draft: CourseDraft
  canImport: boolean
  learnerCount: number
  /** Dibuka sendiri saat editor dicapai lewat "Impor dari berkas" di daftar kursus. */
  openOnMount?: boolean
  onImported: (parsed: Pick<CourseDraft, "title" | "description" | "requirementsText" | "audienceText" | "level" | "passingGrade" | "sections">) => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(openOnMount)
  const [pending, startTransition] = useTransition()
  const [report, setReport] = useState<ParseReport | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  function exportFile() {
    const blob = new Blob([courseToMarkdown(draft)], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const slug = draft.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    link.download = `${slug || "kursus"}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  function readFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".md") && !file.type.startsWith("text/")) {
      toast.error(t.editor.mdPickFile)
      return
    }
    setFileName(file.name)
    setReport(null)

    startTransition(async () => {
      const text = await file.text()
      const result = await importCourseMarkdownAction(courseId, text)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setReport(result.data.report)
      onImported(result.data.draft)
      toast.success(t.editor.mdFileRead)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" disabled={pending}>
            <Sparkles className="size-4" aria-hidden />
            {t.editor.mdImportExport}
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.editor.mdTitle}</DialogTitle>
          <DialogDescription>
            {t.editor.mdDesc}
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-5">
          <Step number={1} title={t.editor.mdStep1}>
            <p className="mb-2.5 text-sm text-muted-foreground">
              {t.editor.mdStep1Desc}
            </p>
            <Button
              variant="outline"
              size="sm"
              render={<a href="/admin/courses/panduan" download />}
              nativeButton={false}
            >
              <Download className="size-4" aria-hidden />
              panduan-kursus-sanggabiz.md
            </Button>
          </Step>

          <Step number={2} title={t.editor.mdStep2}>
            <p className="text-sm text-muted-foreground">
              {t.editor.mdStep2Desc1} <code className="text-xs">.md</code>{" "}
              {t.editor.mdStep2Desc2}
            </p>
          </Step>

          <Step number={3} title={t.editor.mdStep3}>
            {canImport ? (
              /*
                Label yang membungkus input berkas, bukan tombol yang mengklik
                input tersembunyi lewat ref. Pola tombol itu meninggalkan dua
                masalah sekaligus: inputnya tidak punya nama yang terbaca
                (axe: label, kritis), dan karena `sr-only` tetap bisa difokus,
                ia menjadi perhentian tab kedua yang tak terlihat. Dengan label
                pembungkus, inputnya tetap kontrol asli dengan nama, dan hanya
                ada satu perhentian tab.
              */
              <label
                className={cn(
                  "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm font-medium",
                  "hover:bg-muted focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                  pending && "pointer-events-none opacity-60"
                )}
              >
                <Upload className="size-4" aria-hidden />
                {pending ? t.editor.mdReading : (fileName ?? t.editor.mdPickFileBtn)}
                <input
                  type="file"
                  accept=".md,text/markdown,text/plain"
                  className="sr-only"
                  disabled={pending}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) readFile(file)
                    event.target.value = ""
                  }}
                />
              </label>
            ) : (
              /* Bukan larangan kewenangan melainkan keselamatan: mengganti
                 seluruh isi kursus yang sedang diikuti orang membuat kemajuan
                 belajar mereka menunjuk pelajaran yang sudah tidak ada. */
              <StatusMessage className="rounded-lg bg-muted px-3 py-2">
                {t.editor.mdLockedByLearners.replace("{n}", String(learnerCount))}
              </StatusMessage>
            )}
          </Step>
        </ol>

        {report && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold">
              {t.editor.mdReport
                .replace("{modul}", String(report.sections))
                .replace("{pelajaran}", String(report.lessons))
                .replace("{soal}", String(report.questions))}
            </p>
            {report.warnings.length > 0 ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t.editor.mdWarningsIntro}
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {report.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{t.editor.mdNoWarnings}</p>
            )}
            <p className="mt-3 text-sm">
              {t.editor.mdResultNote}
            </p>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={exportFile} disabled={pending}>
            <FileText className="size-4" aria-hidden />
            {t.editor.mdExportThis}
          </Button>
          {/* "Selesai", bukan "Tutup": dialog ini sudah punya tombol silang
              bawaan yang bernama "Tutup", dan dua kontrol bernama sama di satu
              dialog membuat pembaca layar menyebut keduanya persis sama. */}
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            {t.editor.done}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Step({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="flex size-6 flex-none items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary"
      >
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-sm font-semibold">{title}</div>
        {children}
      </div>
    </li>
  )
}
