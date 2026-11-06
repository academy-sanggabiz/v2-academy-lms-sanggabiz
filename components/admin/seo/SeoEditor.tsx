"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  discardSeoDraftAction,
  publishSeoAction,
  saveSeoDraftAction,
} from "@/app/admin/seo/actions"
import { BuilderShell } from "@/components/admin/builder/BuilderShell"
import { ImageDropzone } from "@/components/admin/courses/ImageDropzone"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { useRiwayat } from "@/hooks/use-riwayat"
import { uploadLandingImage } from "@/lib/storage"
import { DEFAULT_SEO, SEO_BATAS, seoTerpakai, type SiteSeo } from "@/lib/seo"
import { cn } from "@/lib/utils"

/**
 * Penyunting SEO situs.
 *
 * Memakai kulit yang sama dengan penyusun halaman depan -- bilah lengket,
 * urung/ulang, draf terpisah dari terbitan -- karena keduanya pekerjaan yang
 * sama bentuknya: mengubah wajah publik, mencoba-coba, lalu memutuskan kapan
 * orang boleh melihatnya. Dua layar yang bekerja sama tetapi berperilaku
 * berbeda memaksa penyusun mengingat dua aturan.
 *
 * Pratinjaunya tiruan hasil pencarian, bukan daftar kolom isian. Yang ingin
 * diketahui penyusun bukan "apa isi medan description", melainkan "bagaimana
 * tampaknya di Google" -- dan pemotongan judul yang terlalu panjang baru
 * terlihat kalau digambar.
 */
export function SeoEditor({
  initialSeo,
  adaDrafTersimpan,
  situs,
}: {
  initialSeo: SiteSeo
  adaDrafTersimpan: boolean
  /** Alamat yang ditampilkan di baris hijau pratinjau. */
  situs: string
}) {
  const { t } = useI18n()
  const riwayat = useRiwayat<SiteSeo>(initialSeo)
  const seo = riwayat.nilai
  const [adaDraf, setAdaDraf] = useState(adaDrafTersimpan)
  const [tab, setTab] = useState("id")
  const [pending, startTransition] = useTransition()

  const bahasaPratinjau = tab === "en" ? "en" : "id"
  const terpakai = seoTerpakai(seo, bahasaPratinjau)

  function ubahTeks(bahasa: "id" | "en", medan: "title" | "description", nilai: string) {
    riwayat.set(
      (s) => ({ ...s, [bahasa]: { ...s[bahasa], [medan]: nilai } }),
      `${bahasa}.${medan}`
    )
  }

  function simpanDraf() {
    startTransition(async () => {
      const hasil = await saveSeoDraftAction(seo)
      if (!hasil.ok) return void toast.error(hasil.error)
      setAdaDraf(true)
      toast.success(t.superadmin.seoSaved)
    })
  }

  function terbitkan() {
    startTransition(async () => {
      const hasil = await publishSeoAction(seo)
      if (!hasil.ok) return void toast.error(hasil.error)
      setAdaDraf(false)
      toast.success(t.superadmin.seoPublished)
    })
  }

  function buangPerubahan() {
    if (!window.confirm(t.superadmin.confirmDiscard)) return
    startTransition(async () => {
      const hasil = await discardSeoDraftAction()
      if (!hasil.ok) return void toast.error(hasil.error)
      setAdaDraf(false)
      toast.success(t.superadmin.draftDiscarded)
      window.location.reload()
    })
  }

  function kembalikanBawaan() {
    if (!window.confirm(t.superadmin.confirmRestore)) return
    riwayat.set(DEFAULT_SEO)
    toast.success(t.superadmin.defaultsRestored)
  }

  function ruasBahasa(bahasa: "id" | "en") {
    const nilai = seo[bahasa]
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <MedanPanjang
          id={`seo-title-${bahasa}`}
          label={t.superadmin.seoPageTitle}
          value={nilai.title}
          max={SEO_BATAS.title}
          bawaan={DEFAULT_SEO[bahasa].title}
          disabled={pending}
          onChange={(v) => ubahTeks(bahasa, "title", v)}
        />
        <MedanPanjang
          id={`seo-desc-${bahasa}`}
          label={t.superadmin.seoPageDescription}
          value={nilai.description}
          max={SEO_BATAS.description}
          bawaan={DEFAULT_SEO[bahasa].description}
          disabled={pending}
          onChange={(v) => ubahTeks(bahasa, "description", v)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t.superadmin.seoTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.superadmin.seoSubtitle}</p>
      </div>

      <BuilderShell
        status={adaDraf ? "draf" : "terbit"}
        draftNote={adaDraf ? t.superadmin.draftNote : undefined}
        previewHref="/"
        pending={pending}
        bisaUrung={riwayat.bisaUrung}
        bisaUlang={riwayat.bisaUlang}
        onUrung={riwayat.urung}
        onUlang={riwayat.ulang}
        onBuangPerubahan={buangPerubahan}
        onKembalikanBawaan={kembalikanBawaan}
        onSimpanDraf={simpanDraf}
        onTerbitkan={terbitkan}
        tabAktif={tab}
        onTabChange={setTab}
        preview={
          <div className="rounded-2xl border border-border bg-muted/30 p-5">
            <div className="mb-3 text-sm font-bold">{t.superadmin.seoPreviewHead}</div>
            {/*
              Tiruan satu hasil pencarian. Lebarnya dibatasi 600px karena di
              situlah Google memotong, dan `line-clamp` meniru pemotongan itu:
              peringatan jumlah aksara memberi tahu BAHWA teksnya terlalu
              panjang, gambar ini memberi tahu BAGIAN MANA yang hilang.
            */}
            <div className="max-w-[600px] rounded-xl bg-card p-4">
              <div className="truncate text-xs text-muted-foreground">{situs}</div>
              <div className="mt-1 line-clamp-1 text-lg text-[#1a0dab] group-hover:underline dark:text-[#8ab4f8]">
                {terpakai.title}
              </div>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {terpakai.description}
              </p>
            </div>
          </div>
        }
        tabs={[
          { id: "id", label: "Bahasa Indonesia", content: ruasBahasa("id") },
          { id: "en", label: "English", content: ruasBahasa("en") },
          {
            id: "gambar",
            label: t.superadmin.seoOgImage,
            content: (
              <div className="rounded-2xl border border-border bg-card p-5">
                <ImageDropzone
                  label={t.superadmin.seoOgImage}
                  hint={t.superadmin.seoOgHint}
                  value={seo.ogImageUrl}
                  uploadFn={uploadLandingImage}
                  onChange={(ogImageUrl) => riwayat.set((s) => ({ ...s, ogImageUrl }))}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

/**
 * Satu medan teks dengan penghitung aksara.
 *
 * Penghitungnya memperingatkan, tidak menolak. Google memotong berdasarkan
 * lebar piksel, bukan jumlah huruf, jadi angka 60 dan 160 adalah ancar-ancar
 * -- menolak simpan karena melewatinya berarti mengarang aturan yang Google
 * sendiri tidak punya.
 */
function MedanPanjang({
  id,
  label,
  value,
  max,
  bawaan,
  disabled,
  onChange,
}: {
  id: string
  label: string
  value: string
  max: number
  bawaan: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  const { t } = useI18n()
  const panjang = value.trim().length
  const kepanjangan = panjang > max

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className={cn("text-xs", kepanjangan ? "text-destructive" : "text-muted-foreground")}>
        {panjang === 0
          ? t.superadmin.seoEmptyFallback.replace("{teks}", bawaan)
          : t.superadmin.seoTooLong
              .replace("{n}", String(panjang))
              .replace("{max}", String(max))}
      </p>
    </div>
  )
}
