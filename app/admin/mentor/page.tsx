import { redirect } from "next/navigation"

import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { getMentorOverview } from "@/lib/mentors-server"
import { MentorOverview } from "@/components/admin/mentors/MentorOverview"

/**
 * Evaluasi mentor, khusus superadmin.
 *
 * Penjagaan sebenarnya ada di dua tempat yang lebih dalam: proxy.ts memantulkan
 * non-superadmin dengan 307 sebelum HTML terkirim, dan
 * `admin_mentor_overview()` sendiri mengembalikan daftar kosong kepada siapa pun
 * selain superadmin. Pemeriksaan di sini adalah lapisan ketiga untuk keadaan
 * saat klaim peran di JWT belum terisi.
 */
export default async function AdminMentorPage() {
  const result = await resolveSuperAdminProfile()
  if (result.status !== "ok") redirect("/admin/dashboard")

  const mentors = await getMentorOverview()
  return <MentorOverview mentors={mentors} />
}
