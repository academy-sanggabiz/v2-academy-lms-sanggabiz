import Link from "next/link"

import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { DisplaySettings } from "@/components/preferences/DisplaySettings"
import { getDictionary } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

/**
 * Kepala halaman untuk seluruh halaman publik (halaman depan dan katalog
 * kelas), supaya pengunjung yang berpindah di antara keduanya tidak merasa
 * berpindah situs.
 *
 * `locale` dioper, tidak dibaca dari cookie di sini: pratinjau halaman depan
 * di /admin/landing menimpa bahasa lewat ?bahasa=, dan kepala halaman harus
 * ikut timpaan itu.
 *
 * Padding dan kata "sanggabiz" menyusut di layar sempit. Pada 320px -- lebar
 * yang disyaratkan WCAG 1.4.10 Reflow -- baris ini memuat logo, kata merek,
 * tautan katalog, dua pemilih, dan dua tombol; bersama-sama mereka melebar
 * jauh melewati layar kalau tidak ada yang disembunyikan.
 */
export function PublicHeader({ locale, active }: { locale: Locale; active?: "kelas" }) {
  const t = getDictionary(locale)

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-2 border-b border-border bg-card/90 px-4 backdrop-blur-sm sm:px-10">
      <div className="flex min-w-0 items-center gap-2 sm:gap-5">
        <Link href="/" className="flex min-w-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Sanggabiz" className="size-8 shrink-0 object-contain" />
          <span className="hidden text-xl font-bold tracking-tight text-ring min-[380px]:inline">
            sanggabiz
          </span>
        </Link>
        <Link
          href="/kelas"
          aria-current={active === "kelas" ? "page" : undefined}
          className={cn(
            "rounded-md px-1 text-sm font-semibold whitespace-nowrap underline-offset-4 hover:underline",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
            active === "kelas" ? "text-ring underline" : "text-foreground"
          )}
        >
          {t.catalog.navClasses}
        </Link>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <DisplaySettings />
        <LanguageSwitcher />
        {/*
          Tombol ini dan "Mulai" di sebelahnya menuju alamat yang sama, jadi
          menyembunyikannya di layar sempit tidak menghilangkan satu pun
          tujuan -- hanya menghapus pilihan ganda yang tidak muat.
        */}
        <Button
          variant="ghost"
          size="lg"
          className="hidden h-10 px-5 text-sm font-semibold sm:inline-flex"
          render={<Link href="/auth/login" />}
          nativeButton={false}
        >
          {t.landing.signIn}
        </Button>
        <Button
          size="lg"
          className="h-10 shrink-0 bg-brand-gradient px-4 text-sm font-semibold text-white hover:brightness-105 sm:px-5"
          render={<Link href="/auth/login" />}
          nativeButton={false}
        >
          {t.landing.getStarted}
        </Button>
      </div>
    </header>
  )
}
