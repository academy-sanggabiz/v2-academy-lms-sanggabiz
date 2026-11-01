import { redirect } from "next/navigation"

import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { certificateDefaultsReady, getCertificateDefaults } from "@/lib/certificate-defaults-server"
import { CertificateDefaultsForm } from "@/components/admin/certificates/CertificateDefaultsForm"

export default async function AdminCertificatesPage() {
  const result = await resolveSuperAdminProfile()

  // AdminLayout sudah menolak sesi yang bukan pengelola; mentor yang masuk
  // ke sini hanya bisa lewat alamat langsung.
  if (result.status !== "ok") redirect("/admin/dashboard")

  const [defaults, ready] = await Promise.all([getCertificateDefaults(), certificateDefaultsReady()])

  return <CertificateDefaultsForm initial={defaults} ready={ready} />
}
