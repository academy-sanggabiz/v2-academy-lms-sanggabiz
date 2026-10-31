"use client"

import { useTransition } from "react"
import { Languages } from "lucide-react"

import { setLocale } from "@/app/i18n-actions"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

/**
 * Pemilih bahasa.
 *
 * Dibuat sebagai sekelompok tombol, bukan menu dropdown: pilihannya hanya dua,
 * dan dropdown untuk dua pilihan menyembunyikan keduanya di balik satu
 * ketukan tambahan. `aria-pressed` menyatakan mana yang sedang aktif, sehingga
 * pembaca layar menyebutkannya tanpa perlu membuka apa pun.
 *
 * Nama bahasanya ditulis dalam bahasanya sendiri -- "English", bukan "Inggris"
 * -- supaya orang yang tidak bisa membaca bahasa yang sedang aktif tetap
 * mengenali pilihannya.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n()
  const [pending, startTransition] = useTransition()

  return (
    <div
      role="group"
      aria-label={t.common.changeLanguage}
      className={cn("inline-flex items-center gap-1 rounded-lg border border-input bg-card p-1", className)}
    >
      <Languages className="ml-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
      {LOCALES.map((value) => {
        const active = value === locale
        return (
          <button
            key={value}
            type="button"
            lang={value}
            aria-pressed={active}
            disabled={pending}
            onClick={() => {
              if (active) return
              startTransition(async () => {
                await setLocale(value)
              })
            }}
            className={cn(
              // 24 px tinggi minimum: sasaran sentuh WCAG 2.2 SC 2.5.8.
              "min-h-6 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
              active
                ? "bg-secondary text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              pending && "opacity-60"
            )}
          >
            {value.toUpperCase()}
            <span className="sr-only"> — {LOCALE_LABELS[value]}</span>
          </button>
        )
      })}
    </div>
  )
}
