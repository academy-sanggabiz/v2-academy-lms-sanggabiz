"use server"

import { redirect } from "next/navigation"

import { resolveUserRole, roleHomePath } from "@/lib/auth/require-admin"
import { authErrorMessage } from "@/lib/auth/auth-error-message"
import { safeNextPath } from "@/lib/auth/safe-next"
import { createClient } from "@/lib/supabase/server"

export type LoginState = { error: string } | null

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const captchaToken = String(formData.get("captchaToken") ?? "")

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  })

  if (error) {
    return { error: authErrorMessage(error.message) }
  }

  const resolved = await resolveUserRole()
  if (!resolved) {
    // Signed in but no resolvable session — bail out safely.
    await supabase.auth.signOut()
    return { error: "Akun Anda tidak dapat dikenali" }
  }

  /*
   * Kembali ke halaman yang menyuruh masuk, kalau ada.
   *
   * Dipakai pratinjau kelas publik: orang menekan "Daftar", diminta masuk,
   * lalu harus mendarat kembali di kelas yang tadi dilihatnya -- bukan di
   * dasbor, tempat kelas itu tidak kelihatan lagi.
   *
   * Nilainya datang dari alamat URL, jadi ia disaring safeNextPath() dulu:
   * tanpa itu, tautan "masuk" yang dibagikan orang lain bisa memindahkan
   * korban ke situs lain tepat setelah ia memasukkan kata sandinya.
   */
  const next = safeNextPath(String(formData.get("next") ?? ""))
  redirect(next ?? roleHomePath(resolved.role))
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
