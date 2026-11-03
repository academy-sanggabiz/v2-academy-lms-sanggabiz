"use client"

import { Switch } from "@/components/ui/switch"
import { useCourseDraft } from "../CourseDraftContext"
import { useI18n } from "@/components/i18n/LocaleProvider"

/**
 * Urutan belajar: bebas atau berurutan.
 *
 * Bawaannya bebas, dan itu bukan sekadar pilihan bawaan yang malas: seluruh
 * kursus yang sudah berjalan memakai perilaku itu, dan menyalakan urutan wajib
 * pada kursus yang sedang diikuti orang akan mengunci mereka di tengah jalan —
 * pada pelajaran yang kemarin boleh dilewati.
 *
 * "Tuntas" untuk pelajaran kuis berarti **lulus**, bukan dicentang. Tanpa
 * perbedaan itu, peserta bisa melompati seluruh kuis dengan mencentangnya di
 * sidebar, dan urutan wajib kehilangan seluruh artinya (lib/lesson-access.ts).
 */
export function SequenceSettings() {
  const { draft, dispatch } = useCourseDraft()
  const { t } = useI18n()

  return (
    <section className="space-y-3">
      <h3 className="text-xl font-bold">{t.editor.seqTitle}</h3>
      <div className="flex items-start justify-between gap-5">
        <div>
          <div className="text-sm font-medium">{t.editor.seqLabel}</div>
          <div className="text-xs text-muted-foreground">
            {t.editor.seqDesc}
          </div>
        </div>
        <Switch
          aria-label={t.editor.seqLabel}
          checked={draft.sequential}
          onCheckedChange={(checked) => dispatch({ type: "setField", patch: { sequential: checked } })}
        />
      </div>

      {draft.sequential && (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {t.editor.seqNotePrefix} <strong>{t.editor.seqNoteStrong}</strong>
          {t.editor.seqNoteSuffix}
        </p>
      )}
    </section>
  )
}
