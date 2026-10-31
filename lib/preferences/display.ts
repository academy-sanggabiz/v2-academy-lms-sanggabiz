/**
 * Preferensi tampilan: ukuran teks, kontras, dan animasi.
 *
 * **Ini bukan overlay aksesibilitas, dan sengaja tidak boleh menjadi satu.**
 * Alasannya di docs/STANDAR-AKSESIBILITAS-PREFERENSI.md: produk overlay --
 * widget mengambang yang mengaku membuat situs "patuh WCAG", menyuntikkan ARIA
 * sendiri, dan menawarkan "mode disleksia" atau "mode ADHD" -- dinilai
 * merugikan oleh komunitas aksesibilitas, dan tidak satu pun benar-benar
 * memperbaiki hambatan di bawahnya.
 *
 * Yang di sini berbeda tiga hal: ia tidak mengaku memperbaiki apa pun, ia
 * tidak menebak disabilitas siapa pun, dan bawaannya selalu mengikuti
 * pengaturan perangkat. Pengguna hanya menimpanya kalau memang mau.
 */

export const TEXT_SIZES = ["device", "large", "larger"] as const
export type TextSize = (typeof TEXT_SIZES)[number]

export const CONTRAST_MODES = ["device", "high"] as const
export type ContrastMode = (typeof CONTRAST_MODES)[number]

export const MOTION_MODES = ["device", "reduced"] as const
export type MotionMode = (typeof MOTION_MODES)[number]

export type DisplayPreferences = {
  textSize: TextSize
  contrast: ContrastMode
  motion: MotionMode
}

export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  textSize: "device",
  contrast: "device",
  motion: "device",
}

export const DISPLAY_COOKIE = "tampilan"

function pick<T extends readonly string[]>(allowed: T, value: unknown, fallback: T[number]): T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback
}

/** Membaca nilai cookie `tampilan`; apa pun yang tidak dikenal jatuh ke bawaan. */
export function parseDisplayPreferences(raw: string | undefined): DisplayPreferences {
  if (!raw) return DEFAULT_DISPLAY_PREFERENCES
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return DEFAULT_DISPLAY_PREFERENCES
  }
  const value = (parsed ?? {}) as Record<string, unknown>
  return {
    textSize: pick(TEXT_SIZES, value.textSize, "device"),
    contrast: pick(CONTRAST_MODES, value.contrast, "device"),
    motion: pick(MOTION_MODES, value.motion, "device"),
  }
}

export function serializeDisplayPreferences(preferences: DisplayPreferences): string {
  return JSON.stringify(preferences)
}

/**
 * Atribut untuk elemen `<html>`. "device" tidak menulis atribut sama sekali --
 * dengan begitu aturan `@media (prefers-*)` di globals.css tetap yang berlaku,
 * dan tidak ada yang ditimpa tanpa diminta.
 */
export function displayAttributes(preferences: DisplayPreferences): Record<string, string> {
  const attributes: Record<string, string> = {}
  if (preferences.textSize !== "device") attributes["data-text-size"] = preferences.textSize
  if (preferences.contrast !== "device") attributes["data-contrast"] = preferences.contrast
  if (preferences.motion !== "device") attributes["data-motion"] = preferences.motion
  return attributes
}
