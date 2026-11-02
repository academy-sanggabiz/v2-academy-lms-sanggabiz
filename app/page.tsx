import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getPublishedCourses } from "@/lib/courses-server"
import { getLandingBlocks, getLandingTestimonials, getLandingTheme } from "@/lib/landing-server"
import { themeStyle } from "@/lib/landing-theme"
import { LandingBlocks } from "@/components/landing/LandingBlocks"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { DisplaySettings } from "@/components/preferences/DisplaySettings"
import { getTranslations } from "@/lib/i18n/server"

export default async function Home() {
  // Susunan halaman depan kini data, bukan tata letak: superadmin bisa
  // menambah, menghapus, menyembunyikan, dan mengurutkan bloknya sendiri
  // (lib/landing-blocks.ts).
  const [blocks, courses, testimonials, { t }, theme] = await Promise.all([
    getLandingBlocks(),
    getPublishedCourses(),
    getLandingTestimonials(),
    getTranslations(),
    getLandingTheme(),
  ])

  // Variabel warna dipasang di pembungkus ini saja, bukan di :root, supaya
  // penggantian warna berhenti di halaman depan dan tidak ikut mengubah layar
  // belajar maupun layar pengelola (lib/landing-theme.ts).
  return (
    <div className="min-h-screen bg-card" style={themeStyle(theme)}>
      {/*
        Padding dan kata "sanggabiz" menyusut di layar sempit. Pada 320px --
        lebar yang disyaratkan WCAG 1.4.10 Reflow -- header ini memuat logo,
        kata merek, dua pemilih, dan dua tombol; bersama-sama mereka melebar
        sampai 425px dan memaksa seluruh halaman digulir menyamping.
      */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-2 border-b border-border bg-card/90 px-4 backdrop-blur-sm sm:px-10">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/logo.png" alt="Sanggabiz" className="size-8 shrink-0 object-contain" />
          <span className="hidden text-xl font-bold tracking-tight text-ring min-[380px]:inline">
            sanggabiz
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/*
            Pemilih bahasa dan preferensi tampilan juga ada di sini, bukan
            hanya di balik login. Pengunjung yang belum punya akun justru yang
            paling mungkin butuh mengganti bahasa atau memperbesar teks, dan
            sebelumnya tidak punya cara apa pun melakukannya. Keduanya kini
            cukup ringkas untuk ikut tampil di layar sempit.
          */}
          <DisplaySettings />
          <LanguageSwitcher />
          {/*
            Tombol ini dan "Mulai" di bawahnya menuju alamat yang sama, jadi
            menyembunyikannya di layar sempit tidak menghilangkan satu pun
            tujuan -- hanya menghapus pilihan ganda yang tidak muat.
          */}
          <Button
            variant="ghost"
            size="lg"
            className="hidden h-10 px-5 text-sm font-semibold sm:inline-flex"
            render={<Link href="/auth/login" />} nativeButton={false}
          >
            {t.landing.signIn}
          </Button>
          <Button
            size="lg"
            className="h-10 shrink-0 px-4 text-sm font-semibold bg-brand-gradient text-white hover:brightness-105 sm:px-5"
            render={<Link href="/auth/login" />} nativeButton={false}
          >
            {t.landing.getStarted}
          </Button>
        </div>
      </header>

      {/*
        * Target tautan "Langsung ke konten utama" di app/layout.tsx. Sebelumnya
        * halaman publik sama sekali tidak punya <main id="main-content">,
        * sehingga kontrol pertama yang dipakai pengguna screen reader justru
        * tidak membawa ke mana pun (WCAG 2.4.1).
        */}
      <main id="main-content" tabIndex={-1} className="outline-none">
        <LandingBlocks blocks={blocks} courses={courses} testimonials={testimonials} />
      </main>

      <footer className="flex flex-col items-center gap-4 border-t border-border bg-card px-6 py-14 text-center">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Sanggabiz" className="size-6 object-contain" />
          <span className="text-lg font-bold text-ring">sanggabiz</span>
        </div>
        <p className="max-w-lg text-sm text-muted-foreground">
          {t.landing.footerTagline}
        </p>
        {/*
         * Dulu keduanya `href="#"` -- kontrol yang terlihat bisa dipakai tetapi
         * tidak membawa ke mana-mana, anti-pattern yang dilarang
         * STANDAR-DIGITAL-LEARNING §17. "Ketentuan" belum ditulis, jadi untuk
         * sekarang ia memang tidak ditampilkan daripada ditampilkan mati.
         */}
        <div className="flex gap-4.5 text-sm">
          <Link href="/legal/privasi" className="underline underline-offset-4">
            {t.landing.privacy}
          </Link>
        </div>
        <div className="text-xs text-muted-foreground">© 2026 Sanggabiz</div>
      </footer>
    </div>
  )
}
