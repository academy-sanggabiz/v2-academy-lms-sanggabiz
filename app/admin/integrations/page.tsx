import { redirect } from "next/navigation"

import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { getIntegrasi } from "@/lib/integrations-server"
import { IntegrationsView } from "@/components/admin/integrations/IntegrationsView"

/**
 * Kunci API dan webhook, khusus superadmin.
 *
 * Satu kunci API membuka seluruh daftar peserta dan pendaftaran lintas
 * kursus -- jauh melewati apa yang boleh dilihat seorang mentor atas
 * kursusnya sendiri. Yang boleh menerbitkannya harus orang yang memang sudah
 * boleh melihat semuanya.
 */
export default async function AdminIntegrationsPage() {
  const result = await resolveSuperAdminProfile()
  if (result.status !== "ok") redirect("/admin/dashboard")

  const data = await getIntegrasi()
  return <IntegrationsView data={data} />
}
