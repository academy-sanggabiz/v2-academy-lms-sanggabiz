"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

import {
  DISPLAY_COOKIE,
  parseDisplayPreferences,
  serializeDisplayPreferences,
  type DisplayPreferences,
} from "@/lib/preferences/display"

/**
 * Menyimpan preferensi tampilan di cookie.
 *
 * Tidak disimpan ke `profiles` dengan sengaja, berbeda dari pilihan bahasa:
 * preferensi ini menggambarkan perangkat dan keadaan membaca saat itu -- layar
 * kecil di bawah matahari butuh hal yang berbeda dari layar besar di ruangan
 * gelap -- sehingga mengikutkannya antar perangkat justru sering keliru.
 *
 * Nilainya pun sengaja tidak pernah dikirim ke mana-mana: menyimpan "orang ini
 * memakai teks besar dan kontras tinggi" di basis data berarti menyimpan
 * petunjuk tentang kondisi penglihatan seseorang, yaitu data yang tidak kita
 * perlukan untuk apa pun (UU PDP 27/2022 Pasal 16: terbatas dan spesifik).
 */
export async function setDisplayPreferences(next: Partial<DisplayPreferences>) {
  const store = await cookies()
  const current = parseDisplayPreferences(store.get(DISPLAY_COOKIE)?.value)
  const merged = { ...current, ...next }

  store.set(DISPLAY_COOKIE, serializeDisplayPreferences(merged), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })

  revalidatePath("/", "layout")
  return { error: null }
}
