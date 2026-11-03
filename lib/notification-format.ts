/** Client-safe formatting shared by the notification dropdown and the full list page. */
import type { Dictionary } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"

/** "baru saja" / "3 jam lalu" / "2 hari lalu" -- enough precision for a notification list. */
export function relativeTime(iso: string, t: Dictionary, locale: Locale = "id"): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return t.editor.justNow
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return t.editor.minutesAgo.replace("{n}", String(minutes))
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t.editor.hoursAgo.replace("{n}", String(hours))
  const days = Math.floor(hours / 24)
  if (days < 7) return t.editor.daysAgo.replace("{n}", String(days))
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short" })
}
