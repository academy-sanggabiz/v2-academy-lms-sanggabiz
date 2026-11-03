"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireSuperAdmin } from "@/lib/auth/require-admin"

import type { ActionResult } from "@/app/admin/courses/actions"

export type PeranPengguna = "learner" | "mentor" | "superadmin"

/**
 * Mengubah peran seseorang.
 *
 * Kewenangannya diperiksa dua kali dengan sengaja: `requireSuperAdmin()` di
 * sini, dan `is_superadmin()` di dalam fungsi basis data. Server action bisa
 * dipanggil langsung lewat jaringan, jadi penjaga di layar bukan penjaga --
 * dan fungsi basis datalah yang benar-benar menolak, bukan tombol yang tidak
 * ditampilkan.
 *
 * Seluruh aturannya (tidak boleh mengubah peran sendiri, tidak boleh
 * menurunkan superadmin terakhir, jejak siapa mengangkat siapa) ada di
 * `set_user_role` -- bukan di sini, supaya tidak ada jalur kedua yang
 * aturannya berbeda.
 */
export async function setUserRoleAction(
  userId: string,
  role: PeranPengguna
): Promise<ActionResult<{ changed: boolean }>> {
  try {
    await requireSuperAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("set_user_role", { p_user: userId, p_role: role })

  if (error) {
    console.error("setUserRoleAction failed:", error.message)
    // Pesan dari fungsi basis data sudah ditulis untuk dibaca manusia
    // ("Tidak bisa menurunkan superadmin terakhir"), jadi diteruskan apa
    // adanya alih-alih diganti kalimat umum yang menyembunyikan sebabnya.
    return { ok: false, error: error.message || "Gagal mengubah peran" }
  }

  revalidatePath("/admin/learners", "layout")
  revalidatePath("/admin/mentor", "page")
  return { ok: true, data: { changed: Boolean((data as { changed?: boolean } | null)?.changed) } }
}
