import "server-only"

import { createClient } from "@/lib/supabase/server"
import { dbErrorMessage } from "@/lib/db-error-message"
import { DEFAULT_SEO, parseSeo, type SiteSeo } from "@/lib/seo"

/**
 * Pengaturan SEO situs.
 *
 * Dua pembaca yang sengaja dipisah:
 *
 * - `getSeo()` untuk halaman publik. Ia TIDAK PERNAH memilih kolom
 *   `seo_draft`. RLS mengunci baris, bukan kolom, dan baris ini memang harus
 *   bisa dibaca siapa saja -- judul situs muncul di <head> setiap halaman.
 *   Jadi yang menjaga draf agar tidak bocor ke mesin pencari adalah kueri di
 *   sini, dan itu alasan kenapa ia ditulis sebagai fungsi tersendiri alih-alih
 *   satu fungsi berparameter yang gampang dipanggil dengan nilai keliru.
 * - `getSeoDraft()` untuk layar pengelola.
 */
export async function getSeo(): Promise<SiteSeo> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_seo")
    .select("seo")
    .eq("id", true)
    .maybeSingle<{ seo: unknown }>()

  return data ? parseSeo(data.seo) : DEFAULT_SEO
}

export type SeoDraft = {
  seo: SiteSeo
  adaDraf: boolean
  draftUpdatedAt: string | null
}

/** Keadaan yang dibuka penyunting: draf bila ada, terbitan bila tidak. */
export async function getSeoDraft(): Promise<SeoDraft> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_seo")
    .select("seo, seo_draft, draft_updated_at")
    .eq("id", true)
    .maybeSingle<{ seo: unknown; seo_draft: unknown; draft_updated_at: string | null }>()

  const adaDraf = data?.seo_draft != null
  return {
    seo: parseSeo(adaDraf ? data?.seo_draft : data?.seo),
    adaDraf,
    draftUpdatedAt: data?.draft_updated_at ?? null,
  }
}

export async function saveSeoDraft(seo: SiteSeo): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("site_seo")
    .update({ seo_draft: seo, draft_updated_at: new Date().toISOString() })
    .eq("id", true)

  if (error) {
    console.error("saveSeoDraft failed:", error.message)
    return { error: dbErrorMessage(error.message) }
  }
  return { ok: true }
}

/** Menerbitkan: menyalin yang dikirim penyunting ke kolom terbit, lalu mengosongkan draf. */
export async function publishSeoDraft(seo: SiteSeo): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("site_seo")
    .update({
      seo,
      updated_at: new Date().toISOString(),
      seo_draft: null,
      draft_updated_at: null,
    })
    .eq("id", true)

  if (error) {
    console.error("publishSeoDraft failed:", error.message)
    return { error: dbErrorMessage(error.message) }
  }
  return { ok: true }
}

export async function discardSeoDraft(): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("site_seo")
    .update({ seo_draft: null, draft_updated_at: null })
    .eq("id", true)

  if (error) {
    console.error("discardSeoDraft failed:", error.message)
    return { error: dbErrorMessage(error.message) }
  }
  return { ok: true }
}
