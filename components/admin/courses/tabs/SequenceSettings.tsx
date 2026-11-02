"use client"

import { Switch } from "@/components/ui/switch"
import { useCourseDraft } from "../CourseDraftContext"

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

  return (
    <section className="space-y-3">
      <h3 className="text-xl font-bold">Urutan Belajar</h3>
      <div className="flex items-start justify-between gap-5">
        <div>
          <div className="text-sm font-medium">Harus berurutan</div>
          <div className="text-xs text-muted-foreground">
            Pelajaran berikutnya baru terbuka setelah yang sebelumnya tuntas. Dimatikan berarti
            peserta bebas memilih pelajaran mana pun, seperti kebanyakan kursus daring.
          </div>
        </div>
        <Switch
          aria-label="Harus berurutan"
          checked={draft.sequential}
          onCheckedChange={(checked) => dispatch({ type: "setField", patch: { sequential: checked } })}
        />
      </div>

      {draft.sequential && (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Pelajaran kuis baru dianggap tuntas setelah peserta <strong>lulus</strong>, bukan sekadar
          mencentangnya. Peserta yang sedang berjalan di kursus ini akan ikut terkunci pada
          pelajaran yang belum mereka tuntaskan.
        </p>
      )}
    </section>
  )
}
