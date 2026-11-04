import { redirect } from "next/navigation"

import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { getPublishedCourses } from "@/lib/courses-server"
import { getEnglishLandingBlocks, getLandingBlocks, getLandingTheme } from "@/lib/landing-server"
import { ThemePicker } from "@/components/admin/landing/ThemePicker"
import { BlockEditor } from "@/components/admin/landing/BlockEditor"

export default async function AdminLandingPage() {
  const result = await resolveSuperAdminProfile()

  // AdminLayout already redirects unauthenticated/non-admin sessions; a
  // signed-in admin who isn't superadmin lands here only via a direct URL.
  if (result.status !== "ok") {
    redirect("/admin/dashboard")
  }

  const [courses, blocks, blocksEn, theme] = await Promise.all([
    getPublishedCourses(),
    getLandingBlocks(),
    getEnglishLandingBlocks(),
    getLandingTheme(),
  ])
  const availableCourses = courses.map((c) => ({ id: c.id, title: c.title }))

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
      <BlockEditor initialBlocks={blocks} initialBlocksEn={blocksEn} availableCourses={availableCourses} />
    </div>
  )
}
