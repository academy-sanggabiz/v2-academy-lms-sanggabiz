"use client"

import { useTransition } from "react"
import { Languages } from "lucide-react"

import { setLocale } from "@/app/i18n-actions"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LOCALES, LOCALE_LABELS, isLocale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

/**
 * Pemilih bahasa.
 *
 * Semula sekelompok tombol berdampingan, dengan alasan bahwa untuk dua pilihan
 * dropdown hanya menyembunyikan keduanya di balik satu ketukan tambahan. Alasan
 * itu benar sendirian, tetapi mengabaikan tempatnya: di header halaman depan ia
 * berdiri di samping tombol preferensi tampilan, "Masuk", dan "Mulai", dan
 * empat kelompok kontrol berebut lebar yang sama membuat header terasa sesak --
 * terutama di layar sempit, tempat ia selama ini justru disembunyikan.
 *
 * Satu tombol yang menampilkan bahasa aktif memberi informasi yang sama dengan
 * ruang jauh lebih kecil, dan karena itu tidak perlu lagi disembunyikan di
 * ponsel.
 *
 * `DropdownMenuRadioGroup`, bukan daftar tombol biasa: pilihannya tunggal dan
 * saling meniadakan, dan radio menyampaikan persis itu ke pembaca layar --
 * termasuk mana yang sedang terpilih, tanpa perlu aria-pressed di tiap baris.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n()
  const [pending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            aria-label={`${t.common.changeLanguage}: ${LOCALE_LABELS[locale]}`}
            className={cn("gap-1.5", className)}
          >
            <Languages className="size-4" aria-hidden />
            {locale.toUpperCase()}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => {
            if (!isLocale(value) || value === locale) return
            startTransition(async () => {
              await setLocale(value)
            })
          }}
        >
          {LOCALES.map((value) => (
            // lang pada tiap baris supaya pembaca layar melafalkan nama
            // bahasanya dengan benar -- "English" dibaca sebagai bahasa
            // Inggris meski menu di sekitarnya berbahasa Indonesia.
            <DropdownMenuRadioItem key={value} value={value} lang={value}>
              {LOCALE_LABELS[value]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
