import Link from "next/link"

import { getDictionary } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"

/**
 * Kaki halaman publik. Tautannya sengaja sedikit: hanya yang benar-benar ada
 * halamannya. "Ketentuan" belum ditulis, jadi ia memang tidak ditampilkan --
 * kontrol yang terlihat bisa dipakai tetapi tidak membawa ke mana-mana adalah
 * cacat menurut STANDAR-DIGITAL-LEARNING §17, bukan sekadar kekurangan.
 */
export function PublicFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)

  return (
    <footer className="flex flex-col items-center gap-4 border-t border-border bg-card px-6 py-14 text-center">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Sanggabiz" className="size-6 object-contain" />
        <span className="text-lg font-bold text-ring">sanggabiz</span>
      </div>
      <p className="max-w-lg text-sm text-muted-foreground">{t.landing.footerTagline}</p>
      <div className="flex flex-wrap justify-center gap-4.5 text-sm">
        <Link href="/kelas" className="underline underline-offset-4">
          {t.catalog.navClasses}
        </Link>
        <Link href="/legal/privasi" className="underline underline-offset-4">
          {t.landing.privacy}
        </Link>
      </div>
      <div className="text-xs text-muted-foreground">© 2026 Sanggabiz</div>
    </footer>
  )
}
