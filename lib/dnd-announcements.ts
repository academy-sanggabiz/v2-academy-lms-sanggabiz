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
type Entity = { id: string | number; data: { current?: { title?: string } } }

export function dndAnnouncements(noun: string) {
  const name = (item: { data: { current?: { title?: string } } } | null) =>
    item?.data.current?.title ?? ""

  return {
    announcements: {
      onDragStart({ active }: { active: Entity }) {
        return `Mengangkat ${noun} ${name(active)}. Pakai panah atas dan bawah untuk memindahkan, spasi untuk menjatuhkan, Escape untuk membatalkan.`
      },
      onDragOver({ active, over }: { active: Entity; over: Entity | null }) {
        if (!over) return undefined
        return `${noun} ${name(active)} berada di atas ${name(over) || "posisi baru"}.`
      },
      onDragEnd({ active, over }: { active: Entity; over: Entity | null }) {
        if (!over) return `${noun} ${name(active)} dikembalikan ke posisi semula.`
        return `${noun} ${name(active)} dijatuhkan di ${name(over) || "posisi baru"}.`
      },
      onDragCancel({ active }: { active: Entity }) {
        return `Pemindahan dibatalkan. ${noun} ${name(active)} kembali ke posisi semula.`
      },
    },
    screenReaderInstructions: {
      draggable: `Tekan spasi atau Enter untuk mulai memindahkan ${noun} ini. Lalu pakai panah atas dan bawah untuk memilih posisi, spasi untuk menjatuhkan, dan Escape untuk membatalkan.`,
    },
  }
}
