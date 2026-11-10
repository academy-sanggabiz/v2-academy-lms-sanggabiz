"use client"

import { useState, useTransition } from "react"
import { Download, Sparkles, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { StatusMessage } from "@/components/ui/status-message"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n/LocaleProvider"
import type { CourseDraft } from "@/lib/course-draft"
import type { ParseReport } from "@/lib/course-markdown"
import type { KerangkaKursus } from "@/lib/ai/sop"
import { buatKerangkaDariSop, tulisKursusDariKerangka } from "@/app/admin/courses/sop-actions"

type Diimpor = Pick<
  CourseDraft,
  "title" | "description" | "requirementsText" | "audienceText" | "level" | "passingGrade" | "sections"
>

/**
 * Menyusun kursus dari dokumen SOP.
 *
 * Dua langkah yang terlihat, bukan satu tombol ajaib: kerangka dulu, lalu
 * penulisan. Mentor membaca daftar modul dan pelajaran sebelum satu kalimat
 * materi pun ditulis, dan bisa berhenti di situ kalau kerangkanya meleset --
 * yang sering terjadi ketika SOP-nya ternyata dokumen yang salah.
 *
 * Hasilnya masuk ke DRAF di editor, tidak pernah langsung ke basis data. Itu
 * aturan yang sama dengan impor berkas `.md`, dan di sinilah ia paling
 * penting: teks buatan model harus dibaca manusia sebelum menjadi kursus.
 */
export function SopDialog({
  courseId,
  canImport,
  learnerCount,
  aiAktif,
  openOnMount = false,
  onImported,
}: {
  courseId: string
  canImport: boolean
  learnerCount: number
  /** Dibuka sendiri saat editor dicapai lewat "Buat otomatis dengan AI" di
   *  daftar kursus. Pola yang sama dengan CourseMarkdownDialog. */
  openOnMount?: boolean
  /** Diputuskan di server. Tanpa kunci AI tombolnya tidak dirender sama
   *  sekali -- standar v2 melarang kontrol yang pasti gagal. */
  aiAktif: boolean
  onImported: (patch: Diimpor) => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(openOnMount)
  const [pending, startTransition] = useTransition()
  const [kerangka, setKerangka] = useState<KerangkaKursus | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [namaBerkas, setNamaBerkas] = useState<string | null>(null)
  const [report, setReport] = useState<ParseReport | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  if (!aiAktif) return null

  function bacaBerkas(file: File) {
    setNamaBerkas(file.name)
    setKerangka(null)
    setReport(null)
    setGalat(null)

    const form = new FormData()
    form.set("berkas", file)

    startTransition(async () => {
      const hasil = await buatKerangkaDariSop(courseId, form)
      if (!hasil.ok) {
        setGalat(hasil.error)
        return
      }
      setKerangka(hasil.data.kerangka)
      setGenerationId(hasil.data.generationId)
    })
  }

  function tulis() {
    if (!generationId) return
    setGalat(null)
    startTransition(async () => {
      const hasil = await tulisKursusDariKerangka(courseId, generationId)
      if (!hasil.ok) {
        setGalat(hasil.error)
        return
      }
      setReport(hasil.data.parsed.report)
      onImported(hasil.data.parsed.draft)
      toast.success(t.sop.done)
    })
  }

  const jumlahPelajaran = kerangka?.modul.reduce((n, m) => n + m.pelajaran.length, 0) ?? 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" disabled={pending}>
            {/* Kilau ✨ milik jalur yang BENAR-BENAR memanggil AI. Impor .md
                memakai ikon unggah, karena yang dilakukannya memindahkan
                berkas, bukan memanggil model. */}
            <Sparkles className="size-4" aria-hidden />
            {t.editor.createWithAi}
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.sop.title}</DialogTitle>
          <DialogDescription>{t.sop.desc}</DialogDescription>
        </DialogHeader>

        {!canImport ? (
          /* Keselamatan, bukan kewenangan: mengganti seluruh isi kursus yang
             sedang diikuti orang membuat kemajuan belajar mereka menunjuk
             pelajaran yang sudah tidak ada. */
          <StatusMessage className="rounded-lg bg-muted px-3 py-2">
            {t.sop.lockedByLearners.replace("{n}", String(learnerCount))}
          </StatusMessage>
        ) : (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold">{t.sop.step1}</h3>
              <p className="mt-1 mb-2.5 text-sm text-muted-foreground">{t.sop.step1Desc}</p>
              {/* Label yang membungkus input berkas, bukan tombol yang
                  mengklik input tersembunyi: pola itu meninggalkan input
                  tanpa nama terbaca dan satu perhentian tab tak terlihat.
                  Sama dengan CourseMarkdownDialog. */}
              <label
                className={cn(
                  "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm font-medium",
                  "hover:bg-muted focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                  pending && "pointer-events-none opacity-60"
                )}
              >
                <Upload className="size-4" aria-hidden />
                {pending && !kerangka ? t.sop.reading : (namaBerkas ?? t.sop.pickFile)}
                <input
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf,.md,.txt,text/plain,text/markdown"
                  className="sr-only"
                  disabled={pending}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) bacaBerkas(file)
                    event.target.value = ""
                  }}
                />
              </label>
              {/* Tombol unduh contoh, pola yang sama dengan dialog impor
                  Markdown: fitur yang meminta unggahan tidak bisa dicoba
                  oleh orang yang belum punya berkasnya. */}
              <p className="mt-2.5 text-xs text-muted-foreground">{t.sop.sampleHint}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 px-0"
                render={<a href="/admin/courses/contoh-dokumen" download />}
                nativeButton={false}
              >
                <Download className="size-4" aria-hidden />
                {t.sop.sampleFile}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">{t.sop.privacy}</p>
            </div>

            <StatusMessage>{galat}</StatusMessage>

            {kerangka && !report && (
              <div>
                <h3 className="text-sm font-semibold">{t.sop.step2}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.sop.outlineCount
                    .replace("{modul}", String(kerangka.modul.length))
                    .replace("{pelajaran}", String(jumlahPelajaran))}
                </p>
                <div className="mt-2.5 rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm font-semibold">{kerangka.judul}</p>
                  <ol className="mt-2 space-y-2">
                    {kerangka.modul.map((m, i) => (
                      <li key={`${m.judul}-${i}`}>
                        <span className="text-sm font-medium">
                          {i + 1}. {m.judul}
                        </span>
                        <ul className="mt-0.5 ml-4 list-disc text-xs text-muted-foreground">
                          {m.pelajaran.map((p, j) => (
                            <li key={`${p.judul}-${j}`}>{p.judul}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                </div>
                <Button
                  className="mt-3 bg-brand-gradient text-white hover:brightness-105"
                  pending={pending}
                  pendingLabel={t.sop.writing}
                  onClick={tulis}
                >
                  {t.sop.writeButton}
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">{t.sop.writeNote}</p>
                {/* Peringatan yang sama dibawa setiap keluaran AI di aplikasi
                    ini (lihat discussAiNote dan assistantAiNote). Kursus
                    hasil AI justru yang paling perlu membawanya. */}
                <p className="mt-1 text-xs text-muted-foreground">{t.sop.aiNote}</p>
              </div>
            )}

            {report && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-semibold">{t.sop.done}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.sop.reportCount
                    .replace("{modul}", String(report.sections))
                    .replace("{pelajaran}", String(report.lessons))
                    .replace("{soal}", String(report.questions))}
                </p>
                {report.warnings.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground">
                    {report.warnings.slice(0, 8).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-muted-foreground">{t.sop.reviewNote}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.sop.aiNote}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
