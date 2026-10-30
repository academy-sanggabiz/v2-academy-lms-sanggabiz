"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createAdminClient } from "@/lib/supabase/admin"
import { authErrorMessage } from "@/lib/auth/auth-error-message"
import { createClient } from "@/lib/supabase/server"

async function getUserId() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  return claimsData?.claims?.sub as string | undefined
}

export async function updateNotificationPref(enabled: boolean) {
  const userId = await getUserId()
  if (!userId) return { error: "Anda belum masuk" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ notification_email_enabled: enabled })
    .eq("id", userId)

  if (error) {
    console.error("updateNotificationPref failed:", error.message)
    return { error: "Gagal menyimpan pengaturan. Coba lagi." }
  }

  revalidatePath("/admin/settings")
  return { error: null }
}

export async function changePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "")
  if (!password || password.length < 6) {
    return { error: "Kata sandi minimal 6 karakter" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: authErrorMessage(error.message) }
  }

  return { error: null }
}

export async function deleteAccount() {
  const userId = await getUserId()
  if (!userId) return { error: "Anda belum masuk" }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    console.error("deleteAccount failed:", error.message)
    return { error: "Gagal menghapus akun. Coba lagi." }
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  // Penghapusan akun tidak dapat dibatalkan, jadi konfirmasinya diberikan di
  // halaman tujuan -- tanpa ini admin mendarat di layar masuk tanpa penjelasan
  // apa pun (STANDAR-UMPAN-BALIK-UI.md R8).
  // /auth/admin/login hanya mengalihkan ke /auth/login dan membuang query-nya,
  // jadi tujuannya ditulis langsung.
  redirect("/auth/login?akun=terhapus")
}
