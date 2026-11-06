"use client"

import { Monitor, Pencil, Smartphone, Tablet } from "lucide-react"
import { useState } from "react"

import { LandingBlockView } from "@/components/landing/LandingBlocks"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { themeStyle, type LandingTheme } from "@/lib/landing-theme"
import { cn } from "@/lib/utils"
import type { LandingBlock } from "@/lib/landing-blocks"
import type { Category, CourseCardData, Instructor } from "@/lib/courses"
import type { LandingTestimonial, PlatformTotals } from "@/lib/landing"
import type { Locale } from "@/lib/i18n/config"

/** Semua data hidup yang dibutuhkan blok-blok halaman depan. */
export type PreviewData = {
  courses: CourseCardData[]
  testimonials: LandingTestimonial[]
  totals: PlatformTotals
  categories: { category: Category; count: number }[]
  instructors: Instructor[]
  theme: LandingTheme
}

const LEBAR = {
  desktop: null,
  tablet: 768,
  mobile: 390,
} as const

type Perangkat = keyof typeof LEBAR

/**
 * Kanvas pratinjau yang hidup mengikuti suntingan, bukan versi tersimpan.
 *
 * Dua hal yang membuatnya bukan sekadar hiasan:
 *
 * 1. **Komponennya sama persis** dengan yang dipakai halaman publik
 *    (`LandingBlockView`). Pratinjau yang digambar ulang sendiri akan
 *    berbeda dari halaman aslinya begitu salah satunya diubah.
 * 2. **Isinya keadaan draf**, jadi mengetik satu kata langsung terlihat.
 *    Pratinjau iframe sebelumnya hanya menampilkan versi tersimpan, sehingga
 *    penyusun harus menyimpan dulu untuk tahu hasilnya -- dan menyimpan
 *    berarti pengunjung ikut melihat percobaannya.
 *
 * Blok yang disembunyikan tetap digambar di sini, diberi tanda, supaya
 * penyusun bisa melihat apa yang sedang ia sembunyikan. Di halaman publik
 * blok itu tidak dirender sama sekali.
 */
export function LivePreview({
  blocks,
  data,
  locale,
  selectedId,
  onSelect,
}: {
  blocks: LandingBlock[]
  data: PreviewData
  locale: Locale
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const { t } = useI18n()
  const [perangkat, setPerangkat] = useState<Perangkat>("desktop")
  const lebar = LEBAR[perangkat]

  const tombol: { key: Perangkat; label: string; icon: typeof Monitor }[] = [
    { key: "desktop", label: t.superadmin.deviceDesktop, icon: Monitor },
    { key: "tablet", label: t.superadmin.deviceTablet, icon: Tablet },
    { key: "mobile", label: t.superadmin.devicePhone, icon: Smartphone },
  ]

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">{t.superadmin.previewHead}</span>
        <div role="group" aria-label={t.superadmin.deviceWidth} className="flex gap-1">
          {tombol.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={perangkat === key}
              onClick={() => setPerangkat(key)}
              className={cn(
                "flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
                perangkat === key
                  ? "border-ring bg-secondary text-primary"
                  : "border-input text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">{t.superadmin.livePreviewNote}</span>
      </div>

      {/*
        Kanvasnya bergulir sendiri di layar lebar, bukan ikut jendela.
        Pasangannya ada di BlockEditor: panel ruas juga punya guliran sendiri.
        Dua panel yang saling bebas adalah inti pembangun halaman -- menggulir
        salah satunya tidak boleh menggeser yang lain, dan menekan "Sunting
        bagian ini" tidak boleh memindahkan pandangan dari bagian yang sedang
        dilihat. Baris pemilih perangkat di atas sengaja berada DI LUAR wadah
        guliran ini supaya ia tidak ikut menghilang saat kanvas digulir.

        `items-start` WAJIB di sini. Tanpa itu anak flex ini diregangkan ke
        tinggi wadahnya (`align-items: stretch` bawaan), lalu `overflow-hidden`
        miliknya memotong isi halaman depan di 740px -- kanvasnya tidak
        bergulir, ia kehilangan sepuluh bagian terakhirnya tanpa suara.
      */}
      <div className="flex items-start justify-center overflow-x-auto xl:max-h-[calc(100dvh-10rem)] xl:overflow-y-auto">
        <div
          /*
            Penanda untuk scripts/i18n-check.mjs. Isi di dalam kanvas ini
            sengaja berbahasa lain dari antarmukanya: superadmin yang menyunting
            versi Indonesia melihat pratinjau Indonesia walau layarnya sendiri
            berbahasa Inggris. Tanpa penanda ini, gerbang dwibahasa membaca
            pratinjau itu sebagai "kalimat yang lupa diterjemahkan".
          */
          data-pratinjau-bahasa-lain
          style={{ ...themeStyle(data.theme), width: lebar ? `${lebar}px` : "100%" }}
          className="max-w-full shrink-0 overflow-hidden rounded-xl border border-border bg-card"
        >
          {blocks.map((block) => (
            <div key={block.id} className="group/blok relative">
              {/*
                Tombol pilih, bukan seluruh bagian yang bisa diklik: sebuah
                <section> berisi tautan dan tombol sendiri, dan membungkusnya
                jadi satu tombol akan menyarangkan kontrol di dalam kontrol.
              */}
              <button
                type="button"
                onClick={() => onSelect(block.id)}
                className={cn(
                  "absolute top-2 right-2 z-10 flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold shadow-sm",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
                  selectedId === block.id
                    ? "border-ring bg-secondary text-primary"
                    : "border-border bg-card text-foreground"
                )}
              >
                <Pencil className="size-3.5" aria-hidden />
                {t.superadmin.editThisSection}
              </button>

              {block.hidden && (
                <span className="absolute top-2 left-2 z-10 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium">
                  {t.superadmin.hiddenBadge}
                </span>
              )}

              <div
                className={cn(
                  "pointer-events-none",
                  /*
                   * Garis putus-putus, bukan `opacity-60 grayscale`.
                   *
                   * Meredupkan blok ikut meredupkan seluruh teksnya: judul
                   * bagian "Dipercaya oleh" dan kawan-kawannya langsung jatuh
                   * di bawah 4,5:1 (axe: color-contrast, 22 elemen). Keadaan
                   * "tersembunyi" sudah terbaca dari lencana di pojok; tanda
                   * kedua ini tidak boleh dibayar dengan keterbacaan.
                   */
                  block.hidden && "outline-2 outline-dashed outline-muted-foreground/50 -outline-offset-4",
                  selectedId === block.id && "ring-2 ring-ring ring-inset"
                )}
              >
                <LandingBlockView
                  block={block}
                  courses={data.courses}
                  testimonials={data.testimonials}
                  totals={data.totals}
                  categories={data.categories}
                  instructors={data.instructors}
                  locale={locale}
                />
              </div>
            </div>
          ))}

          {blocks.length === 0 && (
            <p className="p-12 text-center text-sm text-muted-foreground">{t.superadmin.noBlocks}</p>
          )}
        </div>
      </div>
    </div>
  )
}
