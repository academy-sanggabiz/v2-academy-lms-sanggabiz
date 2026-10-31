"use server"

import { createClient } from "@/lib/supabase/server"
import { authErrorMessage } from "@/lib/auth/auth-error-message"
import { resolveUserRole, roleHomePath } from "@/lib/auth/require-admin"

export type SetNewPasswordResult =
  | { ok: true; destination: string }
  | { ok: false; error: string }

/**
 * Menyetel kata sandi baru untuk sesi yang sedang berjalan.
 *
 * Tautan pemulihan dari email sudah ditukar menjadi sesi oleh
 * `/auth/callback`, jadi di sini pengguna memang sudah masuk. Karena itu
 * halaman ini wajib menolak permintaan tanpa sesi -- tanpa pemeriksaan itu,
 * rutenya hanya formulir yang tidak melakukan apa-apa dan membingungkan.
 */
export async function setNewPassword(password: string): Promise<SetNewPasswordResult> {
  if (!password || password.length < 6) {
    return { ok: false, error: "Kata sandi minimal 6 karakter." }
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) {
    return { ok: false, error: "Tautan pemulihan sudah tidak berlaku. Minta tautan baru, lalu coba lagi." }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { ok: false, error: authErrorMessage(error.message) }
  }

  const resolved = await resolveUserRole()
  return { ok: true, destination: roleHomePath(resolved?.role ?? "learner") }
}
