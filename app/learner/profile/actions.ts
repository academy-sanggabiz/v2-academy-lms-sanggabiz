"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

/**
 * Menyimpan profil peserta. Kolom yang boleh diubah dibatasi di basis data
 * lewat `grant update (...)` (migrasi 20261101010000), bukan hanya di sini --
 * tanpa itu, siapa pun bisa menaikkan perannya sendiri lewat REST.
 *
 * Hanya nama yang wajib; sisanya boleh kosong dan disimpan sebagai NULL,
 * bukan string kosong, supaya "tidak diisi" dan "diisi kosong" tidak menjadi
 * dua keadaan berbeda di basis data (docs/STANDAR-PROFIL-PESERTA.md P3).
 */
export async function updateProfile(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "").trim()

  const fullName = text("fullName")
  if (!fullName) return { error: "Nama tidak boleh kosong" }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return { error: "Anda belum masuk" }

  const avatarUrl = text("avatarUrl")

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      certificate_name: text("certificateName") || null,
      phone: text("phone") || null,
      organization: text("organization") || null,
      avatar_url: avatarUrl || null,
    })
    .eq("id", userId)

  if (error) {
    console.error("updateProfile failed:", error.message)
    return { error: "Gagal menyimpan profil. Coba lagi." }
  }

  revalidatePath("/learner/profile")
  revalidatePath("/learner", "layout")
  return { error: null }
}
