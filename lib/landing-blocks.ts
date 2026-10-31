import {
  defaultFeatures,
  defaultHero,
  type Feature,
  type Hero,
  type LandingContent,
} from "@/lib/landing"

/**
 * Halaman depan sebagai daftar blok berurutan.
 *
 * Sebelumnya bentuknya tetap: hero, lalu kursus pilihan, lalu keunggulan, lalu
 * satu ajakan bertindak yang bahkan ditulis langsung di dalam `app/page.tsx`
 * dan karena itu tidak bisa disunting siapa pun. Superadmin hanya bisa
 * mengganti isi tiga bagian pertama, tidak urutannya, dan tidak bisa menambah
 * atau menghilangkan apa pun.
 *
 * Yang berubah: susunannya kini data, bukan tata letak. Setiap blok bisa
 * dipindah, disembunyikan, dihapus, dan ditambahkan lagi.
 *
 * Blok disimpan di satu kolom jsonb, bukan tabel tersendiri, karena jumlahnya
 * kecil, selalu dibaca sekaligus, dan urutannya adalah urutan larik -- tabel
 * terpisah hanya akan menambah kolom `position` yang harus dijaga sendiri.
 */

export const LANDING_BLOCK_TYPES = ["hero", "courses", "features", "testimonials", "faq", "cta"] as const
export type LandingBlockType = (typeof LANDING_BLOCK_TYPES)[number]

type BlockBase = {
  id: string
  /** Disembunyikan dari pengunjung, tetapi isinya tetap tersimpan. */
  hidden?: boolean
}

export type HeroBlock = BlockBase & { type: "hero"; hero: Hero }
export type CoursesBlock = BlockBase & {
  type: "courses"
  heading: string
  subheading: string
  courseIds: string[]
}
export type FeaturesBlock = BlockBase & { type: "features"; heading: string; features: Feature[] }
export type TestimonialsBlock = BlockBase & {
  type: "testimonials"
  heading: string
  subheading: string
  /** Berapa ulasan peserta terbaru yang ditampilkan. */
  limit: number
}
export type FaqItem = { question: string; answer: string }
export type FaqBlock = BlockBase & { type: "faq"; heading: string; items: FaqItem[] }
export type CtaBlock = BlockBase & {
  type: "cta"
  heading: string
  subheading: string
  primaryText: string
  primaryHref: string
  secondaryText: string
  secondaryHref: string
}

export type LandingBlock =
  | HeroBlock
  | CoursesBlock
  | FeaturesBlock
  | TestimonialsBlock
  | FaqBlock
  | CtaBlock

export const BLOCK_LABELS: Record<LandingBlockType, string> = {
  hero: "Bagian Utama",
  courses: "Kursus Pilihan",
  features: "Keunggulan",
  testimonials: "Testimoni Peserta",
  faq: "Pertanyaan Umum",
  cta: "Ajakan Bertindak",
}

/** Jenis blok yang hanya masuk akal muncul sekali. */
export const SINGLETON_BLOCKS: LandingBlockType[] = ["hero"]

export function newBlockId(): string {
  return `blok-${Math.random().toString(36).slice(2, 10)}`
}

export function createBlock(type: LandingBlockType): LandingBlock {
  const id = newBlockId()
  switch (type) {
    case "hero":
      return { id, type, hero: { ...defaultHero } }
    case "courses":
      return { id, type, heading: "Kursus Pilihan", subheading: "", courseIds: [] }
    case "features":
      return { id, type, heading: "Kenapa Belajar di Sini", features: defaultFeatures.map((f) => ({ ...f })) }
    case "testimonials":
      return { id, type, heading: "Kata Peserta", subheading: "", limit: 3 }
    case "faq":
      return {
        id,
        type,
        heading: "Pertanyaan Umum",
        items: [{ question: "", answer: "" }],
      }
    case "cta":
      return {
        id,
        type,
        heading: "Siap Mulai Belajar?",
        subheading:
          "Bergabunglah dengan peserta lain yang sudah mengembangkan diri melalui kursus kami.",
        primaryText: "Buat Akun",
        primaryHref: "/auth/login",
        secondaryText: "Lihat Semua Kursus",
        secondaryHref: "/auth/login",
      }
  }
}

/**
 * Susunan bawaan, dipakai saat belum ada baris `landing_content` sama sekali.
 * Urutannya sama persis dengan halaman depan sebelum blok diperkenalkan, jadi
 * situs yang baru dipasang tampil seperti sebelumnya.
 */
export function defaultBlocks(content: LandingContent): LandingBlock[] {
  return [
    { id: newBlockId(), type: "hero", hero: content.hero },
    {
      id: newBlockId(),
      type: "courses",
      heading: "Kursus Pilihan",
      subheading: "",
      courseIds: content.featuredCourseIds,
    },
    { id: newBlockId(), type: "features", heading: "Kenapa Belajar di Sini", features: content.features },
    createBlock("cta"),
  ]
}

/**
 * Membaca larik blok dari jsonb. Apa pun yang bentuknya tidak dikenali
 * dibuang, bukan dibiarkan lolos: halaman depan adalah halaman publik, dan
 * blok rusak lebih baik hilang daripada merobohkan seluruh halaman.
 */
export function parseBlocks(raw: unknown): LandingBlock[] | null {
  if (!Array.isArray(raw)) return null
  const known = new Set<string>(LANDING_BLOCK_TYPES)
  const blocks = raw.filter(
    (item): item is LandingBlock =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as { id?: unknown }).id === "string" &&
      known.has((item as { type?: unknown }).type as string)
  )
  return blocks.length > 0 ? blocks : null
}
