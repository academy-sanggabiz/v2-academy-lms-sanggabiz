"use client"

import { useTransition } from "react"
import { Settings2 } from "lucide-react"

import { setDisplayPreferences } from "@/app/display-actions"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DisplayPreferences } from "@/lib/preferences/display"
import { cn } from "@/lib/utils"

/**
 * Panel preferensi tampilan.
 *
 * **Sengaja bukan widget aksesibilitas mengambang.** Riset yang mendasari
 * keputusan itu ada di docs/STANDAR-AKSESIBILITAS-PREFERENSI.md; ringkasnya,
 * overlay semacam itu dinilai merugikan oleh komunitas aksesibilitas dan tidak
 * memperbaiki hambatan apa pun di bawahnya. Yang ini duduk di deretan
 * preferensi biasa, bersebelahan dengan pemilih bahasa, karena memang itu
 * sifatnya: pilihan tampilan, bukan alat bantu yang menjanjikan sesuatu.
 *
 * Tiap pilihan punya keadaan "Ikut perangkat" dan itulah bawaannya, sehingga
 * pengaturan sistem pengguna tidak pernah ditimpa tanpa ia minta.
 */
export function DisplaySettings({
  preferences,
  className,
}: {
  preferences: DisplayPreferences
  className?: string
}) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()

  function update(next: Partial<DisplayPreferences>) {
    startTransition(async () => {
      await setDisplayPreferences(next)
    })
  }

  const groups = [
    {
      label: t.display.textSize,
      value: preferences.textSize,
      options: [
        { value: "device", label: t.display.textSizeDevice },
        { value: "large", label: t.display.textSizeLarge },
        { value: "larger", label: t.display.textSizeLarger },
      ],
      apply: (value: string) => update({ textSize: value as DisplayPreferences["textSize"] }),
    },
    {
      label: t.display.contrast,
      value: preferences.contrast,
      options: [
        { value: "device", label: t.display.contrastDevice },
        { value: "high", label: t.display.contrastHigh },
      ],
      apply: (value: string) => update({ contrast: value as DisplayPreferences["contrast"] }),
    },
    {
      label: t.display.motion,
      value: preferences.motion,
      options: [
        { value: "device", label: t.display.motionDevice },
        { value: "reduced", label: t.display.motionReduced },
      ],
      apply: (value: string) => update({ motion: value as DisplayPreferences["motion"] }),
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={t.display.openPanel}
            className={cn("gap-1.5", className)}
          >
            <Settings2 className="size-4" aria-hidden />
            <span className="hidden lg:inline">{t.display.title}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-72 p-4">
        <p className="mb-3 text-xs text-muted-foreground">{t.display.intro}</p>

        {groups.map((group) => (
          <fieldset key={group.label} className="mb-3.5">
            <legend className="mb-1.5 text-sm font-semibold">{group.label}</legend>
            {/*
              Sekelompok tombol ber-aria-pressed, bukan radio tersembunyi:
              perubahannya berlaku seketika, jadi tidak ada "kirim" yang perlu
              dikelompokkan, dan keadaan aktifnya tetap terbaca pembaca layar.
            */}
            <div className="flex flex-wrap gap-1.5">
              {group.options.map((option) => {
                const active = option.value === group.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    disabled={pending}
                    onClick={() => !active && group.apply(option.value)}
                    className={cn(
                      "min-h-8 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
                      active
                        ? "border-ring bg-secondary text-primary"
                        : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
                      pending && "opacity-60"
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}

        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {t.display.deviceHint} {t.display.browserZoomHint}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
