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

export const LANDING_BLOCK_TYPES = ["hero", "stats", "categories", "courses", "features", "steps", "instructors", "alumni", "logos", "gallery", "testimonials", "faq", "cta", "whatsapp"] as const
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
/**
 * Sumber isi untuk blok yang LMS punya datanya tetapi pemilik boleh mengetik
 * sendiri (docs/STANDAR-HALAMAN-DEPAN.md §2). Bawaan "real"; "manual" tidak
 * memperbarui dirinya, dan petunjuk bloknya mengatakan itu.
 */
export type ContentSource = "real" | "manual"

export type ManualTestimonial = { name: string; rating: number; comment: string }
export type TestimonialsBlock = BlockBase & {
  type: "testimonials"
  heading: string
  subheading: string
  /** Berapa ulasan peserta terbaru yang ditampilkan. */
  limit: number
  source?: ContentSource
  manual?: ManualTestimonial[]
}
/**
 * Pita angka platform (peserta, kelas, pendaftaran).
 *
 * Isinya tidak disunting siapa pun: angkanya dibaca langsung dari basis data
 * saat halaman dirender, dan akun demo dikeluarkan dari hitungan. Blok yang
 * membiarkan angkanya diketik tangan akan selalu berakhir sebagai angka yang
 * tidak pernah diperbarui -- dan di halaman pemasaran, angka basi sama saja
 * dengan angka karangan.
 */
export type ManualStat = { label: string; value: string }
export type StatsBlock = BlockBase & {
  type: "stats"
  heading: string
  subheading: string
  source?: ContentSource
  /** Dipakai hanya bila `source === "manual"`. Nilainya teks supaya "2.7M+" bisa ditulis apa adanya. */
  manual?: ManualStat[]
}

/**
 * Navigasi bidang: "kelas tentang apa yang Anda cari".
 *
 * Isinya tidak diketik siapa pun -- kategorinya dibaca dari tabel
 * `categories` beserta jumlah kelas terbitnya, dan tiap kartu menuju katalog
 * yang sudah tersaring. Pola yang sama dipakai hampir semua LMS: pertanyaan
 * pertama pengunjung bukan "kelas mana yang terbaru", melainkan "ada yang
 * tentang bidang saya?".
 */
export type CategoriesBlock = BlockBase & { type: "categories"; heading: string; subheading: string }

/** Satu langkah pada "cara mulai". */
export type StepItem = { title: string; description: string }

/**
 * Tiga sampai empat langkah dari "melihat-lihat" sampai "dapat sertifikat".
 *
 * Diketik penyusun, bukan diturunkan dari data: ini janji alur, dan alurnya
 * ditentukan orang, bukan oleh isi tabel.
 */
export type StepsBlock = BlockBase & { type: "steps"; heading: string; subheading: string; items: StepItem[] }

/**
 * Satu logo mitra. `name` dipakai sebagai alt dan sebagai cadangan bila
 * gambarnya belum ada; `count` opsional -- jumlah alumni di sana, seperti
 * "BCA 56" di dinding logo RevoU (docs/STANDAR-HALAMAN-DEPAN.md §1).
 */
export type LogoItem = { name: string; logoUrl: string; count?: number }

/**
 * Logo mitra, klien, atau institusi.
 *
 * Disimpan sebagai daftar yang diketik, bukan tabel: jumlahnya belasan,
 * selalu dibaca sekaligus, dan urutannya adalah urutan larik -- alasan yang
 * sama dengan kenapa bloknya sendiri jsonb. Diunggah banyak sekaligus dari
 * penyunting; satu berkas = satu butir.
 */
export type LogosBlock = BlockBase & {
  type: "logos"
  heading: string
  subheading?: string
  /**
   * "dinding": ubin ber-grid dengan angka; "pita": satu baris diam;
   * "berjalan": satu baris yang bergeser sendiri tanpa henti.
   *
   * Yang berjalan memuat lebih banyak logo daripada yang muat di layar, dan
   * itu justru maksudnya -- pita yang penuh sampai terpotong membuat
   * pengunjung tahu daftarnya belum habis.
   */
  variant?: "wall" | "strip" | "marquee"
  /** Baris penutup, mis. "dan 500+ perusahaan lainnya". */
  caption?: string
  items: LogoItem[]
}

/**
 * Tombol WhatsApp mengambang.
 *
 * Satu-satunya blok yang tidak menempati barisnya sendiri di halaman: ia
 * melayang di atas segalanya. Tetap disimpan sebagai blok supaya pemilik
 * mengaturnya di tempat yang sama dengan sisi halaman depan lainnya, dan
 * supaya tombol "sembunyikan" yang sudah ada berlaku untuknya juga.
 */
export type WhatsappBlock = BlockBase & {
  type: "whatsapp"
  /** Boleh diketik bebas ("0812-3456-7890"); dibersihkan saat dirender. */
  number: string
  /** Isi awal percakapan. Kosong berarti WhatsApp terbuka dengan kolom kosong. */
  message: string
  label: string
}

/** Satu foto galeri (acara, kelas, komunitas). */
export type GalleryItem = { url: string; caption: string }

/** Mozaik foto, sembilan sekali lihat seperti bagian komunitas RevoU. Diunggah massal. */
export type GalleryBlock = BlockBase & {
  type: "gallery"
  heading: string
  subheading: string
  items: GalleryItem[]
}

/**
 * Pengajar. Dibaca dari tabel `instructors`, jadi tidak ada nama yang bisa
 * diketik di sini -- satu orang hanya ada satu kali, di satu tempat.
 */
export type ManualInstructor = { name: string; title: string; bio: string; photoUrl: string }
export type InstructorsBlock = BlockBase & {
  type: "instructors"
  heading: string
  subheading: string
  source?: ContentSource
  manual?: ManualInstructor[]
}

/**
 * Satu kisah alumni: foto, nama, posisi sebelum → sesudah, perusahaan (nama
 * dan logonya), kutipan pendek, tautan profil. `role` = posisi sesudah.
 */
export type AlumniItem = {
  name: string
  role: string
  company: string
  quote: string
  photoUrl: string
  before?: string
  companyLogoUrl?: string
  linkUrl?: string
}

/**
 * Kisah alumni, diketik penyusun.
 *
 * Sengaja TIDAK diturunkan dari `course_feedback`. Ulasan kursus ditulis
 * peserta untuk dibaca pengelola, dan memindahkannya ke halaman pemasaran
 * lengkap dengan nama dan tempat kerja bukan yang mereka setujui saat
 * menulisnya. Blok ini isinya kutipan yang memang dikumpulkan untuk
 * dipublikasikan -- dengan izin orangnya.
 */
export type AlumniBlock = BlockBase & {
  type: "alumni"
  heading: string
  subheading: string
  items: AlumniItem[]
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
  | StatsBlock
  | CategoriesBlock
  | StepsBlock
  | LogosBlock
  | GalleryBlock
  | WhatsappBlock
  | InstructorsBlock
  | AlumniBlock
  | TestimonialsBlock
  | FaqBlock
  | CtaBlock

export const BLOCK_LABELS: Record<LandingBlockType, string> = {
  hero: "Bagian Utama",
  courses: "Kursus Pilihan",
  features: "Keunggulan",
  stats: "Angka Platform",
  categories: "Pilihan Bidang",
  steps: "Cara Mulai",
  logos: "Logo Mitra",
  gallery: "Galeri Foto",
  whatsapp: "Tombol WhatsApp",
  instructors: "Pengajar",
  alumni: "Kisah Alumni",
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
    case "categories":
      return { id, type, heading: "Pilih bidang yang Anda minati", subheading: "" }
    case "steps":
      return {
        id,
        type,
        heading: "Cara mulai belajar",
        subheading: "",
        items: [
          { title: "Pilih kelas", description: "" },
          { title: "Belajar sesuai ritme Anda", description: "" },
          { title: "Dapatkan sertifikat", description: "" },
        ],
      }
    case "alumni":
      // Tersembunyi saat dibuat: kisah alumni menyebut nama orang dan tempat
      // kerjanya. Sampai isinya nyata, ia tidak boleh tampil di halaman
      // publik -- testimoni karangan adalah klaim palsu, bukan placeholder.
      return { id, type, hidden: true, heading: "Kisah alumni", subheading: "", items: [] }
    case "logos":
      // Tersembunyi saat dibuat: pita logo kosong lebih buruk daripada tidak
      // ada pita logo sama sekali.
      return { id, type, hidden: true, heading: "Dipercaya oleh", subheading: "", variant: "wall", caption: "", items: [] }
    case "gallery":
      return { id, type, hidden: true, heading: "Suasana belajar", subheading: "", items: [] }
    case "whatsapp":
      // Tersembunyi saat dibuat: tombol tanpa nomor hanya tautan rusak, dan
      // nomornya tidak bisa ditebak.
      return { id, type, hidden: true, number: "", message: "", label: "Hubungi Kami" }
    case "instructors":
      // Tersembunyi saat dibuat: isinya dari tabel instructors, yang bisa saja
      // masih kosong.
      return { id, type, hidden: true, heading: "Pengajar kami", subheading: "" }
    case "stats":
      // Disembunyikan saat dibuat: angka platform baru layak dipamerkan
      // setelah ada isinya, dan pemiliknya yang paling tahu kapan itu.
      return { id, type, hidden: true, heading: "Sanggabiz dalam angka", subheading: "" }
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
