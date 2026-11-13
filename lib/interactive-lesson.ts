/**
 * Materi interaktif: tetapan dan tipe yang aman dipakai di peramban.
 *
 * Dipisah dari `lib/sanitize-interactive.ts` dengan alasan yang sama seperti
 * `lib/courses.ts` dipisah dari `lib/courses-server.ts`: penyunting dan pemutar
 * adalah Client Component, dan menariknya ke modul yang mengimpor `postcss`
 * akan menyeret pengurai CSS ke dalam bundel peramban setiap peserta.
 *
 * Standarnya: `docs/STANDAR-MATERI-INTERAKTIF.md`.
 */

/**
 * Kelas pembungkus materi. Dipakai di DUA tempat yang harus selalu sama:
 * selector CSS penulis diberi awalan ini di server, dan pemutar memasang kelas
 * ini pada pembungkusnya. Kalau keduanya berbeda, seluruh gaya penulis tidak
 * berlaku dan materinya tampil polos tanpa ada yang memberi tahu.
 */
export const KELAS_MATERI = "materi-interaktif"

/** Batas ukuran berkas. */
export const BATAS_BERKAS = 512 * 1024

/**
 * Hasil pembersihan yang ditunjukkan ke penyusun.
 *
 * `dibuang` bukan hiasan. `sanitize-html` membuang apa pun di luar daftar izin
 * **diam-diam**: penyusun mengira materinya utuh padahal separuhnya lenyap.
 * Daftar ini yang membuat kehilangan itu terlihat sebelum disimpan.
 */
export type HasilBersih = {
  html: string
  dibuang: string[]
  peringatan: string[]
}
