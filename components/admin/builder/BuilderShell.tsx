"use client"

import { ExternalLink, Redo2, RotateCcw, Send, Trash2, Undo2 } from "lucide-react"
import { useId, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { cn } from "@/lib/utils"

export type BuilderTab = {
  id: string
  label: string
  content: ReactNode
}

/**
 * Kulit bersama untuk layar menyusun: halaman depan, warna, dan SEO.
 *
 * Bentuknya satu kolom -- bilah lengket di atas, pratinjau, lalu panel
 * bertab -- bukan dua kolom berdampingan. Keduanya bisa dipakai, tetapi satu
 * kolom menang pada satu hal yang menentukan di sini: pratinjaunya selebar
 * layar, jadi yang dilihat penyusun benar-benar sebesar yang dilihat
 * pengunjung. Panel ruas di samping mengecilkan pratinjau justru pada layar
 * tempat orang bekerja.
 *
 * **Bilahnya lengket** karena "Terbitkan" harus selalu terjangkau. Penyusun
 * yang sedang menyunting bagian kesepuluh tidak boleh menggulir balik ke atas
 * hanya untuk menyimpan -- dan tombol simpan yang jauh adalah tombol simpan
 * yang lupa ditekan.
 *
 * **Simpan dipisah dari Terbitkan.** Dulu menekan Simpan langsung mengubah
 * apa yang dilihat pengunjung, jadi setiap percobaan tayang seketika. Dua
 * tombol memisahkan "saya belum selesai" dari "silakan dilihat orang".
 */
export function BuilderShell({
  status,
  draftNote,
  preview,
  tabs,
  previewHref,
  pending,
  bisaUrung,
  bisaUlang,
  onUrung,
  onUlang,
  onBuangPerubahan,
  onKembalikanBawaan,
  onSimpanDraf,
  onTerbitkan,
  kiri,
  tabAktif,
  onTabChange,
}: {
  status: "terbit" | "draf"
  /** Keterangan kecil di bawah bilah, mis. kapan draf terakhir disimpan. */
  draftNote?: string
  preview: ReactNode
  tabs: BuilderTab[]
  /** Alamat halaman sungguhan, dibuka di tab baru. */
  previewHref: string
  pending: boolean
  bisaUrung: boolean
  bisaUlang: boolean
  onUrung: () => void
  onUlang: () => void
  onBuangPerubahan: () => void
  onKembalikanBawaan: () => void
  onSimpanDraf: () => void
  onTerbitkan: () => void
  /** Kendali tambahan khas layar itu, mis. pemilih bahasa. */
  kiri?: ReactNode
  /** Tab yang terbuka. Dikendalikan dari luar supaya memilih satu bagian di
   *  pratinjau bisa sekaligus memindahkan panel ke "Pengaturan blok". */
  tabAktif?: string
  onTabChange?: (id: string) => void
}) {
  const { t } = useI18n()
  const [tabSendiri, setTabSendiri] = useState(tabs[0]?.id ?? "")
  const aktif = tabAktif ?? tabSendiri
  const setAktif = onTabChange ?? setTabSendiri
  const idTab = useId()

  const adaDraf = status === "draf"

  return (
    <div className="space-y-4">
      {/*
        Bilahnya menembus padding wadahnya supaya garis bawahnya memotong
        selebar layar. Angkanya HARUS sama persis dengan padding
        `<main>` di AdminShell (`p-4 sm:p-6 lg:p-8`): pada 320px, menembus
        -20px sementara wadahnya hanya berpadding 16px membuat halaman meluber
        4px dan gagal WCAG 1.4.10 -- cacat yang tidak terlihat sama sekali di
        layar lebar.
      */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {/*
          Lencana keadaan paling kiri, sebelum tombol apa pun: pertanyaan
          pertama penyusun saat membuka layar ini selalu "yang dilihat orang
          sekarang yang mana" -- dan jawabannya harus ada sebelum ia menekan
          sesuatu yang mengubahnya.
        */}
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            adaDraf
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-green-300 bg-green-50 text-green-900"
          )}
        >
          {adaDraf ? t.superadmin.statusDraft : t.superadmin.statusPublished}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={!bisaUrung || pending}
            onClick={onUrung}
            title={`${t.superadmin.undo} (Ctrl+Z)`}
            aria-label={t.superadmin.undo}
          >
            <Undo2 className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{t.superadmin.undo}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!bisaUlang || pending}
            onClick={onUlang}
            title={`${t.superadmin.redo} (Ctrl+Shift+Z)`}
            aria-label={t.superadmin.redo}
          >
            <Redo2 className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{t.superadmin.redo}</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={!adaDraf || pending}
            onClick={onBuangPerubahan}
          >
            <Trash2 className="size-3.5" aria-hidden />
            {t.superadmin.discardDraft}
          </Button>
          <Button variant="ghost" size="sm" disabled={pending} onClick={onKembalikanBawaan}>
            <RotateCcw className="size-3.5" aria-hidden />
            {t.superadmin.restoreDefaults}
          </Button>
          <Button variant="ghost" size="sm" render={<a href={previewHref} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
            <ExternalLink className="size-3.5" aria-hidden />
            {t.superadmin.openInNewTab}
          </Button>
        </div>

        {kiri}

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={pending} onClick={onSimpanDraf}>
            {t.superadmin.saveDraft}
          </Button>
          <Button
            size="sm"
            disabled={pending}
            onClick={onTerbitkan}
            className="bg-brand-gradient text-white hover:brightness-105"
          >
            <Send className="size-3.5" aria-hidden />
            {t.superadmin.publish}
          </Button>
        </div>
      </div>

      {draftNote && <p className="text-xs text-muted-foreground">{draftNote}</p>}

      {preview}

      <div>
        <div role="tablist" aria-label={t.superadmin.builderTabsAria} className="flex gap-1 rounded-xl bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${idTab}-${tab.id}`}
              aria-selected={aktif === tab.id}
              aria-controls={`${idTab}-panel-${tab.id}`}
              onClick={() => setAktif(tab.id)}
              className={cn(
                "flex min-h-9 flex-1 items-center justify-center rounded-lg px-3 text-sm font-semibold",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
                aktif === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${idTab}-panel-${tab.id}`}
            aria-labelledby={`${idTab}-${tab.id}`}
            /*
              `hidden`, bukan tidak dirender. Panel yang dilepas kehilangan
              keadaannya -- gulirannya, bagian yang sedang terbuka, kolom yang
              sedang diketik -- dan berpindah tab lalu kembali tidak boleh
              terasa seperti memulai dari nol.
            */
            hidden={aktif !== tab.id}
            className="mt-4"
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}
