"use server"

import { revalidatePath } from "next/cache"

import { requireSuperAdmin } from "@/lib/auth/require-admin"
import { discardSeoDraft, publishSeoDraft, saveSeoDraft } from "@/lib/seo-server"
import { parseSeo, type SiteSeo } from "@/lib/seo"

import type { ActionResult } from "@/app/admin/courses/actions"

/**
 * Pengaturan SEO situs.
 *
 * Kewenangan diperiksa dua kali -- di sini dan lewat RLS `site_seo` -- karena
 * server action bisa dipanggil langsung lewat jaringan.
 *
 * Masukannya dilewatkan `parseSeo()` dulu, bukan dipakai apa adanya: apa pun
 * yang datang dari peramban adalah apa pun yang dikirim pemanggil, dan kolom
 * jsonb menerima bentuk apa saja tanpa mengeluh.
 */
async function penjaga(): Promise<string | null> {
  try {
    await requireSuperAdmin()
    return null
  } catch {
    return "Anda tidak berwenang"
  }
}

export async function saveSeoDraftAction(seo: SiteSeo): Promise<ActionResult<undefined>> {
  const galat = await penjaga()
  if (galat) return { ok: false, error: galat }

  const hasil = await saveSeoDraft(parseSeo(seo))
  if ("error" in hasil) return { ok: false, error: hasil.error }

  revalidatePath("/admin/seo", "page")
  return { ok: true, data: undefined }
}

export async function publishSeoAction(seo: SiteSeo): Promise<ActionResult<undefined>> {
  const galat = await penjaga()
  if (galat) return { ok: false, error: galat }

  const hasil = await publishSeoDraft(parseSeo(seo))
  if ("error" in hasil) return { ok: false, error: hasil.error }

  // Judul dan keterangan situs ada di setiap halaman, jadi yang disegarkan
  // tata letaknya -- bukan satu halaman saja.
  revalidatePath("/", "layout")
  return { ok: true, data: undefined }
}

export async function discardSeoDraftAction(): Promise<ActionResult<undefined>> {
  const galat = await penjaga()
  if (galat) return { ok: false, error: galat }

  const hasil = await discardSeoDraft()
  if ("error" in hasil) return { ok: false, error: hasil.error }

  revalidatePath("/admin/seo", "page")
  return { ok: true, data: undefined }
}
