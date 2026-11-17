"use client"

import { useId, useState } from "react"
import { Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { StatusMessage } from "@/components/ui/status-message"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { useI18n } from "@/components/i18n/LocaleProvider"

/**
 * Mencoba API langsung dari layar, tanpa Terminal dan tanpa Postman.
 *
 * Ada karena satu-satunya cara mencoba API sebelumnya adalah `curl` atau
 * memasang Postman. Keduanya menutup pintu bagi orang yang justru paling
 * perlu melihat hasilnya: pemilik yang mempresentasikannya, dan calon
 * pelanggan yang ingin tahu bentuk datanya sebelum memanggil tim IT-nya.
 *
 * Kuncinya TIDAK pernah disimpan -- tidak ke localStorage, tidak ke server.
 * Ia hidup di state komponen ini saja dan hilang begitu halaman ditutup.
 * Menyimpannya "supaya tidak perlu menempel ulang" berarti satu rahasia lagi
 * tertinggal di perangkat yang mungkin dipakai bersama.
 *
 * Hanya GET. Jalur tulis (`POST /api/v1/enrollments`) sengaja tidak ada di
 * sini: tombol yang mendaftarkan orang sungguhan ke kursus sungguhan tidak
 * pantas berada di dalam alat peraga.
 */
const JALUR = [
  { nilai: "/api/public/stats", kunci: false },
  { nilai: "/api/v1/courses?limit=5", kunci: true },
  { nilai: "/api/v1/learners?limit=5", kunci: true },
  { nilai: "/api/v1/enrollments?limit=5", kunci: true },
  { nilai: "/api/v1/certificates?limit=5", kunci: true },
] as const

export function ApiConsole() {
  const { t } = useI18n()
  const idJalur = useId()
  const idKunci = useId()
  const [jalur, setJalur] = useState<string>(JALUR[0].nilai)
  const [kunci, setKunci] = useState("")
  const [hasil, setHasil] = useState("")
  const [status, setStatus] = useState<number | null>(null)
  const [galat, setGalat] = useState("")
  const [sibuk, setSibuk] = useState(false)

  const perluKunci = JALUR.find((j) => j.nilai === jalur)?.kunci ?? true

  async function kirim() {
    setSibuk(true)
    setGalat("")
    setHasil("")
    setStatus(null)
    try {
      const r = await fetch(jalur, {
        headers: perluKunci && kunci.trim() ? { Authorization: `Bearer ${kunci.trim()}` } : {},
      })
      setStatus(r.status)
      const teks = await r.text()
      try {
        setHasil(JSON.stringify(JSON.parse(teks), null, 2))
      } catch {
        setHasil(teks.slice(0, 4000))
      }
    } catch (e) {
      setGalat(e instanceof Error ? e.message : t.integrasi.consoleFailed)
    } finally {
      setSibuk(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor={idJalur}>{t.integrasi.consoleEndpoint}</Label>
          <select
            id={idJalur}
            value={jalur}
            onChange={(e) => setJalur(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          >
            {JALUR.map((j) => (
              <option key={j.nilai} value={j.nilai}>
                {j.nilai}
                {j.kunci ? "" : ` — ${t.integrasi.consoleNoKey}`}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={idKunci}>{t.integrasi.consoleKey}</Label>
          <PasswordInput
            id={idKunci}
            value={kunci}
            disabled={!perluKunci}
            placeholder={perluKunci ? "sgb_…" : t.integrasi.consoleNotNeeded}
            onChange={(e) => setKunci(e.target.value)}
          />
        </div>

        <Button
          className="bg-brand-gradient text-white hover:brightness-105"
          pending={sibuk}
          pendingLabel={t.integrasi.consoleSending}
          onClick={kirim}
        >
          <Play className="size-4" aria-hidden />
          {t.integrasi.consoleSend}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{t.integrasi.consoleNote}</p>
      <StatusMessage>{galat}</StatusMessage>

      {status !== null && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">
            {t.integrasi.consoleStatus.replace("{kode}", String(status))}
            {status === 401 && ` — ${t.integrasi.consoleUnauthorized}`}
          </p>
          {/*
            Kotak yang bisa digulir harus bisa dicapai papan ketik, atau isinya
            tak terjangkau bagi yang tidak memakai tetikus (axe:
            scrollable-region-focusable).
          */}
          <pre
            tabIndex={0}
            role="region"
            aria-label={t.integrasi.consoleResult}
            className="max-h-80 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {hasil}
          </pre>
        </div>
      )}
    </div>
  )
}
