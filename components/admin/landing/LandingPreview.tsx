"use client"

import { useEffect, useRef, useState } from "react"
import { Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n/LocaleProvider"

/**
 * Pratinjau halaman depan di sebelah penyusunnya.
 *
 * Memakai iframe ke halaman depan yang sebenarnya, bukan tiruan yang dirender
 * ulang di sini. Tiruan akan berbeda dari halaman aslinya begitu salah satu
 * dari keduanya diubah, dan pratinjau yang berbohong lebih buruk daripada
 * tidak ada pratinjau.
 *
 * Konsekuensinya jujur dan disebutkan di layar: yang tampil adalah **versi
 * tersimpan**. Perubahan yang belum disimpan belum terlihat. Pratinjau
 * memuat ulang sendiri setiap kali penyimpanan berhasil.
 *
 * Lebar perangkat diatur dengan mengubah lebar iframe-nya, bukan dengan
 * menskalakan gambar: dengan begitu titik putus CSS yang sesungguhnya ikut
 * bekerja, sehingga yang terlihat memang tata letak di lebar itu.
 */
const DEVICES = [
  { key: "desktop", width: "100%", icon: Monitor },
  { key: "tablet", width: "768px", icon: Tablet },
  { key: "mobile", width: "390px", icon: Smartphone },
] as const

export function LandingPreview({ reloadToken, locale = "id" }: { reloadToken: number; locale?: string }) {
  const { t } = useI18n()
  const DEVICE_LABELS: Record<(typeof DEVICES)[number]["key"], string> = {
    desktop: t.superadmin.deviceDesktop,
    tablet: t.superadmin.deviceTablet,
    mobile: t.superadmin.devicePhone,
  }
  const [device, setDevice] = useState<(typeof DEVICES)[number]["key"]>("desktop")
  const [nonce, setNonce] = useState(0)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const seenToken = useRef(reloadToken)

  // Memuat ulang hanya ketika token berubah, yaitu setelah penyimpanan
  // berhasil -- bukan pada setiap render.
  useEffect(() => {
    if (seenToken.current === reloadToken) return
    seenToken.current = reloadToken
    setNonce((n) => n + 1)
  }, [reloadToken])

  const active = DEVICES.find((d) => d.key === device) ?? DEVICES[0]

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">{t.superadmin.previewHead}</span>
        <div role="group" aria-label={t.superadmin.deviceWidth} className="flex gap-1">
          {DEVICES.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={key === device}
              onClick={() => setDevice(key)}
              className={cn(
                "flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
                key === device
                  ? "border-ring bg-secondary text-primary"
                  : "border-input text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {DEVICE_LABELS[key]}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => setNonce((n) => n + 1)}>
          <RefreshCw className="size-4" aria-hidden />
          {t.superadmin.reload}
        </Button>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        {t.superadmin.previewSavedNote}
      </p>

      <div className="flex justify-center overflow-x-auto">
        <iframe
          ref={frameRef}
          key={nonce}
          src={`/?pratinjau=${nonce}&bahasa=${locale}`}
          title={t.superadmin.landingPreviewTitle}
          className="h-[600px] shrink-0 rounded-xl border border-border bg-card"
          style={{ width: active.width, maxWidth: "100%" }}
        />
      </div>
    </div>
  )
}
