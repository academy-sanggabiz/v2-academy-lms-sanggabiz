import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getPublishedCourses } from "@/lib/courses-server"
import { getCatalogCourses } from "@/lib/catalog-server"
import {
  getLandingBlocks,
  getLandingTestimonials,
  getLandingTheme,
  getPlatformTotals,
  listPublicInstructors,
} from "@/lib/landing-server"
import { themeStyle } from "@/lib/landing-theme"
import { LandingBlocks } from "@/components/landing/LandingBlocks"
import { PublicHeader } from "@/components/public/PublicHeader"
import { PublicFooter } from "@/components/public/PublicFooter"
import { getTranslations } from "@/lib/i18n/server"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { isLocale } from "@/lib/i18n/config"
import { LocaleProvider } from "@/components/i18n/LocaleProvider"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ bahasa?: string }>
}) {
  // ?bahasa= menimpa cookie khusus untuk halaman ini: pratinjau di
  // /admin/landing memakainya supaya superadmin yang sedang menyunting versi
  // Inggris melihat versi Inggris, tanpa harus mengganti bahasa antarmukanya
  // sendiri. Pengunjung biasa tetap lewat cookie seperti halaman lain.
  const { bahasa } = await searchParams
  const cookieLocale = (await getTranslations()).locale
  const locale = isLocale(bahasa) ? bahasa : cookieLocale
  const t = getDictionary(locale)

  // Susunan halaman depan kini data, bukan tata letak: superadmin bisa
  // menambah, menghapus, menyembunyikan, dan mengurutkan bloknya sendiri
  // (lib/landing-blocks.ts).
  const [blocks, courses, testimonials, theme, totals, katalog, instructors] = await Promise.all([
    getLandingBlocks(locale),
    getPublishedCourses(),
    getLandingTestimonials(),
    getLandingTheme(),
    getPlatformTotals(),
    // Dipakai hanya untuk daftar kategori beserta jumlah kelasnya; kartunya
    // sendiri tetap memakai getPublishedCourses() seperti sebelumnya.
    getCatalogCourses(),
    listPublicInstructors(),
  ])

  // Variabel warna dipasang di pembungkus ini saja, bukan di :root, supaya
  // penggantian warna berhenti di halaman depan dan tidak ikut mengubah layar
  // belajar maupun layar pengelola (lib/landing-theme.ts).
  return (
    /*
      LocaleProvider kedua, bersarang di dalam milik app/layout.tsx: komponen
      klien di halaman ini (kartu kursus, pemilih bahasa) membaca kamus dari
      konteks, yang di layout diisi dari cookie. Tanpa pembungkus ini,
      pratinjau ?bahasa= hanya mengganti blok yang dirender server sementara
      kartu kursusnya tetap mengikuti bahasa superadmin -- pratinjau yang
      setengah berbohong, persis yang dihindari LandingPreview.
    */
    <LocaleProvider locale={locale}>
    <div className="min-h-screen bg-card" style={themeStyle(theme)}>
      {/*
        Padding dan kata "sanggabiz" menyusut di layar sempit. Pada 320px --
        lebar yang disyaratkan WCAG 1.4.10 Reflow -- header ini memuat logo,
        kata merek, dua pemilih, dan dua tombol; bersama-sama mereka melebar
        sampai 425px dan memaksa seluruh halaman digulir menyamping.
      */}
      <PublicHeader locale={locale} />

      {/*
        * Target tautan "Langsung ke konten utama" di app/layout.tsx. Sebelumnya
        * halaman publik sama sekali tidak punya <main id="main-content">,
        * sehingga kontrol pertama yang dipakai pengguna screen reader justru
        * tidak membawa ke mana pun (WCAG 2.4.1).
        */}
      <main id="main-content" tabIndex={-1} className="outline-none">
        <LandingBlocks
          blocks={blocks}
          courses={courses}
          testimonials={testimonials}
          totals={totals}
          categories={katalog.facets.categories}
          instructors={instructors}
          locale={locale}
        />
      </main>

      <PublicFooter locale={locale} />
    </div>
    </LocaleProvider>
  )
}
