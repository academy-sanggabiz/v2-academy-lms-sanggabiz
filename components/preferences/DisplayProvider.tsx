"use client"

import { createContext, useContext } from "react"

import { DEFAULT_DISPLAY_PREFERENCES, type DisplayPreferences } from "@/lib/preferences/display"

/**
 * Preferensi tampilan disediakan dari layout akar, sama seperti kamus bahasa.
 *
 * Sempat dioper sebagai prop lewat tiap shell, dan itu langsung terasa salah
 * begitu panelnya juga perlu muncul di halaman depan dan halaman masuk --
 * keduanya di luar shell mana pun. Context membuat panel itu bisa dipasang di
 * mana saja tanpa setiap lapisan di atasnya ikut tahu soal preferensi.
 */
const DisplayContext = createContext<DisplayPreferences>(DEFAULT_DISPLAY_PREFERENCES)

export function DisplayProvider({
  preferences,
  children,
}: {
  preferences: DisplayPreferences
  children: React.ReactNode
}) {
  return <DisplayContext.Provider value={preferences}>{children}</DisplayContext.Provider>
}

export function useDisplayPreferences(): DisplayPreferences {
  return useContext(DisplayContext)
}
