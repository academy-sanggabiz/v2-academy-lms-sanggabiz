"use client"

import { useState, useTransition } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { saveLandingThemeAction } from "@/app/admin/landing/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusMessage } from "@/components/ui/status-message"
import {
  THEME_PRESETS,
  checkTheme,
  contrastRatio,
  type LandingTheme,
} from "@/lib/landing-theme"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n/LocaleProvider"

/**
 * Pemilih warna halaman depan.
 *
 * Perbedaannya dari pemilih warna kebanyakan: rasio kontrasnya **dihitung dan
 * ditampilkan saat diketik**, dan kombinasi yang gagal tidak bisa disimpan.
 * Warna merek yang cerah hampir selalu terlihat bagus di layar orang yang
 * memilihnya dan hampir selalu gagal menopang teks putih; tanpa angka di
 * depan mata, kegagalan itu tidak pernah terlihat sampai ada yang mengeluh
 * tidak bisa membaca.
 */
export function ThemePicker({ initialTheme }: { initialTheme: LandingTheme }) {
  const { t } = useI18n()
  const [theme, setTheme] = useState(initialTheme)
  const [pending, startTransition] = useTransition()

  const check = checkTheme(theme)

  const ratios = [
    { label: t.superadmin.contrastTextOnSurface, value: contrastRatio(theme.foreground, theme.surface) },
    { label: t.superadmin.contrastWhiteOnButton, value: contrastRatio("#ffffff", theme.primary) },
    { label: t.superadmin.contrastPrimaryOnWhite, value: contrastRatio(theme.primary, "#ffffff") },
  ]

  function save() {
    startTransition(async () => {
      const result = await saveLandingThemeAction(theme)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t.superadmin.colorsSaved)
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-1 text-sm font-bold">{t.superadmin.landingColors}</div>
      <p className="mb-4 text-xs text-muted-foreground">
        {t.superadmin.landingColorsDesc}
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {THEME_PRESETS.map((preset) => {
          const active =
            preset.theme.primary === theme.primary &&
            preset.theme.surface === theme.surface &&
            preset.theme.foreground === theme.foreground
          return (
            <button
              key={preset.name}
              type="button"
              aria-pressed={active}
              disabled={pending}
              onClick={() => setTheme(preset.theme)}
              className={cn(
                "flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
                active ? "border-ring bg-secondary text-primary" : "border-input hover:bg-muted"
              )}
            >
              <span
                aria-hidden
                className="size-4 rounded-full border border-black/10"
                style={{ background: preset.theme.primary }}
              />
              {preset.name}
              {active && <Check className="size-3.5" aria-hidden />}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ["primary", t.superadmin.primaryColor],
            ["surface", t.superadmin.softSurface],
            ["foreground", t.superadmin.textColor],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`theme-${key}`}>{label}</Label>
            <div className="flex items-center gap-2">
              {/* Dua kontrol untuk satu nilai: pemilih warna asli untuk yang
                  memakai tetikus, dan isian teks untuk yang menempelkan kode
                  warna merek. Keduanya menulis ke nilai yang sama. */}
              <input
                type="color"
                aria-label={t.superadmin.colorPickerAria.replace("{label}", label)}
                value={theme[key]}
                disabled={pending}
                onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                className="size-9 shrink-0 cursor-pointer rounded border border-input bg-card"
              />
              <Input
                id={`theme-${key}`}
                value={theme[key]}
                disabled={pending}
                onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
          </div>
        ))}
      </div>

      <dl className="mt-5 grid gap-2 sm:grid-cols-3">
        {ratios.map(({ label, value }) => {
          const ok = value !== null && value >= 4.5
          return (
            <div key={label} className="rounded-lg border border-border p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className={cn("text-sm font-bold", ok ? "text-success-foreground" : "text-destructive")}>
                {value === null ? "—" : `${value.toFixed(2)}:1`}
                <span className="ml-1 text-xs font-normal">{ok ? t.superadmin.contrastPass : t.superadmin.contrastMin}</span>
              </dd>
            </div>
          )
        })}
      </dl>

      {!check.ok && (
        <StatusMessage className="mt-3 rounded-lg bg-destructive/10 px-3 py-2">
          {check.problems.join(". ")}
        </StatusMessage>
      )}

      <Button
        className="mt-4 bg-brand-gradient text-white hover:brightness-105"
        onClick={save}
        disabled={!check.ok}
        pending={pending}
        pendingLabel={t.common.saving}
      >
        {t.superadmin.saveColors}
      </Button>
    </div>
  )
}
