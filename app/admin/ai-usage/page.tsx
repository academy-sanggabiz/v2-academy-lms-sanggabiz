import { redirect } from "next/navigation"

import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { getLaporanPemakaian } from "@/lib/ai-usage-server"
import { AiUsageView } from "@/components/admin/ai-usage/AiUsageView"

/**
 * Pemakaian AI, khusus superadmin.
 *
 * Khusus superadmin karena isinya data tentang ORANG: berapa sering seorang
 * mentor meminta bantuan menyusun, berapa sering seorang peserta bertanya ke
 * asisten. Mentor tidak perlu melihat angka mentor lain.
 *
 * Penjagaannya di sini, pola yang sama dengan /admin/mentor. Laporannya
 * sendiri dibaca dengan service role (lihat lib/ai-usage-server.ts), jadi
 * tidak ada policy yang menahan siapa pun -- pemeriksaan ini yang menahan.
 */
export default async function AdminAiUsagePage() {
  const result = await resolveSuperAdminProfile()
  if (result.status !== "ok") redirect("/admin/dashboard")

  const laporan = await getLaporanPemakaian(30)
  return <AiUsageView laporan={laporan} />
}
