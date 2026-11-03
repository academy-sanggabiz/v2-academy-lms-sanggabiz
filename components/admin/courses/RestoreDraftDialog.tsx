"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useI18n } from "@/components/i18n/LocaleProvider"
import type { Dictionary } from "@/lib/i18n/dictionaries"

function relativeTime(ms: number, t: Dictionary): string {
  const diffMinutes = Math.round((Date.now() - ms) / 60_000)
  if (diffMinutes < 1) return t.editor.justNow
  if (diffMinutes < 60) return t.editor.minutesAgo.replace("{n}", String(diffMinutes))
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return t.editor.hoursAgo.replace("{n}", String(diffHours))
  return t.editor.daysAgo.replace("{n}", String(Math.round(diffHours / 24)))
}

// No onOpenChange -- deliberately not light-dismissable. The admin must
// pick Restore or Discard rather than losing the choice to a stray Escape.
export function RestoreDraftDialog({
  updatedAt,
  isStale,
  onRestore,
  onDiscard,
}: {
  updatedAt: number
  isStale: boolean
  onRestore: () => void
  onDiscard: () => void
}) {
  const { t } = useI18n()
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.editor.restoreTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.editor.restoreDesc.replace("{waktu}", relativeTime(updatedAt, t))}
            {isStale && (
              <span className="mt-2 block">
                {t.editor.restoreStale}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>{t.editor.discard}</AlertDialogCancel>
          <AlertDialogAction onClick={onRestore}>{t.editor.restore}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
