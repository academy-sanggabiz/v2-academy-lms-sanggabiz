"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n/LocaleProvider"

// Typical silent reading speed for instructional text; deliberately on the
// slow side because learners also study figures and re-read key sentences.
const WORDS_PER_MINUTE = 180

function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim()
  return text ? text.split(/\s+/).length : 0
}

/**
 * Live authoring guidance under a text lesson (docs/STANDAR-DIGITAL-LEARNING.md
 * §4): estimated reading time against the 5-7 minute, one-goal unit size,
 * plus the content checklist every lesson should pass. Advice only -- it
 * never blocks saving.
 */
export function LessonWritingGuide({
  html,
  onUseAsDuration,
}: {
  html: string
  onUseAsDuration: (minutes: number) => void
}) {
  const { t } = useI18n()
  const words = countWords(html)
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE))
  const tooLong = words > 0 && minutes > 10

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground" aria-live="polite">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="font-semibold text-foreground">
          {t.editor.guideWordCount
            .replace("{kata}", String(words))
            .replace("{menit}", String(words === 0 ? 0 : minutes))}
        </span>
        <span className={cn(tooLong && "font-semibold text-destructive")}>
          {tooLong ? t.editor.guideTooLong : t.editor.guideTarget}
        </span>
        {words > 0 && (
          <Button type="button" variant="outline" size="xs" onClick={() => onUseAsDuration(minutes)}>
            {t.editor.guideUseDuration.replace("{n}", String(minutes))}
          </Button>
        )}
      </div>
      <ul className="mt-2 list-disc space-y-0.5 pl-4">
        <li>{t.editor.guideTip1}</li>
        <li>{t.editor.guideTip2}</li>
        <li>{t.editor.guideTip3}</li>
        <li>{t.editor.guideTip4}</li>
        <li>{t.editor.guideTip5}</li>
      </ul>
    </div>
  )
}
