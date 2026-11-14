"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Download, Plus, Sparkles, Trash2, Upload, UploadCloud } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StatusMessage } from "@/components/ui/status-message"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n/LocaleProvider"
import type { CourseDraft } from "@/lib/course-draft"
import type { ParseReport } from "@/lib/course-markdown"
import type { JenisPelajaran } from "@/lib/ai/sop"
import {
  ACCEPT_DOKUMEN_SOP,
  jenisDokumenDiterima,
  MAKS_BERKAS_SOP,
} from "@/lib/ai-usage"
import type { KerangkaKursus, ModulKerangka } from "@/lib/ai/sop"
import {
  ambilHasilPekerjaan,
  ambilPekerjaanTerakhir,
  buangPekerjaan,
  buatKerangkaDariSop,
  mintaRevisiKerangka,
  simpanKerangka,
  tulisModulBerikutnya,
  type Pekerjaan,
} from "@/app/admin/courses/sop-actions"

type Diimpor = Pick<
  CourseDraft,
  "title" | "description" | "requirementsText" | "audienceText" | "level" | "passingGrade" | "sections"
>

/**
 * Membuat kursus dari dokumen, dengan AI.
 *
 * Ditulis ulang 11 November 2026 setelah pemakaian pertama pemilik
 * (docs/BACKLOG.md bagian Z). Empat hal yang berubah, dan tiap satunya
 * menjawab satu keluhan:
 *
 *  1. **Memilih berkas tidak lagi menjalankan apa pun.** Dulu `onChange`
 *     langsung menembak server; berkas yang salah pilih baru ketahuan setelah
 *     AI dibayar. Sekarang berkasnya ditampilkan dulu -- nama, ukuran -- dan
 *     orangnya menekan "Baca dokumen".
 *  2. **Kemajuannya terlihat dan jujur.** Penulisan berjalan satu modul tiap
 *     panggilan, jadi 4 dari 6 modul adalah hitungan, bukan pengatur waktu
 *     yang mengarang persen. Tahap yang tidak terukur (membaca, membuat
 *     kerangka) ditandai centang, bukan dipaksa jadi angka.
 *  3. **Boleh ditinggal.** Keadaannya ada di basis data. Dialog ditutup,
 *     penulisan jalan terus karena komponennya tetap ter-mount; halaman
 *     ditinggalkan, pekerjaannya ditawarkan lagi saat kembali dan dilanjutkan
 *     dari modul terakhir, bukan diulang.
 *  4. **Kerangkanya bisa disentuh.** Disunting langsung, atau diubah lewat
 *     satu kalimat permintaan ke AI, dengan jalan kembali ke versi sebelumnya.
 *     Ini yang paling penting: "manusia memeriksa dulu" tidak berarti apa-apa
 *     kalau yang bisa dilakukan hanya menerima atau mengulang dari nol.
 *
 * Hasilnya tetap masuk ke DRAF di editor, tidak pernah langsung ke basis
 * data -- aturan yang sama dengan impor berkas `.md`.
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
  /** Diputuskan di server. Tanpa kunci AI tombolnya tidak dirender sama
   *  sekali -- standar v2 melarang kontrol yang pasti gagal. */
  aiAktif: boolean
  /** Dibuka sendiri saat editor dicapai lewat "Buat otomatis dengan AI" di
   *  daftar kursus. Pola yang sama dengan CourseMarkdownDialog. */
  openOnMount?: boolean
  onImported: (patch: Diimpor) => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(openOnMount)
  const [, startTransition] = useTransition()

  const [berkas, setBerkas] = useState<File | null>(null)
  const [pekerjaan, setPekerjaan] = useState<Pekerjaan | null>(null)
  const [kerangka, setKerangka] = useState<KerangkaKursus | null>(null)
  const [riwayat, setRiwayat] = useState<KerangkaKursus[]>([])
  const [kotor, setKotor] = useState(false)
  const [permintaan, setPermintaan] = useState("")
  const [report, setReport] = useState<ParseReport | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  const [diseret, setDiseret] = useState(false)

  /**
   * Satu pintu untuk berkas, dari pemilih maupun dari seret-lepas.
   *
   * Pemeriksaannya WAJIB ada di sini, bukan hanya pada atribut `accept`:
   * `accept` sama sekali tidak berlaku pada berkas yang dilepas, jadi tanpa
   * ini berkas apa pun bisa masuk lewat jalur seret dan baru ditolak jauh di
   * ujung, sesudah orang menunggu.
   */
  function terimaBerkas(file: File | undefined) {
    if (!file) return
    if (!jenisDokumenDiterima(file.name)) {
      setGalat(t.sop.dropWrongType)
      return
    }
    if (file.size > MAKS_BERKAS_SOP) {
      setGalat(t.sop.dropTooBig)
      return
    }
    setBerkas(file)
    setGalat(null)
  }
  const [sibuk, setSibuk] = useState<null | "membaca" | "menulis" | "revisi">(null)
  const [tawaran, setTawaran] = useState<Pekerjaan | null>(null)

  /*
   * Penghenti penulisan. Ref, bukan state: gelung penulisan membacanya di
   * antara dua panggilan server, dan state yang ditangkap closure akan selalu
   * bernilai seperti saat gelung dimulai.
   */
  const jeda = useRef(false)

  /*
   * Menanyakan pekerjaan yang tertinggal, sekali saat dialog pertama dibuka.
   *
   * Di dalam efek karena ini penyelarasan dengan keadaan di luar React
   * (baris di basis data), bukan turunan dari props -- pengecualian yang
   * sama dengan useDraftAutosave.
   */
  useEffect(() => {
    if (!open || !canImport || pekerjaan || tawaran) return
    let batal = false
    void (async () => {
      const hasil = await ambilPekerjaanTerakhir(courseId)
      // Bukan setState langsung di badan efek, melainkan di dalam callback
      // async setelah jaringan -- jadi aturan set-state-in-effect tidak
      // berlaku, dan tidak perlu dimatikan.
      if (batal || !hasil.ok || !hasil.data) return
      setTawaran(hasil.data)
    })()
    return () => {
      batal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canImport, courseId])

  if (!aiAktif) return null

  function pakaiKerangka(p: Pekerjaan) {
    setPekerjaan(p)
    setKerangka(p.kerangka)
    setRiwayat([])
    setKotor(false)
    setReport(null)
  }

  function bacaDokumen() {
    if (!berkas) return
    setGalat(null)
    setSibuk("membaca")
    const form = new FormData()
    form.set("berkas", berkas)

    startTransition(async () => {
      const hasil = await buatKerangkaDariSop(courseId, form)
      setSibuk(null)
      if (!hasil.ok) {
        setGalat(hasil.error)
        return
      }
      setTawaran(null)
      pakaiKerangka(hasil.data)
    })
  }

  /** Menyimpan suntingan tangan sebelum apa pun yang memakai kerangka. */
  async function simpanBilaKotor(): Promise<Pekerjaan | null> {
    if (!pekerjaan) return null
    if (!kotor || !kerangka) return pekerjaan
    const hasil = await simpanKerangka(courseId, pekerjaan.id, kerangka)
    if (!hasil.ok) {
      setGalat(hasil.error)
      return null
    }
    setPekerjaan(hasil.data)
    setKotor(false)
    return hasil.data
  }

  function mintaUbah() {
    if (!pekerjaan || !permintaan.trim()) return
    setGalat(null)
    setSibuk("revisi")
    startTransition(async () => {
      const dasar = await simpanBilaKotor()
      if (!dasar) {
        setSibuk(null)
        return
      }
      const hasil = await mintaRevisiKerangka(courseId, dasar.id, permintaan)
      setSibuk(null)
      if (!hasil.ok) {
        setGalat(hasil.error)
        return
      }
      if (!hasil.data.berubah) {
        // Bukan galat: permintaan menambah topik yang tidak ada di dokumen
        // memang ditolak. Yang tidak boleh adalah diam -- tanpa kalimat ini,
        // layar menampilkan "versi 2" dan tombol kembali padahal tidak ada
        // yang berubah, dan orang mengira fiturnya rusak.
        setGalat(t.sop.askNoChange)
        return
      }
      if (kerangka) setRiwayat((r) => [...r, kerangka])
      setPekerjaan(hasil.data.pekerjaan)
      setKerangka(hasil.data.pekerjaan.kerangka)
      setKotor(false)
      setPermintaan("")
    })
  }

  function kembaliVersi() {
    const sebelum = riwayat[riwayat.length - 1]
    if (!sebelum) return
    setRiwayat((r) => r.slice(0, -1))
    setKerangka(sebelum)
    setKotor(true)
  }

  /**
   * Gelung penulisan: satu modul tiap panggilan sampai habis.
   *
   * Dikendalikan klien, bukan satu permintaan panjang di server. Akibatnya
   * tiap panggilan pendek (tidak kena batas waktu fungsi), kemajuannya nyata,
   * dan berhenti di tengah hanya berarti ada modul yang belum ditulis --
   * bukan pekerjaan yang hilang.
   */
  function tulis() {
    if (!pekerjaan) return
    setGalat(null)
    jeda.current = false
    setSibuk("menulis")

    startTransition(async () => {
      const dasar = await simpanBilaKotor()
      if (!dasar) {
        setSibuk(null)
        return
      }

      for (;;) {
        if (jeda.current) break
        const hasil = await tulisModulBerikutnya(courseId, dasar.id)
        if (!hasil.ok) {
          setGalat(hasil.error)
          break
        }
        setPekerjaan(hasil.data.pekerjaan)
        if (hasil.data.selesai) {
          setReport(hasil.data.parsed.report)
          onImported(hasil.data.parsed.draft)
          toast.success(t.sop.done)
          break
        }
      }
      setSibuk(null)
    })
  }

  function lanjutkanTawaran(p: Pekerjaan) {
    setTawaran(null)
    pakaiKerangka(p)
    if (p.tahap === "selesai") {
      setSibuk("menulis")
      startTransition(async () => {
        const hasil = await ambilHasilPekerjaan(courseId, p.id)
        setSibuk(null)
        if (!hasil.ok) {
          setGalat(hasil.error)
          return
        }
        setReport(hasil.data.report)
        onImported(hasil.data.draft)
        toast.success(t.sop.done)
      })
    }
  }

  function buangTawaran(p: Pekerjaan) {
    setTawaran(null)
    startTransition(async () => {
      await buangPekerjaan(courseId, p.id)
    })
  }

  // --- penyuntingan kerangka, seluruhnya di salinan lokal ---
  function ubahKerangka(f: (k: KerangkaKursus) => KerangkaKursus) {
    setKerangka((k) => (k ? f(k) : k))
    setKotor(true)
  }
  const gantiModul = (i: number, ubah: Partial<ModulKerangka>) =>
    ubahKerangka((k) => ({ ...k, modul: k.modul.map((m, j) => (i === j ? { ...m, ...ubah } : m)) }))
  const hapusModul = (i: number) =>
    ubahKerangka((k) => ({ ...k, modul: k.modul.filter((_, j) => j !== i) }))
  const tambahModul = () =>
    ubahKerangka((k) => ({
      ...k,
      modul: [...k.modul, { judul: "", tujuan: "", pelajaran: [{ judul: "", inti: "", jenis: "teks" }] }],
    }))
  const gantiPelajaran = (i: number, j: number, judul: string) =>
    gantiModul(i, {
      pelajaran: (kerangka?.modul[i].pelajaran ?? []).map((p, x) => (x === j ? { ...p, judul } : p)),
    })
  const gantiJenis = (i: number, j: number, jenis: JenisPelajaran) =>
    gantiModul(i, {
      pelajaran: (kerangka?.modul[i].pelajaran ?? []).map((p, x) => (x === j ? { ...p, jenis } : p)),
    })
  const hapusPelajaran = (i: number, j: number) =>
    gantiModul(i, { pelajaran: (kerangka?.modul[i].pelajaran ?? []).filter((_, x) => x !== j) })
  const tambahPelajaran = (i: number) =>
    gantiModul(i, { pelajaran: [...(kerangka?.modul[i].pelajaran ?? []), { judul: "", inti: "", jenis: "teks" }] })

  const totalPelajaran = kerangka?.modul.reduce((n, m) => n + m.pelajaran.length, 0) ?? 0
  /*
   * Hanya gelung di KLIEN yang menentukan "sedang menulis".
   *
   * Versi pertama ikut membaca `pekerjaan.tahap === "menulis"` dari server,
   * dan itu salah: menekan Jeda menghentikan gelungnya, tetapi baris di
   * basis data tetap bertahap "menulis" sampai modul berikutnya selesai --
   * sehingga layar terus mengaku sedang menulis pada pekerjaan yang sudah
   * berhenti, lengkap dengan tombol Jeda yang tidak lagi ada gunanya.
   */
  const sedangMenulis = sibuk === "menulis"
  const terjeda = !sedangMenulis && !report && (pekerjaan?.modulSelesai ?? 0) > 0
  const persen =
    pekerjaan && pekerjaan.modulTotal > 0
      ? Math.round((pekerjaan.modulSelesai / pekerjaan.modulTotal) * 100)
      : 0

  function ukuran(b: number): string {
    return b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            {/* Kilau ✨ milik jalur yang BENAR-BENAR memanggil AI. Impor .md
                memakai ikon unggah, karena yang dilakukannya memindahkan
                berkas, bukan memanggil model. */}
            <Sparkles className="size-4" aria-hidden />
            {t.editor.createWithAi}
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
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
            {/* --- pekerjaan tertinggal --- */}
            {tawaran && !pekerjaan && (
              <section className="rounded-lg border border-ring/40 bg-secondary/40 p-3.5">
                <p className="text-sm font-semibold">{t.sop.resumeTitle}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t.sop.resumeDesc
                    .replace("{berkas}", tawaran.namaBerkas)
                    .replace("{n}", String(tawaran.modulSelesai))
                    .replace("{total}", String(tawaran.modulTotal))}
                </p>
                <div className="mt-2.5 flex gap-2">
                  <Button size="sm" onClick={() => lanjutkanTawaran(tawaran)}>
                    {t.sop.resumeWork}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => buangTawaran(tawaran)}>
                    {t.sop.discardWork}
                  </Button>
                </div>
              </section>
            )}

            {/* --- 1. pilih berkas, lalu tegaskan --- */}
            {!pekerjaan && (
              <div>
                <h3 className="text-sm font-semibold">{t.sop.step1}</h3>
                <p className="mt-1 mb-2.5 text-sm text-muted-foreground">{t.sop.step1Desc}</p>

                {/*
                  Zona seret TIDAK diberi onClick, role, atau tabIndex.
                  Jalan papan ketiknya tetap <label> berisi input di dalamnya:
                  satu kontrol, punya nama, satu perhentian tab. Menjadikan
                  wadah ini sendiri sebuah tombol akan membuat tombol di
                  dalamnya bersarang di dalam tombol -- pelanggaran
                  nested-interactive, dan pola itulah yang dulu ditemukan pada
                  ImageDropzone.
                */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (sibuk === null) setDiseret(true)
                  }}
                  onDragLeave={() => setDiseret(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDiseret(false)
                    if (sibuk === null) terimaBerkas(e.dataTransfer.files?.[0])
                  }}
                  className={cn(
                    "rounded-xl border-2 border-dashed px-4 py-5 transition-colors",
                    diseret ? "border-ring bg-muted/50" : "border-border",
                    sibuk !== null && "opacity-60"
                  )}
                >
                  {berkas ? (
                    <div className="flex items-center gap-3 rounded-lg border border-input p-2.5">
                      <Upload className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{berkas.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.sop.fileMeta
                            .replace("{ukuran}", ukuran(berkas.size))
                            .replace("{jenis}", berkas.type || "teks")}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={sibuk !== null}
                        onClick={() => setBerkas(null)}
                      >
                        {t.sop.changeFile}
                      </Button>
                    </div>
                  ) : (
                    /* Label yang membungkus input berkas, bukan tombol yang
                       mengklik input tersembunyi: pola itu meninggalkan input
                       tanpa nama terbaca dan satu perhentian tab tak terlihat. */
                    <label
                      className={cn(
                        "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm font-medium",
                        "hover:bg-muted focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                      )}
                    >
                      <Upload className="size-4" aria-hidden />
                      {t.sop.pickFile}
                      <input
                        type="file"
                        accept={ACCEPT_DOKUMEN_SOP}
                        className="sr-only"
                        onChange={(event) => {
                          terimaBerkas(event.target.files?.[0])
                          event.target.value = ""
                        }}
                      />
                    </label>
                  )}

                  {!berkas && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UploadCloud className="size-3.5 shrink-0" aria-hidden />
                      {t.sop.dropDoc}
                    </p>
                  )}
                </div>

                {berkas && (
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    <Button
                      className="bg-brand-gradient text-white hover:brightness-105"
                      pending={sibuk === "membaca"}
                      pendingLabel={t.sop.reading}
                      onClick={bacaDokumen}
                    >
                      {t.sop.confirmRead}
                    </Button>
                    <span className="text-xs text-muted-foreground">{t.sop.estimateRead}</span>
                  </div>
                )}

                {!berkas && (
                  <>
                    <p className="mt-2.5 text-xs text-muted-foreground">{t.sop.sampleHint}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 px-0"
                      render={<a href="/contoh/contoh-sop-penerimaan-barang.txt" download />}
                      nativeButton={false}
                    >
                      <Download className="size-4" aria-hidden />
                      {t.sop.sampleFile}
                    </Button>
                  </>
                )}
                <p className="mt-2 text-xs text-muted-foreground">{t.sop.privacy}</p>
              </div>
            )}

            <StatusMessage>{galat}</StatusMessage>

            {/* --- 2. kemajuan penulisan --- */}
            {pekerjaan && (sedangMenulis || terjeda) && (
              <section className="rounded-lg border border-border p-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold">{t.sop.progressTitle}</span>
                  <span className="text-sm font-semibold tabular-nums">{persen}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={t.sop.progressTitle}
                  aria-valuemin={0}
                  aria-valuemax={pekerjaan.modulTotal}
                  aria-valuenow={pekerjaan.modulSelesai}
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"
                >
                  <div className="h-full bg-brand-gradient" style={{ width: `${persen}%` }} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {sedangMenulis
                    ? t.sop.progressModule
                        .replace("{n}", String(Math.min(pekerjaan.modulSelesai + 1, pekerjaan.modulTotal)))
                        .replace("{total}", String(pekerjaan.modulTotal))
                        .replace("{judul}", kerangka?.modul[pekerjaan.modulSelesai]?.judul ?? "")
                    : t.sop.paused
                        .replace("{n}", String(pekerjaan.modulSelesai))
                        .replace("{total}", String(pekerjaan.modulTotal))}
                </p>
                <ul className="mt-2.5 space-y-1 text-sm">
                  <li className="text-muted-foreground">✓ {t.sop.stageDoc}</li>
                  <li className="text-muted-foreground">
                    ✓ {t.sop.stageOutline.replace("{n}", String(pekerjaan.modulTotal))}
                  </li>
                  <li className="text-muted-foreground">· {t.sop.stageWriting}</li>
                </ul>
                {sedangMenulis ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    <Button size="sm" variant="outline" onClick={() => (jeda.current = true)}>
                      {t.sop.pause}
                    </Button>
                    <span className="text-xs text-muted-foreground">{t.sop.canLeave}</span>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    <Button size="sm" onClick={tulis}>
                      {t.sop.resumeWork}
                    </Button>
                    {/* Menyunting kerangka membuat bagian yang sudah ditulis
                        tidak lagi cocok dengan urutannya, jadi ia dibuang
                        (lihat simpanKerangka). Dikatakan di sini supaya
                        tidak menjadi kejutan. */}
                    <span className="text-xs text-muted-foreground">{t.sop.editRestarts}</span>
                  </div>
                )}
              </section>
            )}

            {/* --- 3. kerangka yang bisa disentuh --- */}
            {kerangka && !report && !sedangMenulis && (
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold">{t.sop.step2}</h3>
                  <span className="text-xs text-muted-foreground">
                    {t.sop.outlineCount
                      .replace("{modul}", String(kerangka.modul.length))
                      .replace("{pelajaran}", String(totalPelajaran))}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.sop.editHint}</p>

                {/*
                  Keterangan kursus -- judul, deskripsi, tingkat, persyaratan,
                  untuk siapa -- SELALU dibuat AI dan selalu ikut masuk ke
                  editor. Sampai 11 November 2026 layar ini tidak
                  menampilkannya sama sekali, jadi penyusun baru melihatnya
                  setelah seluruh kursus ditulis, di tab lain, tanpa pernah
                  diberi kesempatan memperbaikinya lebih dulu. Dibuat kecil
                  dan di atas: ia keterangan, bukan isi.
                */}
                <section className="mt-3 space-y-2.5 rounded-lg border border-border p-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                    {t.sop.courseFields}
                  </h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="sop-judul">{t.sop.courseTitleLabel}</Label>
                    <Input
                      id="sop-judul"
                      className="h-8"
                      value={kerangka.judul}
                      onChange={(e) => ubahKerangka((k) => ({ ...k, judul: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sop-deskripsi">{t.sop.courseDescLabel}</Label>
                    <Textarea
                      id="sop-deskripsi"
                      rows={3}
                      value={kerangka.deskripsi}
                      onChange={(e) => ubahKerangka((k) => ({ ...k, deskripsi: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sop-tingkat">{t.sop.courseLevelLabel}</Label>
                    <Select
                      value={kerangka.tingkat}
                      onValueChange={(v) =>
                        ubahKerangka((k) => ({ ...k, tingkat: v as KerangkaKursus["tingkat"] }))
                      }
                    >
                      <SelectTrigger id="sop-tingkat" className="h-8 w-44">
                        {/* Label ditulis sendiri: <SelectValue/> kosong
                            menampilkan nilai mentah sampai daftarnya pernah
                            dibuka sekali. Sama dengan QuizEditor. */}
                        <SelectValue>{kerangka.tingkat}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pemula">{t.editor.levelBeginner}</SelectItem>
                        <SelectItem value="Menengah">{t.editor.levelIntermediate}</SelectItem>
                        <SelectItem value="Lanjutan">{t.editor.levelAdvanced}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sop-syarat">{t.sop.courseReqLabel}</Label>
                    <Textarea
                      id="sop-syarat"
                      rows={2}
                      placeholder={t.sop.perLineHint}
                      value={kerangka.persyaratan.join("\n")}
                      onChange={(e) =>
                        ubahKerangka((k) => ({
                          ...k,
                          persyaratan: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sop-untuk">{t.sop.courseAudienceLabel}</Label>
                    <Textarea
                      id="sop-untuk"
                      rows={2}
                      placeholder={t.sop.perLineHint}
                      value={kerangka.untukSiapa.join("\n")}
                      onChange={(e) =>
                        ubahKerangka((k) => ({
                          ...k,
                          untukSiapa: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
                        }))
                      }
                    />
                  </div>
                </section>

                <div className="mt-2.5 space-y-2.5">
                  {kerangka.modul.map((m, i) => (
                    <div key={i} className="rounded-lg border border-border p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">{i + 1}.</span>
                        <Input
                          aria-label={t.sop.moduleTitle.replace("{n}", String(i + 1))}
                          value={m.judul}
                          onChange={(e) => gantiModul(i, { judul: e.target.value })}
                          className="h-8 flex-1"
                        />
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={t.sop.deleteModule.replace("{n}", String(i + 1))}
                          onClick={() => hapusModul(i)}
                        >
                          <Trash2 className="size-3.5 text-destructive" aria-hidden />
                        </Button>
                      </div>
                      <div className="mt-1.5 ml-6 space-y-1.5">
                        {m.pelajaran.map((p, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <Input
                              aria-label={t.sop.lessonTitle.replace("{n}", String(j + 1))}
                              value={p.judul}
                              onChange={(e) => gantiPelajaran(i, j, e.target.value)}
                              className="h-8 flex-1 text-sm"
                            />
                            {/*
                              Jenis ditampilkan di sini supaya penyusun melihat
                              -- dan bisa mengubah -- pelajaran mana yang akan
                              jadi simulasi, SEBELUM biaya penulisannya keluar.
                              Itu seluruh gunanya tahap kerangka.
                            */}
                            <select
                              aria-label={t.sop.lessonKind.replace("{n}", String(j + 1))}
                              value={p.jenis}
                              onChange={(e) => gantiJenis(i, j, e.target.value as JenisPelajaran)}
                              className="h-8 rounded-md border border-input bg-card px-2 text-xs"
                            >
                              <option value="teks">{t.sop.kindText}</option>
                              <option value="cerita">{t.sop.kindStory}</option>
                              <option value="simulasi">{t.sop.kindSim}</option>
                            </select>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={t.sop.deleteLesson.replace("{n}", String(j + 1))}
                              onClick={() => hapusPelajaran(i, j)}
                            >
                              <Trash2 className="size-3.5 text-destructive" aria-hidden />
                            </Button>
                          </div>
                        ))}
                        <Button size="sm" variant="ghost" className="px-0" onClick={() => tambahPelajaran(i)}>
                          <Plus className="size-3.5" aria-hidden />
                          {t.sop.addLesson}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={tambahModul}>
                    <Plus className="size-3.5" aria-hidden />
                    {t.sop.addModule}
                  </Button>
                </div>

                {/* --- minta AI mengubah --- */}
                <div className="mt-4 rounded-lg border border-ring/40 bg-secondary/40 p-3">
                  <Label htmlFor="minta-ubah" className="text-sm font-semibold">
                    <Sparkles className="size-3.5" aria-hidden />
                    {t.sop.askAi}
                  </Label>
                  <Input
                    id="minta-ubah"
                    className="mt-1.5 bg-card"
                    placeholder={t.sop.askPlaceholder}
                    value={permintaan}
                    onChange={(e) => setPermintaan(e.target.value)}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      pending={sibuk === "revisi"}
                      pendingLabel={t.sop.askSending}
                      disabled={!permintaan.trim()}
                      onClick={mintaUbah}
                    >
                      {t.sop.askSend}
                    </Button>
                    {riwayat.length > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground">
                          {t.sop.versionLabel.replace("{n}", String(riwayat.length + 1))}
                        </span>
                        <Button size="sm" variant="ghost" onClick={kembaliVersi}>
                          {t.sop.undoVersion}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {/* Tanpa `pending`: menekannya membuat panel kemajuan
                      muncul seketika di tempat bagian ini, dan panel itulah
                      umpan baliknya. Label berputar di tombol yang sudah
                      hilang tidak memberi tahu siapa pun apa-apa. */}
                  <Button
                    className="bg-brand-gradient text-white hover:brightness-105"
                    disabled={sibuk !== null}
                    onClick={tulis}
                  >
                    {t.sop.writeButton}
                  </Button>
                  <span className="text-xs text-muted-foreground">{t.sop.estimateWrite}</span>
                  {kotor && <span className="text-xs text-muted-foreground">{t.sop.unsaved}</span>}
                </div>
              </div>
            )}

            {/* --- 4. selesai --- */}
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
                {/* Peringatan yang sama dibawa setiap keluaran AI di aplikasi
                    ini (lihat discussAiNote dan assistantAiNote). */}
                <p className="mt-1 text-xs text-muted-foreground">{t.sop.aiNote}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
