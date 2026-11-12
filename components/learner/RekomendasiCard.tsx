import Link from "next/link"

import { getTranslations } from "@/lib/i18n/server"
import type { Rekomendasi } from "@/lib/rekomendasi"

/**
 * Kartu "Mungkin cocok untuk Anda" di dasbor peserta.
 *
 * Berdampingan dengan kartu "Untuk jabatan Anda", tidak menggantikannya:
 * yang itu kewajiban dari organisasi, yang ini saran dari riwayat sendiri.
 * Keduanya tidak dirender sama sekali bila kosong -- kartu kosong berbunyi
 * seperti fitur yang rusak.
 *
 * Tiap kartu membawa alasannya. Rekomendasi tanpa alasan dicatat
 * docs/STANDAR-DIGITAL-LEARNING.md sebagai anti-pattern, dan di sini
 * alasannya datang jadi dari server, bukan dirakit ulang di komponen.
 */
export async function RekomendasiCard({ items }: { items: Rekomendasi[] }) {
  if (items.length === 0) return null
  const { t } = await getTranslations()

  const alasan = (r: Rekomendasi) =>
    r.alasan === "kategori" && r.pemicu
      ? t.rekomendasi.becauseCategory.replace("{kursus}", r.pemicu)
      : r.alasan === "tingkat"
        ? t.rekomendasi.becauseLevel
        : t.rekomendasi.becausePopular

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-bold">{t.rekomendasi.title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{t.rekomendasi.subtitle}</p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <li key={r.id} className="flex min-w-0 flex-col rounded-xl border border-border p-3.5">
            <span className="text-sm font-semibold break-words">{r.title}</span>
            <span className="mt-1 text-xs text-muted-foreground">{alasan(r)}</span>
            {r.lessonCount > 0 && (
              <span className="mt-0.5 text-xs text-muted-foreground">
                {t.rekomendasi.lessons.replace("{n}", String(r.lessonCount))}
              </span>
            )}
            <Link
              href={`/learner/courses/${r.id}`}
              className="mt-2.5 text-sm font-semibold text-ring underline underline-offset-4"
            >
              {t.rekomendasi.open}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
