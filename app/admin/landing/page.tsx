import { redirect } from "next/navigation"

import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { getLandingContent } from "@/lib/landing-server"
import { getPublishedCourses } from "@/lib/courses-server"
import { LandingForm } from "@/components/admin/landing/LandingForm"
import { getLandingBlocks, getLandingTheme } from "@/lib/landing-server"
import { ThemePicker } from "@/components/admin/landing/ThemePicker"
import { BlockEditor } from "@/components/admin/landing/BlockEditor"

export default async function AdminLandingPage() {
  const result = await resolveSuperAdminProfile()

  // AdminLayout already redirects unauthenticated/non-admin sessions; a
  // signed-in admin who isn't superadmin lands here only via a direct URL.
  if (result.status !== "ok") {
    redirect("/admin/dashboard")
  }

  const [content, courses, blocks, theme] = await Promise.all([
    getLandingContent(),
    getPublishedCourses(),
    getLandingBlocks(),
    getLandingTheme(),
  ])
  const availableCourses = courses.map((c) => ({ id: c.id, title: c.title }))

  return (
    <div className="space-y-10">
      {/* Penyusun blok menentukan bagian mana yang tampil dan urutannya;
          formulir di bawahnya menyunting isi rinci hero, keunggulan, dan
          kursus pilihan. Keduanya menyimpan ke baris yang sama. */}
      <ThemePicker initialTheme={theme} />
      <BlockEditor initialBlocks={blocks} />
      <LandingForm content={content} availableCourses={availableCourses} />
    </div>
  )
}
