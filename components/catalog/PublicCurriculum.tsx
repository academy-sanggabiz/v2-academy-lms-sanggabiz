import { FileText, HelpCircle, Lock, Presentation, Video, type LucideIcon } from "lucide-react"

import { getDictionary } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"
import type { CourseSection, LessonContentType } from "@/lib/courses"
import { plural } from "@/lib/i18n/plural"

const IKON: Record<LessonContentType, LucideIcon> = {
  video: Video,
  text: FileText,
  quiz: HelpCircle,
  mixed: FileText,
  ppt: Presentation,
}

/**
 * Kurikulum untuk pengunjung yang belum mendaftar.
 *
 * Yang ditampilkan hanya yang memang terbuka di basis data lewat view
 * `lessons_public`: judul pelajaran, jenisnya, dan perkiraan durasinya. Isi
 * pelajaran, berkas, dan soal kuis tidak pernah sampai ke sini -- RLS yang
 * menahannya, bukan komponen ini, jadi tidak ada cara menampilkannya tidak
 * sengaja.
 *
 * Judulnya sengaja dibuka. Justru daftar inilah yang dipakai orang untuk
 * menilai apakah sebuah kelas sesuai kebutuhannya, dan menyembunyikannya
 * berarti meminta orang mendaftar untuk sesuatu yang belum bisa mereka nilai.
 * Gemboknya ada pada isinya, bukan pada daftarnya.
 *
 * `<details>` bawaan peramban, bukan buka-tutup buatan sendiri: ia sudah bisa
 * dipakai papan ketik, sudah diumumkan pembaca layar sebagai bisa dibuka, dan
 * tetap bekerja sebelum JavaScript termuat.
 */
export function PublicCurriculum({
  sections,
  locale,
}: {
  sections: CourseSection[]
  locale: Locale
}) {
  const t = getDictionary(locale)
  const berisi = sections.filter((s) => s.lessons.length > 0)
  if (berisi.length === 0) return null

  const labelJenis: Record<LessonContentType, string> = {
    video: t.catalog.typeVideo,
    text: t.catalog.typeText,
    quiz: t.catalog.typeQuiz,
    mixed: t.catalog.typeText,
    ppt: t.catalog.typeSlides,
  }

  return (
    <div className="flex flex-col gap-2.5">
      {berisi.map((section, i) => (
        <details
          key={section.id}
          // Modul pertama terbuka: daftar yang seluruhnya tertutup memaksa
          // orang menebak isinya sebelum mau mengkliknya.
          open={i === 0}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3.5 text-sm font-semibold">
            <span className="min-w-0">{section.title}</span>
            <span className="shrink-0 text-xs font-normal text-muted-foreground">
              {plural(section.lessons.length, t.catalog.moduleLessonsOne, t.catalog.moduleLessons)}
            </span>
          </summary>
          <ul className="flex flex-col divide-y divide-border border-t border-border">
            {section.lessons.map((lesson) => {
              const Icon = IKON[lesson.content_type] ?? FileText
              const menit = lesson.duration_seconds
                ? Math.max(1, Math.round(lesson.duration_seconds / 60))
                : null
              return (
                <li key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">{lesson.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {labelJenis[lesson.content_type]}
                    {menit !== null && ` · ${t.catalog.minutes.replace("{n}", String(menit))}`}
                  </span>
                  {/* Gembok menerangkan kenapa judulnya terlihat tetapi isinya
                      belum -- tanpa itu, daftar ini mudah terbaca sebagai
                      tautan yang rusak. */}
                  <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </li>
              )
            })}
          </ul>
        </details>
      ))}
    </div>
  )
}
