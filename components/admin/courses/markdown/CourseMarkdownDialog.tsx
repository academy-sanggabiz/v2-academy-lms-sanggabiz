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
      toast.error("Pilih berkas .md")
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
      toast.success("Berkas terbaca. Periksa hasilnya, lalu simpan.")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" disabled={pending}>
            <Sparkles className="size-4" aria-hidden />
            Impor / ekspor
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Susun kursus dengan bantuan AI</DialogTitle>
          <DialogDescription>
            Sanggabiz tidak memanggil AI. Anda memakai asisten AI yang sudah Anda punya, lalu
            mengimpor hasilnya ke sini.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-5">
          <Step number={1} title="Unduh panduan penulisan">
            <p className="mb-2.5 text-sm text-muted-foreground">
              Berisi format berkas dan aturan menulis pelajaran yang baik.
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

          <Step number={2} title="Bawa ke asisten AI Anda">
            <p className="text-sm text-muted-foreground">
              Buka ChatGPT, Claude, atau yang lain. Berikan panduan itu bersama materi dan SOP
              Anda, lalu minta satu berkas <code className="text-xs">.md</code> sebagai
              keluarannya.
            </p>
          </Step>

          <Step number={3} title="Unggah hasilnya">
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
                {pending ? "Membaca…" : (fileName ?? "Pilih berkas .md")}
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
                {`Kursus ini sudah punya ${learnerCount} pendaftaran, jadi isinya tidak bisa diganti lewat impor. Ekspor di bawah tetap bisa dipakai.`}
              </StatusMessage>
            )}
          </Step>
        </ol>

        {report && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold">
              Terbaca: {report.sections} modul, {report.lessons} pelajaran, {report.questions} soal
            </p>
            {report.warnings.length > 0 ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Beberapa bagian dilewati atau dibetulkan sendiri:
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {report.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Tidak ada yang terlewat.</p>
            )}
            <p className="mt-3 text-sm">
              Hasilnya sudah masuk ke editor sebagai draf. Periksa dulu, lalu tekan Simpan.
            </p>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={exportFile} disabled={pending}>
            <FileText className="size-4" aria-hidden />
            Ekspor kursus ini
          </Button>
          {/* "Selesai", bukan "Tutup": dialog ini sudah punya tombol silang
              bawaan yang bernama "Tutup", dan dua kontrol bernama sama di satu
              dialog membuat pembaca layar menyebut keduanya persis sama. */}
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Selesai
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
