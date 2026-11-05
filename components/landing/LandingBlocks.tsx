import Link from "next/link"
import { ArrowRight, Award, ExternalLink, GraduationCap, Layers, Star, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FeaturedCoursesCarousel } from "@/components/FeaturedCoursesCarousel"
import type { LandingBlock } from "@/lib/landing-blocks"
import type { LandingTestimonial, PlatformTotals } from "@/lib/landing"
import type { Category, CourseCardData, Instructor } from "@/lib/courses"
import { plural } from "@/lib/i18n/plural"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"
import { FloatingWhatsApp } from "@/components/landing/FloatingWhatsApp"
import { LogoMarquee } from "@/components/landing/LogoMarquee"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  layers: Layers,
  award: Award,
}

/**
 * Tata letak halaman depan mengikuti docs/STANDAR-HALAMAN-DEPAN.md: tiap
 * bagian punya bentuknya sendiri (hero dua kolom, dinding logo, kartu alumni
 * berfoto, mozaik galeri, angka besar, CTA dua kolom), judul bagian kapital
 * rata tengah, lebar isi 1352px -- grammar yang diukur dari RevoU, dengan
 * warna dari token kita.
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
  courses: CourseCardData[]
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

/** Lebar isi dan padding samping yang sama untuk semua bagian. */
const CONTAINER = "mx-auto w-full max-w-[1352px] px-6 sm:px-10"

/** Judul bagian: kapital, tebal, rata tengah -- satu bentuk untuk semua. */
function SectionHeading({
  heading,
  subheading,
  align = "center",
  as: Tag = "h2",
  className,
  onDark,
}: {
  heading: string
  subheading?: string
  align?: "center" | "left"
  as?: "h2" | "h3"
  className?: string
  /** Di bidang gelap, `text-muted-foreground` nyaris hilang. */
  onDark?: boolean
}) {
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left", className)}>
      <Tag className="font-display text-3xl font-bold tracking-tight uppercase sm:text-4xl">
        {heading}
      </Tag>
      {subheading ? (
        <p
          className={cn(
            "mt-3 max-w-2xl text-base sm:text-lg",
            onDark ? "text-background/80" : "text-muted-foreground",
            align === "center" && "mx-auto"
          )}
        >
          {subheading}
        </p>
      ) : null}
    </div>
  )
}

function Avatar({ src, name, size = "size-16" }: { src?: string | null; name: string; size?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={cn(size, "shrink-0 rounded-full object-cover")} />
  ) : (
    <span
      aria-hidden
      className={cn(
        size,
        "flex shrink-0 items-center justify-center rounded-full bg-secondary text-xl font-bold text-primary"
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

/**
 * Satu blok halaman depan.
 *
 * Diekspor supaya pratinjau langsung di /admin/landing memakai perender yang
 * sama persis dengan halaman publiknya. Tiruan terpisah akan berbeda dari
 * aslinya begitu salah satunya diubah, dan pratinjau yang berbohong lebih
 * buruk daripada tidak ada pratinjau.
 */
export function LandingBlockView({
  block,
  courses,
  testimonials,
  totals,
  categories,
  instructors,
  locale,
}: {
  block: LandingBlock
  courses: CourseCardData[]
  testimonials: LandingTestimonial[]
  totals: PlatformTotals
  categories: { category: Category; count: number }[]
  instructors: Instructor[]
  locale: Locale
}) {
  const t = getDictionary(locale)

  switch (block.type) {
    case "hero": {
      const { hero } = block
      const badges = (hero.trustBadges ?? []).filter((b) => b.label.trim() || b.logoUrl)
      const twoColumn = !!hero.imageUrl
      return (
        <section className="relative overflow-hidden bg-gradient-to-b from-secondary via-secondary/50 to-background">
          {/* Kisi samar, bukan bidang polos. Lihat .landing-grid di globals.css. */}
          <div aria-hidden className="landing-grid pointer-events-none absolute inset-0" />
          <div
            className={cn(
              CONTAINER,
              "relative grid items-center gap-12 py-20 sm:py-28",
              twoColumn ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" : "text-center"
            )}
          >
            {/*
              `min-w-0`: butir grid bawaannya `min-width: auto`, jadi satu kata
              panjang di judul melebarkan jalurnya melewati layar alih-alih
              membungkus. Di 320px itu membuat halaman depan meluber sampai
              373px -- gagal WCAG 1.4.10 (gerbang reflow a11y-audit).
            */}
            <div className={cn("min-w-0", !twoColumn && "mx-auto flex max-w-4xl flex-col items-center")}>
              {/*
                36px di layar terkecil, bukan 48px: "KETERAMPILAN" pada 48px
                saja sudah lebih lebar dari 320px dikurangi tepinya.
                `break-words` jaring pengamannya, untuk kata panjang apa pun
                yang diketik pemilik nanti.
              */}
              <h1 className="font-display text-4xl leading-[1.02] font-bold tracking-tight break-words uppercase sm:text-5xl lg:text-7xl">
                {hero.heading} <span className="text-ring">{hero.highlightWord}</span>
              </h1>
              <div
                className="lesson-prose mt-7 max-w-xl text-lg text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: hero.subheading }}
              />
              <div className={cn("mt-10 flex flex-wrap gap-3.5", !twoColumn && "justify-center")}>
                <Button
                  size="xl"
                  className="rounded-full bg-brand-gradient px-8 text-white hover:brightness-105"
                  render={<Link href={hero.primaryCtaHref} />}
                  nativeButton={false}
                >
                  {hero.primaryCtaText}
                </Button>
                {/* Ke katalog, bukan ke halaman masuk: "Jelajahi Kursus" yang
                    berujung pada formulir masuk adalah janji yang meleset. */}
                <Button
                  size="xl"
                  variant="outline"
                  className="rounded-full px-8"
                  render={<Link href="/kelas" />}
                  nativeButton={false}
                >
                  {t.landing.exploreCourses}
                </Button>
              </div>

              {/* Pita kepercayaan: bukti sebelum janji (STANDAR-HALAMAN-DEPAN §1.1). */}
              {(hero.trustText || badges.length > 0) && (
                <div
                  className={cn(
                    "mt-10 flex flex-wrap items-center gap-x-8 gap-y-4",
                    !twoColumn && "justify-center"
                  )}
                >
                  {hero.trustText && (
                    <p className="text-sm font-semibold text-foreground">{hero.trustText}</p>
                  )}
                  {badges.length > 0 && (
                    <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      {badges.map((b, i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          {b.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.logoUrl} alt={b.label} className="h-6 w-auto object-contain" />
                          ) : (
                            <span className="text-sm font-semibold">{b.label}</span>
                          )}
                          {b.score && (
                            <span className="flex items-center gap-1 text-sm font-bold">
                              <Star aria-hidden className="size-3.5 fill-current text-amber-500" />
                              {b.score}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {twoColumn && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hero.imageUrl}
                  alt=""
                  className="aspect-[4/5] w-full rounded-3xl object-cover shadow-float sm:aspect-square lg:aspect-[4/5]"
                />
              </div>
            )}
          </div>
        </section>
      )
    }

    case "logos": {
      const logo = block.items.filter((i) => i.name.trim() || i.logoUrl)
      if (logo.length === 0) return null
      const variant = block.variant ?? "wall"
      const wall = variant === "wall"
      return (
        <section className="border-y border-border bg-card">
          <div className={cn(CONTAINER, wall ? "py-20" : "py-12")}>
            {wall ? (
              <SectionHeading heading={block.heading} subheading={block.subheading} />
            ) : (
              <h2 className="font-display text-center text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                {block.heading}
              </h2>
            )}

            {variant === "marquee" ? (
              /*
                Baris berjalan: dipakai saat logonya lebih banyak daripada yang
                muat sekali lihat. Lebarnya menembus `CONTAINER` dengan
                margin negatif supaya logo masuk dan keluar dari tepi layar,
                bukan dari tepi kolom yang berhenti di tengah.
              */
              <LogoMarquee items={logo} className="mt-10 -mx-6 sm:-mx-10" />
            ) : wall ? (
              /* Dinding logo: ubin ber-grid, angka di tiap ubin -- bukti yang bisa dihitung. */
              <ul className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {logo.map((item, i) => (
                  <li
                    key={i}
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-background px-4 py-6"
                  >
                    {item.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.logoUrl} alt={item.name} className="h-10 w-full max-w-[140px] object-contain" />
                    ) : (
                      <span className="text-base font-bold">{item.name}</span>
                    )}
                    {typeof item.count === "number" && item.count > 0 && (
                      <span className="text-2xl font-bold text-ring">{item.count}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              /*
                Pita: satu baris, tanpa bingkai.
                Tidak ada `opacity-70` pada pembungkusnya. Meredupkan <li> ikut
                meredupkan namanya, dan nama-nama inilah isinya saat berkas logo
                belum ada -- perangkap kontras yang sama sudah menjatuhkan blok
                ini dua kali. Logo yang punya berkas boleh diredam, teks tidak.
              */
              <ul className="mx-auto mt-8 flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-6">
                {logo.map((item, i) => (
                  <li key={i} className="flex items-center">
                    {item.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.logoUrl}
                        alt={item.name}
                        className="h-9 w-auto object-contain opacity-80 transition-opacity hover:opacity-100"
                      />
                    ) : (
                      <span className="text-base font-semibold text-foreground">{item.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {block.caption && (
              <p className="mt-8 text-center text-sm font-semibold text-muted-foreground">{block.caption}</p>
            )}
          </div>
        </section>
      )
    }

    case "courses": {
      const featured =
        block.courseIds.length > 0
          ? block.courseIds
              .map((id) => courses.find((c) => c.id === id))
              .filter((c): c is CourseCardData => !!c)
          : courses.slice(0, 4)
      if (featured.length === 0) return null
      return (
        <section className="bg-background">
          <div className={cn(CONTAINER, "py-24")}>
            <SectionHeading heading={block.heading} subheading={block.subheading} />
            <div className="mt-12">
              <FeaturedCoursesCarousel courses={featured} />
            </div>
          </div>
        </section>
      )
    }

    case "stats": {
      // Angka besar tanpa bingkai: satu baris, seperti "2.7M+" di hero RevoU.
      const items =
        block.source === "manual"
          ? (block.manual ?? []).filter((m) => m.label.trim() && m.value.trim())
          : [
              { value: String(totals.learners), label: t.superadmin.statLearners },
              { value: String(totals.courses), label: t.superadmin.statCourses },
              { value: String(totals.enrollments), label: t.superadmin.statEnrollments },
            ]
      if (items.length === 0) return null
      return (
        <section className="bg-background">
          <div className={cn(CONTAINER, "py-16")}>
            <SectionHeading heading={block.heading} subheading={block.subheading} />
            <dl className="mx-auto mt-10 flex max-w-5xl flex-wrap justify-center gap-x-16 gap-y-8">
              {items.map(({ value, label }) => (
                <div key={label} className="min-w-[8rem] text-center">
                  <dd className="font-display text-5xl font-bold tracking-tight text-ring sm:text-6xl">
                    {value}
                  </dd>
                  <dt className="mt-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )
    }

    case "categories": {
      // Kategori tanpa kelas terbit tidak ditampilkan: kartu yang membawa ke
      // katalog kosong adalah jalan buntu, bukan pilihan.
      if (categories.length === 0) return null
      return (
        <section className="bg-card">
          <div className={cn(CONTAINER, "py-20")}>
            <SectionHeading heading={block.heading} subheading={block.subheading} />
            <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map(({ category, count }) => (
                <li key={category.id}>
                  <Link
                    href={`/kelas?kategori=${encodeURIComponent(category.slug)}`}
                    className="group flex h-full flex-col justify-between gap-6 rounded-2xl bg-background p-6 transition-shadow hover:shadow-float focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <span className="block text-lg font-bold group-hover:underline">{category.name}</span>
                    <span className="flex items-center justify-between text-sm text-muted-foreground">
                      {plural(count, t.catalog.categoryCoursesOne, t.catalog.categoryCourses)}
                      <ArrowRight className="size-4 shrink-0" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )
    }

    case "steps": {
      const langkah = block.items.filter((i) => i.title.trim())
      if (langkah.length === 0) return null
      return (
        <section className="bg-background">
          <div className={cn(CONTAINER, "py-20")}>
            <SectionHeading heading={block.heading} subheading={block.subheading} />
            {/* Garis waktu mendatar: angka besar, garis penghubung, tanpa kartu. */}
            <ol className="relative mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-3">
              {langkah.map((item, i) => (
                <li key={i} className="relative">
                  {/*
                    Angkanya penuh warna, bukan `text-ring/25`: pada 25% ia
                    jatuh di bawah 3:1 (axe: color-contrast, 3 elemen) dan
                    orang dengan penglihatan rendah tidak bisa membacanya --
                    padahal urutan langkah justru yang dibawanya. `aria-hidden`
                    tetap, karena <ol> sudah menyampaikan urutan itu ke pembaca
                    layar.
                  */}
                  <span aria-hidden className="font-display text-6xl font-bold text-ring">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-bold tracking-tight">{item.title}</h3>
                  {item.description && (
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">{item.description}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )
    }

    case "alumni": {
      const kisah = block.items.filter((i) => i.name.trim() && i.quote.trim())
      if (kisah.length === 0) return null
      return (
        <section className="bg-card">
          <div className={cn(CONTAINER, "py-20")}>
            <SectionHeading heading={block.heading} subheading={block.subheading} />
            <ul className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {kisah.map((item, i) => (
                <li key={i} className="flex flex-col rounded-2xl bg-background p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <Avatar src={item.photoUrl} name={item.name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-bold">{item.name}</div>
                      {/* Sebelum → sesudah: perubahan yang bisa dibaca dalam sekali pandang. */}
                      {item.before && (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{item.before}</div>
                      )}
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        {item.before && <ArrowRight aria-hidden className="size-3.5 text-ring" />}
                        <span className="truncate">{item.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex min-h-8 items-center gap-2">
                    {item.companyLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.companyLogoUrl} alt={item.company} className="h-7 w-auto max-w-[140px] object-contain" />
                    ) : (
                      item.company && <span className="text-sm font-semibold text-muted-foreground">{item.company}</span>
                    )}
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                  {item.linkUrl && (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      {t.landing.viewProfile}
                      <ExternalLink aria-hidden className="size-3.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )
    }

    case "gallery": {
      const foto = block.items.filter((i) => i.url)
      if (foto.length === 0) return null
      return (
        /*
          Bidang gelap, seperti bagian komunitas RevoU. Gunanya bukan hiasan:
          sepuluh bagian terang berturut-turut membuat halaman terasa rata, dan
          foto justru paling menonjol di atas latar gelap.

          `bg-foreground` / `text-background`, bukan warna lepas: pasangan itu
          persis yang sudah dijamin `checkTheme()` melewati 4,5:1, jadi bidang
          ini ikut tema pilihan pemilik tanpa bisa menjatuhkan kontras.
        */
        <section className="bg-foreground text-background">
          <div className={cn(CONTAINER, "py-20")}>
            <SectionHeading heading={block.heading} subheading={block.subheading} onDark />
            {/* Mozaik: foto pertama lebih besar, sisanya ubin persegi -- sembilan sekali lihat. */}
            <ul className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {foto.map((item, i) => (
                <li
                  key={i}
                  className={cn(
                    "relative overflow-hidden rounded-2xl bg-background/10",
                    i === 0 && "col-span-2 row-span-2"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption} className="aspect-square size-full object-cover" />
                  {item.caption && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-2.5 text-xs font-semibold text-white">
                      {item.caption}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )
    }

    case "instructors": {
      const people =
        block.source === "manual"
          ? (block.manual ?? [])
              .filter((m) => m.name.trim())
              .map((m, i) => ({ id: `manual-${i}`, name: m.name, title: m.title, bio: m.bio, avatar_url: m.photoUrl }))
          : instructors.map((p) => ({ id: p.id, name: p.name, title: p.title, bio: p.bio, avatar_url: p.avatar_url }))
      if (people.length === 0) return null
      return (
        <section className="bg-card">
          <div className={cn(CONTAINER, "py-20")}>
            <SectionHeading heading={block.heading} subheading={block.subheading} />
            <ul className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {people.map((pengajar) => (
                <li key={pengajar.id} className="text-center">
                  <div className="mx-auto w-fit">
                    <Avatar src={pengajar.avatar_url} name={pengajar.name} size="size-28" />
                  </div>
                  <h3 className="mt-4 text-base font-bold">{pengajar.name}</h3>
                  {pengajar.title && <p className="mt-0.5 text-sm text-muted-foreground">{pengajar.title}</p>}
                  {pengajar.bio && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{pengajar.bio}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )
    }

    case "features":
      return (
        <section className="bg-background">
          <div className={cn(CONTAINER, "py-24")}>
            <SectionHeading heading={block.heading} />
            {/* Tiga kolom tanpa kartu: ikon di kiri atas, teks rata kiri. */}
            <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-10 sm:grid-cols-3">
              {block.features.map(({ icon, title, description }) => {
                const Icon = ICON_MAP[icon ?? "graduation-cap"] ?? GraduationCap
                return (
                  <div key={title}>
                    <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-secondary">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <div className="mb-2 text-xl font-bold">{title}</div>
                    <div
                      className="lesson-prose text-base leading-relaxed text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: description }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )

    case "testimonials": {
      const shown =
        block.source === "manual"
          ? (block.manual ?? [])
              .filter((m) => m.name.trim() && m.comment.trim())
              .map((m, i) => ({ id: `manual-${i}`, firstName: m.name, rating: m.rating, comment: m.comment }))
          : testimonials.slice(0, Math.max(1, block.limit))
      // Tanpa ulasan, blok ini tidak punya apa pun untuk dikatakan.
      if (shown.length === 0) return null
      return (
        <section className="bg-card">
          <div className={cn(CONTAINER, "py-24")}>
            <SectionHeading heading={block.heading} subheading={block.subheading} />
            <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((item) => (
                <figure key={item.id} className="rounded-2xl bg-background p-7 shadow-sm">
                  {/* role="img": satu gambar yang namanya menggantikan seluruh isinya. */}
                  <div
                    role="img"
                    className="flex gap-0.5"
                    aria-label={t.catalog.rating
                      .replace("{n}", String(item.rating))
                      .replace(" · {c} ulasan", "")
                      .replace(" · {c} reviews", "")}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        aria-hidden
                        className={i < item.rating ? "size-4 fill-current text-amber-500" : "size-4 text-input"}
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-base leading-relaxed text-foreground">{item.comment}</blockquote>
                  {/* Hanya nama depan untuk ulasan otomatis; nama manual ditulis pemilik dengan izin orangnya. */}
                  <figcaption className="mt-5 text-sm font-semibold text-muted-foreground">{item.firstName}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )
    }

    case "faq": {
      const items = block.items.filter((item) => item.question.trim())
      if (items.length === 0) return null
      return (
        <section className="bg-background">
          <div className={cn(CONTAINER, "py-24")}>
            <SectionHeading heading={block.heading} />
            <div className="mx-auto mt-12 max-w-3xl divide-y divide-border">
              {items.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-md text-lg font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
                    {item.question}
                    <span aria-hidden className="text-2xl leading-none text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div
                    className="lesson-prose mt-3 text-base leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: item.answer }}
                  />
                </details>
              ))}
            </div>
          </div>
        </section>
      )
    }

    case "cta":
      return (
        <section className="bg-card">
          <div className={cn(CONTAINER, "py-20")}>
            {/* Dua kolom seperti "Train your team" di RevoU: judul kiri, tombol kanan. */}
            <div className="grid items-center gap-8 rounded-3xl bg-brand-gradient px-8 py-12 text-white sm:px-12 lg:grid-cols-[minmax(0,1.4fr)_auto]">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight uppercase sm:text-4xl">{block.heading}</h2>
                <p className="mt-3 max-w-xl text-base text-white/85 sm:text-lg">{block.subheading}</p>
              </div>
              <div className="flex flex-wrap gap-3.5 lg:justify-end">
                <Button
                  size="xl"
                  className="rounded-full bg-white px-8 text-primary hover:bg-white/90"
                  render={<Link href={block.primaryHref} />}
                  nativeButton={false}
                >
                  {block.primaryText}
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="rounded-full border-white/60 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
                  render={<Link href={block.secondaryHref} />}
                  nativeButton={false}
                >
                  {block.secondaryText}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )

    case "whatsapp":
      /*
        Satu-satunya blok yang tidak menempati barisnya sendiri: posisinya
        `fixed`, jadi urutannya di daftar blok tidak mengubah apa pun yang
        terlihat. Dibiarkan tetap blok supaya tombol sembunyikan, susunan, dan
        panel suntingan yang sudah ada berlaku untuknya juga.
      */
      return <FloatingWhatsApp number={block.number} message={block.message} label={block.label} />
  }
}
