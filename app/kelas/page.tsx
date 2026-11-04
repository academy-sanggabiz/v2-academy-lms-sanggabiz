import type { Metadata } from "next"
import { BookOpen } from "lucide-react"

import { getCatalogCourses, type CatalogFilters, type CatalogSort } from "@/lib/catalog-server"
import { getLandingTheme } from "@/lib/landing-server"
import { themeStyle } from "@/lib/landing-theme"
import { getTranslations } from "@/lib/i18n/server"
import { isCourseLevel } from "@/lib/course-level"
import { PublicHeader } from "@/components/public/PublicHeader"
import { PublicFooter } from "@/components/public/PublicFooter"
import { CatalogFilters as CatalogFilterBar } from "@/components/catalog/CatalogFilters"
import { CatalogCard } from "@/components/catalog/CatalogCard"
import { plural } from "@/lib/i18n/plural"

export const metadata: Metadata = {
  title: "Kelas",
}

/** Hanya nilai yang dikenali yang diteruskan; sisanya dianggap tidak ada. */
function bacaSaringan(raw: {
  cari?: string
  tingkat?: string
  akses?: string
  durasi?: string
  urut?: string
}): CatalogFilters {
  const akses = raw.akses === "gratis" || raw.akses === "berbayar" ? raw.akses : null
  const durasi =
    raw.durasi === "pendek" || raw.durasi === "sedang" || raw.durasi === "panjang" ? raw.durasi : null
  const urutValid: CatalogSort[] = ["terbaru", "judul", "tersingkat", "terpanjang"]
  const sort = urutValid.includes(raw.urut as CatalogSort) ? (raw.urut as CatalogSort) : "terbaru"

  return {
    q: raw.cari ?? "",
    level: isCourseLevel(raw.tingkat) ? raw.tingkat : null,
    akses,
    durasi,
    sort,
  }
}

/**
 * Katalog kelas yang terbuka untuk siapa saja, tanpa akun.
 *
 * Alasannya sederhana: orang tidak mendaftar ke sesuatu yang tidak bisa
 * mereka lihat. Sebelum halaman ini ada, satu-satunya cara mengetahui isi
 * sebuah kelas adalah membuat akun dulu -- dan itu meminta kepercayaan
 * sebelum memberi alasan untuk percaya.
 *
 * Yang tetap tertutup: isi pelajaran, berkas, dan soal kuis. Judul pelajaran
 * sengaja terbuka (view `lessons_public`), karena justru daftar itulah yang
 * dipakai orang untuk menilai apakah sebuah kelas sesuai kebutuhannya.
 */
export default async function KatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    cari?: string
    tingkat?: string
    akses?: string
    durasi?: string
    urut?: string
  }>
}) {
  const raw = await searchParams
  const filters = bacaSaringan(raw)

  const [{ courses, facets }, { locale, t }, theme] = await Promise.all([
    getCatalogCourses(filters),
    getTranslations(),
    getLandingTheme(),
  ])

  const disaring = courses.length !== facets.total

  return (
    <div className="min-h-screen bg-background" style={themeStyle(theme)}>
      <PublicHeader locale={locale} active="kelas" />

      <main id="main-content" tabIndex={-1} className="outline-none">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-8 sm:py-14">
          <div className="mb-8 max-w-2xl">
            <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              {t.catalog.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t.catalog.subtitle}
            </p>
          </div>

          <div className="mb-6">
            <CatalogFilterBar facets={facets} />
          </div>

          {facets.total === 0 ? (
            <EmptyState title={t.catalog.emptyCatalog} hint={t.catalog.emptyCatalogHint} />
          ) : courses.length === 0 ? (
            <EmptyState title={t.catalog.noResults} hint={t.catalog.noResultsHint} />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {disaring
                  ? t.catalog.resultCountFiltered
                      .replace("{n}", String(courses.length))
                      .replace("{total}", String(facets.total))
                  : plural(courses.length, t.catalog.resultCountOne, t.catalog.resultCount)}
              </p>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CatalogCard key={course.id} course={course} locale={locale} />
                ))}
              </ul>
            </>
          )}
        </div>
      </main>

      <PublicFooter locale={locale} />
    </div>
  )
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
      <BookOpen className="size-7 text-muted-foreground" aria-hidden />
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>
    </div>
  )
}
