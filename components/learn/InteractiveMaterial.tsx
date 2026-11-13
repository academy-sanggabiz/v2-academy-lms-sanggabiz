import { KELAS_MATERI } from "@/lib/interactive-lesson"

/**
 * Pembungkus tempat materi digambar -- dipakai penyunting DAN pemutar.
 *
 * Satu komponen untuk keduanya supaya pratinjau admin tidak bisa berbeda dari
 * yang dilihat peserta. Dua hal di sini wajib ada bersama:
 *
 * - kelas `materi-interaktif`, yang harus sama persis dengan awalan yang
 *   dipasang pembersih pada setiap selector CSS penulis;
 * - `contain: layout style`, yang membuat `position: fixed` milik penulis
 *   berhenti di kotak ini. Tanpa itu, CSS penulis TANPA satu pun tag berbahaya
 *   terukur menutupi seluruh header LMS termasuk tombol Keluar (13 Nov 2026).
 *   Pembersih sudah membuang `fixed`, ini lapis keduanya.
 *
 * `.lesson-prose` ikut dipasang supaya materi yang tidak membawa CSS sendiri
 * tetap terbaca; CSS penulis tetap menang karena disisipkan belakangan.
 *
 * `isolation: isolate` menahan `z-index` penulis supaya tidak naik ke atas
 * menu, dan `overflow-x: auto` membuat materi yang terlalu lebar menggulung di
 * dalam kotaknya sendiri, bukan membuat seluruh halaman melebar di layar 320px
 * (WCAG 1.4.10).
 */
export function InteractiveMaterial({ html }: { html: string }) {
  return (
    <div
      className={`${KELAS_MATERI} lesson-prose`}
      style={{ contain: "layout style", isolation: "isolate", overflowX: "auto" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
