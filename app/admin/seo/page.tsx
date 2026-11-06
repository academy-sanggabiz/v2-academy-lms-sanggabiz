import { redirect } from "next/navigation"

import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { getSeoDraft } from "@/lib/seo-server"
import { alamatKanonik } from "@/lib/site-url"
import { SeoEditor } from "@/components/admin/seo/SeoEditor"

export default async function AdminSeoPage() {
  const result = await resolveSuperAdminProfile()

  // AdminLayout sudah menolak sesi yang tidak masuk atau bukan pengelola;
  // pengelola yang bukan superadmin sampai ke sini hanya lewat alamat langsung.
  if (result.status !== "ok") {
    redirect("/admin/dashboard")
  }

  const draf = await getSeoDraft()

  return (
    <SeoEditor
      initialSeo={draf.seo}
      adaDrafTersimpan={draf.adaDraf}
      situs={alamatKanonik().replace(/^https?:\/\//, "")}
    />
  )
}
