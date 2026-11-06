import { redirect } from "next/navigation"

import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { getCatalogCourses } from "@/lib/catalog-server"
import {
  getLandingDraft,
  getLandingTestimonials,
  getPlatformTotals,
  listPublicInstructors,
} from "@/lib/landing-server"
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
  // Draf bila ada, terbitan bila tidak -- satu kueri, supaya penyunting tidak
  // pernah membuka campuran draf lama dengan terbitan baru.
  const [katalog, draf, testimonials, totals, instructors] = await Promise.all([
    getCatalogCourses(),
    getLandingDraft(),
    getLandingTestimonials(),
    getPlatformTotals(),
    listPublicInstructors(),
  ])
  const availableCourses = katalog.courses.map((c) => ({ id: c.id, title: c.title }))

  return (
    <BlockEditor
      initialBlocks={draf.blocks}
      initialBlocksEn={draf.blocksEn}
      initialTheme={draf.theme}
      adaDrafTersimpan={draf.adaDraf}
      availableCourses={availableCourses}
      previewData={{
        courses: katalog.courses,
        testimonials,
        totals,
        categories: katalog.facets.categories,
        instructors,
        theme: draf.theme,
      }}
    />
  )
}
