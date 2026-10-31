"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config"
import { createClient } from "@/lib/supabase/server"

/**
 * Menyimpan pilihan bahasa. Cookie supaya langsung berlaku termasuk sebelum
 * masuk; `profiles.locale` supaya pilihan itu ikut berpindah perangkat.
 *
 * Satu tahun, `lax`: ini preferensi tampilan, bukan data sesi.
 */
export async function setLocale(value: string) {
  if (!isLocale(value)) return { error: "Bahasa tidak dikenal" }

  const store = await cookies()
  store.set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (userId) {
    const { error } = await supabase.from("profiles").update({ locale: value }).eq("id", userId)
    // Kegagalan di sini tidak membatalkan pergantian bahasa: cookie-nya sudah
    // tersimpan dan halaman akan tampil dalam bahasa yang diminta.
    if (error) console.error("setLocale profile update failed:", error.message)
  }

  revalidatePath("/", "layout")
  return { error: null }
}
