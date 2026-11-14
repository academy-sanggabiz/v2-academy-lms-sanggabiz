"use client"

import { useRef, useState, useTransition } from "react"
import { AlertTriangle, Trash2, Upload } from "lucide-react"

import { bersihkanMateriAction } from "@/app/admin/courses/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { StatusMessage } from "@/components/ui/status-message"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { InteractiveMaterial } from "@/components/learn/InteractiveMaterial"
import { BATAS_BERKAS, type HasilBersih } from "@/lib/interactive-lesson"

/**
 * Penyunting materi interaktif (`docs/STANDAR-MATERI-INTERAKTIF.md` §5).
 *
 * Alurnya sengaja satu arah: materinya dibuat di tempat lain -- dengan AI,
 * dengan tangan, dengan apa pun -- lalu diunggah ke sini sebagai satu berkas
 * `.html`. Yang disimpan BUKAN berkas aslinya, melainkan hasil yang sudah
 * dibersihkan, karena menyimpan aslinya berarti ada versi berbahaya yang
 * diam-diam ikut tersimpan menunggu seseorang merendernya.
 *
 * Kotak "Perbaikan kecil" memang menyimpan HTML mentah, dan itu disengaja:
 * tanpanya satu salah ketik memaksa orang kembali ke alat aslinya. Isinya
 * tetap lewat pembersih yang sama pada setiap blur, lalu dibersihkan sekali
 * lagi di `saveCourseDraft` -- jadi kotak ini tidak menambah satu pun jalan
 * masuk.
 */
export function InteractiveMaterialEditor({
  lessonId,
  value,
  onChange,
}: {
  lessonId: string
  value: string
  onChange: (html: string) => void
}) {
  const { t } = useI18n()
  const [pending, start] = useTransition()
  const [galat, setGalat] = useState("")
  const [hasil, setHasil] = useState<HasilBersih | null>(null)
  const [sumber, setSumber] = useState(value)
  const berkasRef = useRef<HTMLInputElement>(null)

  function bersihkan(mentah: string, sesudah?: () => void) {
    setGalat("")
    start(async () => {
      const r = await bersihkanMateriAction(mentah)
      if (!r.ok) {
        setGalat(r.error)
        return
      }
      setHasil(r.data)
      setSumber(r.data.html)
      onChange(r.data.html)
      sesudah?.()
    })
  }

  function pilihBerkas(file: File | undefined) {
    if (!file) return
    if (!/\.html?$/i.test(file.name)) {
      setGalat(t.editor.interactiveWrongType)
      return
    }
    if (file.size > BATAS_BERKAS) {
      setGalat(t.editor.interactiveTooBig)
      return
    }
    file.text().then((isi) => bersihkan(isi))
  }

  const adaIsi = value.trim().length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {/*
          Disembunyikan dari pohon aksesibilitas, bukan sekadar dari mata.
          `sr-only` menyisakannya sebagai kotak isian tanpa nama -- axe
          melaporkannya sebagai pelanggaran `label`, dan pengguna pembaca layar
          mendengar dua kontrol untuk satu pekerjaan. Tombol di bawahnya yang
          menjadi kontrolnya; input ini hanya alat yang dipanggil tombol itu.
          `tabIndex={-1}` wajib menyertai `aria-hidden`: elemen tersembunyi
          yang masih bisa difokus adalah pelanggaran tersendiri.
        */}
        <input
          ref={berkasRef}
          type="file"
          accept=".html,.htm,text/html"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            pilihBerkas(e.target.files?.[0])
            // Dikosongkan supaya mengunggah berkas dengan nama yang sama dua
            // kali tetap memicu change; tanpa ini unggahan kedua diam saja.
            e.target.value = ""
          }}
        />
        <Button
          type="button"
          variant={adaIsi ? "outline" : "default"}
          className={adaIsi ? undefined : "bg-brand-gradient text-white hover:brightness-105"}
          pending={pending}
          pendingLabel="Membersihkan…"
          onClick={() => berkasRef.current?.click()}
        >
          <Upload className="size-4" aria-hidden="true" />
          {adaIsi ? t.editor.interactiveReplace : t.editor.interactiveUpload}
        </Button>
        {adaIsi && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setHasil(null)
              setSumber("")
              setGalat("")
              onChange("")
            }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {t.editor.interactiveClear}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {t.editor.interactiveHint}{" "}
        {/*
          Tautan unduh, bukan nama berkas di repositori. Petunjuk ini dulu
          menyebut `docs/TEMPLATE-MATERI-INTERAKTIF.html` -- jalan yang tidak
          bisa dibuka siapa pun di tim penyusun materi.
        */}
        <a
          href="/admin/courses/panduan-interaktif"
          className="font-medium text-primary underline underline-offset-2"
        >
          {t.editor.interactiveGuide}
        </a>
      </p>
      <StatusMessage>{galat}</StatusMessage>

      {hasil && hasil.dibuang.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="mb-1.5 flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
            {t.editor.interactiveRemoved}
          </div>
          <ul className="list-disc space-y-0.5 pl-4">
            {hasil.dibuang.map((d) => (
              <li key={d}>
                <code>{d}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasil && hasil.peringatan.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
          <div className="mb-1.5 font-semibold text-foreground">{t.editor.interactiveNotes}</div>
          <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
            {hasil.peringatan.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`materi-sumber-${lessonId}`}>{t.editor.interactiveSource}</Label>
        <Textarea
          id={`materi-sumber-${lessonId}`}
          value={sumber}
          onChange={(e) => setSumber(e.target.value)}
          onBlur={() => {
            if (sumber !== value) bersihkan(sumber)
          }}
          className="min-h-[160px] font-mono text-xs"
          aria-describedby={`materi-sumber-help-${lessonId}`}
          spellCheck={false}
        />
        <p id={`materi-sumber-help-${lessonId}`} className="text-xs text-muted-foreground">
          {t.editor.interactiveSourceHint}
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="text-sm font-medium">{t.editor.interactivePreview}</div>
        {adaIsi ? (
          <div className="rounded-lg border border-border bg-card p-4">
            <InteractiveMaterial html={value} />
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            {t.editor.interactiveEmpty}
          </p>
        )}
      </div>
    </div>
  )
}
