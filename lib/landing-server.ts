import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { dbErrorMessage } from "@/lib/db-error-message"
import { sanitizeRichText } from "@/lib/sanitize-content"
import { defaultBlocks, parseBlocks, type LandingBlock } from "@/lib/landing-blocks"
import { checkTheme, parseTheme, type LandingTheme } from "@/lib/landing-theme"
import type { LandingTestimonial, PlatformTotals } from "@/lib/landing"
export type { LandingTestimonial, PlatformTotals }
import {
  defaultFeaturedCourseIds,
  defaultFeatures,
  defaultHero,
  type Feature,
  type LandingContent,
} from "@/lib/landing"
import type { Locale } from "@/lib/i18n/config"
import type { Instructor } from "@/lib/courses"

type LandingContentRow = {
  blocks: unknown
  heading: string
  highlight_word: string
  subheading: string
  primary_cta_text: string
  primary_cta_href: string
  features: Feature[]
  featured_course_ids: string[]
}

/** Reads the single landing_content row, falling back to the built-in defaults. */
export async function getLandingContent(): Promise<LandingContent> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("landing_content")
    .select(
      "heading, highlight_word, subheading, primary_cta_text, primary_cta_href, features, featured_course_ids, blocks"
    )
    .eq("id", true)
    .maybeSingle<LandingContentRow>()

  if (error || !data) {
    return { hero: defaultHero, features: defaultFeatures, featuredCourseIds: defaultFeaturedCourseIds }
  }

  return {
    hero: {
      heading: data.heading,
      highlightWord: data.highlight_word,
      subheading: data.subheading,
      primaryCtaText: data.primary_cta_text,
      primaryCtaHref: data.primary_cta_href,
    },
    features: data.features?.length ? data.features : defaultFeatures,
    featuredCourseIds: data.featured_course_ids ?? defaultFeaturedCourseIds,
  }
}

/**
 * Blok halaman depan, berurutan.
 *
 * Jatuh ke susunan bawaan yang dibangun dari kolom lama bila `blocks` belum
 * terisi atau bentuknya tidak dikenali. Itu yang membuat peralihannya aman:
 * halaman depan tidak pernah kosong, dan mengosongkan `blocks` mengembalikan
 * tampilan lamanya.
 */
export async function getLandingBlocks(locale: Locale = "id"): Promise<LandingBlock[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("landing_content")
    .select("blocks, blocks_en")
    .eq("id", true)
    .maybeSingle<{ blocks: unknown; blocks_en: unknown }>()

  // Versi Inggris dipakai utuh bila ada; bila belum pernah disimpan,
  // pengunjung EN mendapat versi Indonesia -- halaman depan tidak boleh
  // kosong hanya karena terjemahannya belum ditulis.
  if (locale === "en") {
    const en = parseBlocks(data?.blocks_en)
    if (en) return en
  }

  const parsed = parseBlocks(data?.blocks)
  if (parsed) return parsed

  return defaultBlocks(await getLandingContent())
}

/** Apakah versi Inggris halaman depan sudah pernah disimpan. */
export async function hasEnglishLandingBlocks(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("landing_content")
    .select("blocks_en")
    .eq("id", true)
    .maybeSingle<{ blocks_en: unknown }>()
  return parseBlocks(data?.blocks_en) !== null
}

/** Susunan blok versi Inggris apa adanya (null bila belum diterjemahkan). */
export async function getEnglishLandingBlocks(): Promise<LandingBlock[] | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("landing_content")
    .select("blocks_en")
    .eq("id", true)
    .maybeSingle<{ blocks_en: unknown }>()
  return parseBlocks(data?.blocks_en)
}

/**
 * Menyimpan susunan blok. Setiap teks yang nanti dirender dengan
 * `dangerouslySetInnerHTML` dibersihkan di sini, di titik simpan, sama seperti
 * isi pelajaran (temuan C-09): halaman depan adalah halaman publik, dan apa
 * pun yang lolos ke sini berjalan di peramban setiap pengunjung.
 */
export async function saveLandingBlocks(
  blocks: LandingBlock[],
  locale: Locale = "id"
): Promise<{ ok: true } | { error: string }> {
  const clean: LandingBlock[] = blocks.map((block) => {
    switch (block.type) {
      case "hero":
        return { ...block, hero: { ...block.hero, subheading: sanitizeRichText(block.hero.subheading) } }
      case "features":
        return {
          ...block,
          features: block.features.map((f) => ({ ...f, description: sanitizeRichText(f.description) })),
        }
      case "faq":
        return {
          ...block,
          items: block.items.map((item) => ({ ...item, answer: sanitizeRichText(item.answer) })),
        }
      default:
        return block
    }
  })

  const supabase = await createClient()
  const kolom = locale === "en" ? { blocks_en: clean } : { blocks: clean }
  // UPDATE, bukan upsert: baris tunggalnya sudah disemai migrasi, dan jalur
  // INSERT pada upsert memeriksa NOT NULL kolom lain (heading dkk.) SEBELUM
  // resolusi konflik -- jadi upsert tanpa kolom-kolom itu selalu gagal.
  const { error } = await supabase
    .from("landing_content")
    .update({ ...kolom, updated_at: new Date().toISOString() })
    .eq("id", true)

  if (error) {
    console.error("saveLandingBlocks failed:", error.message)
    return { error: dbErrorMessage(error.message) }
  }

  return { ok: true }
}

/**
 * Ulasan peserta untuk blok testimoni di halaman depan.
 *
 * Dibaca lewat klien service role karena halaman depan dilihat pengunjung
 * yang belum masuk, sementara `course_feedback` hanya terbaca pemiliknya dan
 * pengelola kursusnya. Yang dikembalikan sengaja dipangkas: **hanya nama
 * depan**, nilai, dan komentarnya -- tanpa id peserta, tanpa email, tanpa
 * judul kursus. Nama lengkap bersama judul kursus di halaman publik sudah
 * cukup untuk membuat seseorang bisa ditemukan, dan itu bukan yang disetujui
 * peserta saat menulis ulasan.
 */
export async function getLandingTestimonials(limit = 6): Promise<LandingTestimonial[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("course_feedback")
    .select("id, rating, comment, learner:profiles(full_name)")
    .gte("rating", 4)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("getLandingTestimonials failed:", error.message)
    return []
  }

  return (data ?? []).map((row) => {
    const learner = Array.isArray(row.learner) ? row.learner[0] : row.learner
    const full = (learner as { full_name?: string } | null)?.full_name ?? ""
    return {
      id: row.id as string,
      firstName: full.trim().split(/\s+/)[0] || "Peserta",
      rating: row.rating as number,
      comment: row.comment as string,
    }
  })
}


/** Tema halaman depan; jatuh ke bawaan bila belum diatur atau gagal kontras. */
export async function getLandingTheme(): Promise<LandingTheme> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("landing_content")
    .select("theme")
    .eq("id", true)
    .maybeSingle<{ theme: unknown }>()

  return parseTheme(data?.theme)
}

/**
 * Menyimpan tema. Ditolak bila ada pasangan warna yang gagal ambang kontras --
 * dengan menyebutkan angkanya, bukan sekadar "tidak boleh". Pemeriksaan ini
 * ada di server, bukan hanya di layar, karena server action bisa dipanggil
 * langsung lewat jaringan.
 */
export async function saveLandingTheme(
  theme: LandingTheme
): Promise<{ ok: true } | { error: string }> {
  const check = checkTheme(theme)
  if (!check.ok) return { error: check.problems.join(". ") }

  // UPDATE, bukan upsert -- lihat catatan di saveLandingBlocks.
  const supabase = await createClient()
  const { error } = await supabase
    .from("landing_content")
    .update({ theme, updated_at: new Date().toISOString() })
    .eq("id", true)

  if (error) {
    console.error("saveLandingTheme failed:", error.message)
    return { error: dbErrorMessage(error.message) }
  }

  return { ok: true }
}


/**
 * Angka platform untuk pita statistik di halaman depan.
 *
 * Akun demo (@contoh.test) dikurangkan dari jumlah peserta. View
 * `public_platform_totals` memang sudah memisahkan hitungannya persis supaya
 * pemakainya bisa melakukan ini -- menampilkan angka gabungan di halaman
 * pemasaran berarti memamerkan akun uji sebagai peserta sungguhan.
 */
export async function getPlatformTotals(): Promise<PlatformTotals> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("public_platform_totals")
    .select("learner_count, demo_learner_count, course_count, enrollment_count")
    .maybeSingle<{
      learner_count: number
      demo_learner_count: number
      course_count: number
      enrollment_count: number
    }>()

  if (error || !data) {
    if (error) console.error("getPlatformTotals failed:", error.message)
    return { learners: 0, courses: 0, enrollments: 0 }
  }

  return {
    learners: Math.max(0, (data.learner_count ?? 0) - (data.demo_learner_count ?? 0)),
    courses: data.course_count ?? 0,
    enrollments: data.enrollment_count ?? 0,
  }
}

/**
 * Pengajar untuk blok "Pengajar kami" di halaman depan.
 *
 * Dibaca dengan klien anon, bukan lewat `listInstructors()` di
 * `lib/courses-admin.ts`: modul itu milik layar pengelola, dan halaman
 * publik yang menariknya ikut membawa seluruh isinya ke jalur render
 * publik. Policy `instructors are readable` memang sudah mengizinkan anon,
 * jadi tidak ada yang perlu dilonggarkan.
 */
export async function listPublicInstructors(limit = 12): Promise<Instructor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("instructors")
    .select("id, name, title, bio, avatar_url")
    .order("name")
    .limit(limit)

  if (error) {
    console.error("listPublicInstructors failed:", error.message)
    return []
  }
  return (data ?? []) as Instructor[]
}
