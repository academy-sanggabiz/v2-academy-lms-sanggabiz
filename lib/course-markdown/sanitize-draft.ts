import "server-only"

import { bersihkanMateriInteraktif } from "@/lib/sanitize-interactive"
import type { ParsedCourse } from "@/lib/course-markdown"

/**
 * Membersihkan materi interaktif di dalam draf hasil impor.
 *
 * Dipisah dari `lib/course-markdown/index.ts` karena berkas itu ikut terbundel
 * ke peramban (dialog impor memanggil `courseToMarkdown` dari Client
 * Component). Pembersih interaktif mengimpor postcss; menaruhnya di sana
 * berarti setiap pengelola mengunduh pengurai CSS hanya untuk membuka satu
 * dialog.
 *
 * Dijalankan SEBELUM draf dikirim ke peramban, bukan sesudah. Draf impor
 * dirender penyunting lewat `dangerouslySetInnerHTML` pada pratinjau materi
 * interaktif -- berkas `.md` nakal yang membawa `<script>` di dalam blok
 * html-nya akan berjalan di peramban pengelola sebelum apa pun disimpan.
 *
 * Mengembalikan daftar peringatan supaya yang dibuang tetap terlihat penyusun,
 * sama seperti saat mengunggah berkas langsung.
 */
export function bersihkanDrafInteraktif(parsed: ParsedCourse): ParsedCourse {
  const peringatan: string[] = []

  for (const section of parsed.draft.sections) {
    for (const lesson of section.lessons) {
      if (lesson.content_type !== "interactive" || !lesson.content) continue
      const hasil = bersihkanMateriInteraktif(lesson.content)
      lesson.content = hasil.html || null
      if (hasil.dibuang.length > 0) {
        peringatan.push(
          `Materi interaktif "${lesson.title}": ${hasil.dibuang.join(", ")} dibuang saat dibersihkan.`
        )
      }
      for (const p of hasil.peringatan) peringatan.push(`Materi interaktif "${lesson.title}": ${p}`)
    }
  }

  return { ...parsed, report: { ...parsed.report, warnings: [...parsed.report.warnings, ...peringatan] } }
}
