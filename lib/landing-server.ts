import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { dbErrorMessage } from "@/lib/db-error-message"
import { sanitizeRichText } from "@/lib/sanitize-content"
import { defaultBlocks, parseBlocks, type LandingBlock } from "@/lib/landing-blocks"
import {
  defaultFeaturedCourseIds,
  defaultFeatures,
  defaultHero,
  type Feature,
  type LandingContent,
} from "@/lib/landing"

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

export async function saveLandingContent(
  input: LandingContent
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("landing_content").upsert(
    {
      id: true,
      heading: input.hero.heading,
      highlight_word: input.hero.highlightWord,
      // Subjudul dan deskripsi keunggulan dirender dengan
      // dangerouslySetInnerHTML di halaman depan publik, jadi keduanya
      // dibersihkan di titik simpan seperti isi pelajaran (C-09).
      subheading: sanitizeRichText(input.hero.subheading),
      primary_cta_text: input.hero.primaryCtaText,
      primary_cta_href: input.hero.primaryCtaHref,
      features: input.features.map((feature) => ({
        ...feature,
        description: sanitizeRichText(feature.description),
      })),
      featured_course_ids: input.featuredCourseIds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  )

  if (error) return { error: dbErrorMessage(error.message, "Gagal menyimpan halaman depan. Coba lagi.") }
  return { ok: true }
}


/**
 * Blok halaman depan, berurutan.
 *
 * Jatuh ke susunan bawaan yang dibangun dari kolom lama bila `blocks` belum
 * terisi atau bentuknya tidak dikenali. Itu yang membuat peralihannya aman:
 * halaman depan tidak pernah kosong, dan mengosongkan `blocks` mengembalikan
 * tampilan lamanya.
 */
export async function getLandingBlocks(): Promise<LandingBlock[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("landing_content")
    .select("blocks")
    .eq("id", true)
    .maybeSingle<{ blocks: unknown }>()

  const parsed = parseBlocks(data?.blocks)
  if (parsed) return parsed

  return defaultBlocks(await getLandingContent())
}

/**
 * Menyimpan susunan blok. Setiap teks yang nanti dirender dengan
 * `dangerouslySetInnerHTML` dibersihkan di sini, di titik simpan, sama seperti
 * isi pelajaran (temuan C-09): halaman depan adalah halaman publik, dan apa
 * pun yang lolos ke sini berjalan di peramban setiap pengunjung.
 */
export async function saveLandingBlocks(
  blocks: LandingBlock[]
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
  const { error } = await supabase
    .from("landing_content")
    .upsert({ id: true, blocks: clean, updated_at: new Date().toISOString() })

  if (error) {
    console.error("saveLandingBlocks failed:", error.message)
    return { error: dbErrorMessage(error.message) }
  }

  return { ok: true }
}

export type LandingTestimonial = {
  id: string
  firstName: string
  rating: number
  comment: string
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
