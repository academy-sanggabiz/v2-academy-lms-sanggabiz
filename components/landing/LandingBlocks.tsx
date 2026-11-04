import Link from "next/link"
import { ArrowRight, Award, GraduationCap, Layers, Star, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FeaturedCoursesCarousel } from "@/components/FeaturedCoursesCarousel"
import type { Course } from "@/lib/courses"
import type { LandingBlock } from "@/lib/landing-blocks"
import type { LandingTestimonial, PlatformTotals } from "@/lib/landing-server"
import type { Category, Instructor } from "@/lib/courses"
import { plural } from "@/lib/i18n/plural"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"

const ICON_MAP: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  layers: Layers,
  award: Award,
}

/**
 * Merender satu blok halaman depan. Markup tiap jenis blok dipindahkan apa
 * adanya dari app/page.tsx sebelumnya, supaya peralihan ke susunan blok tidak
 * sekaligus mengubah tampilannya.
 *
 * Blok yang `hidden` tidak dirender sama sekali -- bukan disembunyikan lewat
 * CSS. Elemen yang ada di DOM tetapi tak terlihat tetap terbaca pembaca layar
 * dan tetap menjadi perhentian tab.
 */
export function LandingBlocks({
  blocks,
  courses,
  testimonials,
  totals,
  categories,
  instructors,
  locale = DEFAULT_LOCALE,
}: {
  blocks: LandingBlock[]
  courses: Course[]
  testimonials: LandingTestimonial[]
  totals: PlatformTotals
  categories: { category: Category; count: number }[]
  instructors: Instructor[]
  /** Dioper dari halaman, bukan dibaca dari cookie: pratinjau /admin/landing
   *  menimpa bahasa lewat ?bahasa= dan blok harus mengikutinya. */
  locale?: Locale
}) {
  return (
    <>
      {blocks
        .filter((block) => !block.hidden)
        .map((block) => (
          <LandingBlockView
            key={block.id}
            block={block}
            courses={courses}
            testimonials={testimonials}
            totals={totals}
            categories={categories}
            instructors={instructors}
            locale={locale}
          />
        ))}
    </>
  )
}

function LandingBlockView({
  block,
  courses,
  testimonials,
  totals,
  categories,
  instructors,
  locale,
}: {
  block: LandingBlock
  courses: Course[]
  testimonials: LandingTestimonial[]
  totals: PlatformTotals
  categories: { category: Category; count: number }[]
  instructors: Instructor[]
  locale: Locale
}) {
  const t = getDictionary(locale)

  switch (block.type) {
    case "hero":
      return (
        <section className="flex flex-col items-center bg-gradient-to-b from-card to-background px-6 py-28 text-center sm:py-32">
          <h1 className="max-w-4xl text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
            {block.hero.heading} <span className="text-ring">{block.hero.highlightWord}</span>
          </h1>
          <div
            className="lesson-prose mt-7 max-w-xl text-lg text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: block.hero.subheading }}
          />
          <div className="mt-10 flex flex-wrap justify-center gap-3.5">
            <Button
              size="xl"
              className="bg-brand-gradient text-white hover:brightness-105"
              render={<Link href={block.hero.primaryCtaHref} />}
              nativeButton={false}
            >
              {block.hero.primaryCtaText}
            </Button>
            {/* Ke katalog, bukan ke halaman masuk: "Jelajahi Kursus" yang
                berujung pada formulir masuk adalah janji yang meleset, dan
                sekarang ada halaman yang benar-benar menjelajahkan. */}
            <Button size="xl" variant="outline" render={<Link href="/kelas" />} nativeButton={false}>
              {t.landing.exploreCourses}
            </Button>
          </div>
        </section>
      )

    case "courses": {
      const featured =
        block.courseIds.length > 0
          ? block.courseIds.map((id) => courses.find((c) => c.id === id)).filter((c): c is Course => !!c)
          : courses.slice(0, 4)
      if (featured.length === 0) return null
      return (
        <section className="bg-background px-6 py-24 sm:px-10">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{block.heading}</h2>
          {block.subheading && <p className="mt-3 text-center text-muted-foreground">{block.subheading}</p>}
          <div className="mt-11">
            <FeaturedCoursesCarousel courses={featured} />
          </div>
        </section>
      )
    }

    case "stats":
      return (
        <section className="bg-background px-6 py-16 sm:px-10">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">{block.heading}</h2>
          {block.subheading && (
            <p className="mt-2 text-center text-sm text-muted-foreground">{block.subheading}</p>
          )}
          <dl className="mx-auto mt-9 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { n: totals.learners, label: t.superadmin.statLearners },
              { n: totals.courses, label: t.superadmin.statCourses },
              { n: totals.enrollments, label: t.superadmin.statEnrollments },
            ].map(({ n, label }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card p-7 text-center"
              >
                <dt className="order-2 mt-1 text-sm text-muted-foreground">{label}</dt>
                <dd className="order-1 text-3xl font-bold text-ring sm:text-4xl">{n}</dd>
              </div>
            ))}
          </dl>
        </section>
      )

    case "categories": {
      // Kategori tanpa kelas terbit tidak ditampilkan: kartu yang membawa ke
      // katalog kosong adalah jalan buntu, bukan pilihan.
      if (categories.length === 0) return null
      return (
        <section className="bg-card px-6 py-20 sm:px-10">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{block.heading}</h2>
          {block.subheading && (
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">{block.subheading}</p>
          )}
          <ul className="mx-auto mt-11 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(({ category, count }) => (
              <li key={category.id}>
                <Link
                  href={`/kelas?kategori=${encodeURIComponent(category.slug)}`}
                  className="group flex h-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-float focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <span className="min-w-0">
                    <span className="block text-base font-bold group-hover:underline">{category.name}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {plural(count, t.catalog.categoryCoursesOne, t.catalog.categoryCourses)}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )
    }

    case "steps": {
      const langkah = block.items.filter((i) => i.title.trim())
      if (langkah.length === 0) return null
      return (
        <section className="bg-background px-6 py-20 sm:px-10">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{block.heading}</h2>
          {block.subheading && (
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">{block.subheading}</p>
          )}
          <ol className="mx-auto mt-11 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {langkah.map((item, i) => (
              <li key={i} className="rounded-xl border border-border bg-card p-7">
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary"
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 text-base font-bold">{item.title}</h3>
                {item.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )
    }

    case "logos": {
      const logo = block.items.filter((i) => i.name.trim())
      if (logo.length === 0) return null
      return (
        <section className="bg-card px-6 py-14 sm:px-10">
          <h2 className="text-center text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {block.heading}
          </h2>
          <ul className="mx-auto mt-7 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {logo.map((item, i) => (
              <li key={i} className="flex items-center">
                {item.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.logoUrl} alt={item.name} className="h-9 w-auto object-contain" />
                ) : (
                  <span className="text-base font-semibold text-muted-foreground">{item.name}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )
    }

    case "instructors": {
      if (instructors.length === 0) return null
      return (
        <section className="bg-background px-6 py-20 sm:px-10">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{block.heading}</h2>
          {block.subheading && (
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">{block.subheading}</p>
          )}
          <ul className="mx-auto mt-11 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {instructors.map((pengajar) => (
              <li key={pengajar.id} className="rounded-xl border border-border bg-card p-6 text-center">
                {pengajar.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pengajar.avatar_url}
                    alt=""
                    className="mx-auto size-16 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary text-xl font-bold text-primary"
                  >
                    {pengajar.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <h3 className="mt-3.5 text-base font-bold">{pengajar.name}</h3>
                {pengajar.title && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{pengajar.title}</p>
                )}
                {pengajar.bio && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{pengajar.bio}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )
    }

    case "features":
      return (
        <section className="bg-card px-6 py-24 sm:px-10">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{block.heading}</h2>
          <div className="mx-auto mt-13 grid max-w-4xl grid-cols-1 justify-center gap-6 sm:grid-cols-3">
            {block.features.map(({ icon, title, description }) => {
              const Icon = ICON_MAP[icon ?? "graduation-cap"] ?? GraduationCap
              return (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-9 text-center transition-shadow hover:shadow-float"
                >
                  <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-secondary">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <div className="mb-2.5 text-lg font-bold">{title}</div>
                  <div
                    className="lesson-prose text-sm leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </div>
              )
            })}
          </div>
        </section>
      )

    case "testimonials": {
      const shown = testimonials.slice(0, Math.max(1, block.limit))
      // Tanpa ulasan, blok ini tidak punya apa pun untuk dikatakan. Lebih baik
      // hilang daripada menampilkan bingkai kosong.
      if (shown.length === 0) return null
      return (
        <section className="bg-background px-6 py-24 sm:px-10">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{block.heading}</h2>
          {block.subheading && <p className="mt-3 text-center text-muted-foreground">{block.subheading}</p>}
          <div className="mx-auto mt-11 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {shown.map((item) => (
              <figure key={item.id} className="rounded-xl border border-border bg-card p-7">
                <div className="flex gap-0.5" aria-label={`Nilai ${item.rating} dari 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      aria-hidden
                      className={i < item.rating ? "size-4 fill-current text-amber-500" : "size-4 text-input"}
                    />
                  ))}
                </div>
                <blockquote className="mt-3.5 text-sm leading-relaxed text-muted-foreground">
                  {item.comment}
                </blockquote>
                {/*
                  Hanya nama depan. Ulasan di halaman publik tidak boleh membuat
                  seseorang bisa ditemukan; nama lengkap bersama judul kursusnya
                  sudah cukup untuk itu.
                */}
                <figcaption className="mt-4 text-sm font-semibold">{item.firstName}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )
    }

    case "faq": {
      const items = block.items.filter((item) => item.question.trim())
      if (items.length === 0) return null
      return (
        <section className="bg-card px-6 py-24 sm:px-10">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{block.heading}</h2>
          <div className="mx-auto mt-11 max-w-2xl divide-y divide-border">
            {items.map((item) => (
              <details key={item.question} className="py-5">
                {/* <details>/<summary> asli: sudah bisa dibuka dengan papan
                    ketik dan keadaannya sudah diumumkan, tanpa satu baris
                    JavaScript pun. */}
                <summary className="cursor-pointer rounded-md text-base font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
                  {item.question}
                </summary>
                <div
                  className="lesson-prose mt-3 text-sm leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: item.answer }}
                />
              </details>
            ))}
          </div>
        </section>
      )
    }

    case "cta":
      return (
        <section className="bg-gradient-to-b from-card to-background px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{block.heading}</h2>
          <p className="mx-auto mt-3.5 max-w-lg text-muted-foreground">{block.subheading}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3.5">
            <Button
              size="xl"
              className="bg-brand-gradient text-white hover:brightness-105"
              render={<Link href={block.primaryHref} />}
              nativeButton={false}
            >
              {block.primaryText}
            </Button>
            <Button size="xl" variant="outline" render={<Link href={block.secondaryHref} />} nativeButton={false}>
              {block.secondaryText}
            </Button>
          </div>
        </section>
      )
  }
}
