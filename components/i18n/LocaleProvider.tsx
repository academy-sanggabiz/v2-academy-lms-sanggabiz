"use client"

import { createContext, useContext } from "react"

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries"

/**
 * Kamusnya dikirim dari server sekali per halaman, bukan diambil ulang di
 * klien: isinya statis dan kecil, dan memuatnya di klien akan membuat teks
 * sempat tampil dalam bahasa yang salah sebelum tertukar.
 */
const LocaleContext = createContext<{ locale: Locale; t: Dictionary }>({
  locale: DEFAULT_LOCALE,
  t: getDictionary(DEFAULT_LOCALE),
})

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return (
    <LocaleContext.Provider value={{ locale, t: getDictionary(locale) }}>
      {children}
    </LocaleContext.Provider>
  )
}

/** Kamus dan bahasa aktif untuk komponen klien. */
export function useI18n() {
  return useContext(LocaleContext)
}
