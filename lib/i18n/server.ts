import { cookies, headers } from "next/headers"

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, matchLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries"

/**
 * Bahasa untuk permintaan ini, menurut urutan: pilihan tersimpan di cookie,
 * lalu bahasa peramban, lalu bawaan.
 *
 * `profiles.locale` tidak dibaca di sini dengan sengaja -- itu akan menambah
 * satu query basis data ke setiap render halaman. Kolom itu dipakai sebagai
 * tempat menyimpan pilihan antar perangkat: saat seseorang masuk, cookie-nya
 * diisi dari profil (lihat app/auth/login/actions.ts), dan sesudah itu cookie
 * yang dibaca.
 */
export async function getLocale(): Promise<Locale> {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value
  if (isLocale(stored)) return stored

  const accept = (await headers()).get("accept-language")
  return matchLocale(accept) ?? DEFAULT_LOCALE
}

export async function getTranslations(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale()
  return { locale, t: getDictionary(locale) }
}
