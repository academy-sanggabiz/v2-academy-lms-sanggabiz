/**
 * Pengumuman seret-lepas untuk pembaca layar.
 *
 * Dibuat sebagai pabrik bernoun karena pengumumannya harus menyebut benda yang
 * benar. Versi pertama menyebut "pelajaran" untuk apa pun yang digeser, jadi
 * saat modul atau soal dipindahkan, pengguna pembaca layar mendengar kalimat
 * yang keliru tentang apa yang sedang ia pegang.
 *
 * `title` diambil dari `data.current.title` yang dipasang pada tiap sortable;
 * tanpa itu pengumumannya hanya berisi id yang tidak berarti apa pun bagi
 * yang mendengarkan.
 */
import type { Dictionary } from "@/lib/i18n/dictionaries"

type Entity = { id: string | number; data: { current?: { title?: string } } }

export function dndAnnouncements(noun: string, t: Dictionary) {
  const name = (item: { data: { current?: { title?: string } } } | null) =>
    item?.data.current?.title ?? ""
  const isi = (kalimat: string, judul: string, tujuan = "") =>
    kalimat.replace("{noun}", noun).replace("{judul}", judul).replace("{tujuan}", tujuan)

  return {
    announcements: {
      onDragStart({ active }: { active: Entity }) {
        return isi(t.editor.dndStart, name(active))
      },
      onDragOver({ active, over }: { active: Entity; over: Entity | null }) {
        if (!over) return undefined
        return isi(t.editor.dndOver, name(active), name(over) || t.editor.dndNewPosition)
      },
      onDragEnd({ active, over }: { active: Entity; over: Entity | null }) {
        if (!over) return isi(t.editor.dndEndReturn, name(active))
        return isi(t.editor.dndEnd, name(active), name(over) || t.editor.dndNewPosition)
      },
      onDragCancel({ active }: { active: Entity }) {
        return isi(t.editor.dndCancel, name(active))
      },
    },
    screenReaderInstructions: {
      draggable: isi(t.editor.dndInstructions, ""),
    },
  }
}
