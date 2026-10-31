import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin/AdminShell"
import { resolveAdminProfile } from "@/lib/auth/require-admin"
import { createClient } from "@/lib/supabase/server"
import { getNotifications } from "@/lib/notifications-server"
import { getTranslations } from "@/lib/i18n/server"

// Judul tab ikut bahasa: generateMetadata bisa membaca cookie, sedangkan
// `export const metadata` dievaluasi sekali tanpa konteks permintaan.
export async function generateMetadata() {
  const { t } = await getTranslations()
  return { title: t.pageTitles.admin }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const result = await resolveAdminProfile()

  if (result.status === "unauthenticated") {
    redirect("/auth/login")
  }
  if (result.status === "unauthorized") {
    redirect("/auth/login?error=Anda tidak berwenang mengakses area pengelola")
  }

  const supabase = await createClient()
  const [{ data: profile }, notifications] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", result.profile.userId).single(),
    getNotifications(5),
  ])

  const name = profile?.full_name || profile?.email || "Pengelola"

  return (
    <AdminShell
      name={name}
      role={result.profile.role}
      notifications={notifications.items}
      unreadCount={notifications.unreadCount}
    >
      {children}
    </AdminShell>
  )
}
