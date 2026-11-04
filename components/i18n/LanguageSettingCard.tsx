"use client"

import { useTransition } from "react"
import { Languages } from "lucide-react"

import { setLocale } from "@/app/i18n-actions"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { LOCALES, LOCALE_LABELS, isLocale } from "@/lib/i18n/config"

/**
 * Kartu pilihan bahasa untuk halaman Pengaturan (peserta dan pengelola).
 *
 * Pemilih bahasa memang sudah ada di header, tetapi Pengaturan adalah tempat
 * orang mencari preferensi akunnya -- dan preferensi yang hanya bisa diubah
 * dari ikon kecil di header tidak pernah ditemukan sebagian orang. Keduanya
 * memakai aksi yang sama (cookie + profiles.locale), jadi tidak ada dua
 * sumber kebenaran.
 *
 * Tidak ada tombol Simpan: memilih radio langsung menyimpan, dan seluruh
 * halaman berganti bahasa -- pergantian bahasanya sendiri adalah
 * konfirmasinya, lebih jelas daripada toast mana pun (R6).
 */
export function LanguageSettingCard() {
  const { locale, t } = useI18n()
  const [pending, startTransition] = useTransition()

  return (
    <div className="rounded-2xl border border-border bg-card p-7">
      <div className="mb-2 flex items-center gap-2.5 text-lg font-bold">
        <Languages className="size-[18px]" aria-hidden />
        {t.settings.languageTitle}
        {pending && <Spinner className="size-4" />}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{t.settings.languageHint}</p>
      <RadioGroup
        value={locale}
        aria-label={t.settings.languageTitle}
        onValueChange={(value) => {
          if (!isLocale(value) || value === locale || pending) return
          startTransition(async () => {
            await setLocale(value)
          })
        }}
        className="gap-2.5"
      >
        {LOCALES.map((value) => (
          <label
            key={value}
            lang={value}
            className="flex min-h-10 items-center gap-2.5 rounded-lg border border-border px-3 text-sm font-medium"
          >
            <RadioGroupItem value={value} disabled={pending} />
            {LOCALE_LABELS[value]}
          </label>
        ))}
      </RadioGroup>
    </div>
  )
}
