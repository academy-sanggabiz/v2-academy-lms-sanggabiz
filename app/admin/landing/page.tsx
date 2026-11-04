import { redirect } from "next/navigation"

import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { getCatalogCourses } from "@/lib/catalog-server"
import {
  getEnglishLandingBlocks,
  getLandingBlocks,
  getLandingTestimonials,
  getLandingTheme,
  getPlatformTotals,
  listPublicInstructors,
} from "@/lib/landing-server"
import { ThemePicker } from "@/components/admin/landing/ThemePicker"
import { BlockEditor } from "@/components/admin/landing/BlockEditor"

export default async function AdminLandingPage() {
  const result = await resolveSuperAdminProfile()

  // AdminLayout already redirects unauthenticated/non-admin sessions; a
  // signed-in admin who isn't superadmin lands here only via a direct URL.
  if (result.status !== "ok") {
    redirect("/admin/dashboard")
  }

  // Data yang sama dengan yang dipakai halaman depan, supaya pratinjau di
  // penyunting menampilkan isi sebenarnya -- bukan contoh yang dikarang.
  const [katalog, blocks, blocksEn, theme, testimonials, totals, instructors] = await Promise.all([
    getCatalogCourses(),
    getLandingBlocks(),
    getEnglishLandingBlocks(),
    getLandingTheme(),
    getLandingTestimonials(),
    getPlatformTotals(),
    listPublicInstructors(),
  ])
  const availableCourses = katalog.courses.map((c) => ({ id: c.id, title: c.title }))

  return (
    <div className="space-y-10">
      {/*
        Satu penyunting untuk seluruh halaman depan, per bahasa. Dulu ada
        formulir kedua di bawah ini yang menyunting kolom `heading`,
        `features`, dan `featured_course_ids` -- kolom yang hanya dipakai
        sebagai nilai bawaan saat `blocks` masih kosong, jadi suntingannya
        tidak pernah tampil di halaman depan. Formulir itu dihapus dan satu
        kendali yang sungguh dipakainya (pemilih kursus unggulan) pindah ke
        dalam blok "Kursus Pilihan".
      */}
      <ThemePicker initialTheme={theme} />
      <BlockEditor
        initialBlocks={blocks}
        initialBlocksEn={blocksEn}
        availableCourses={availableCourses}
        previewData={{
          courses: katalog.courses,
          testimonials,
          totals,
          categories: katalog.facets.categories,
          instructors,
          theme,
        }}
      />
    </div>
  )
}
