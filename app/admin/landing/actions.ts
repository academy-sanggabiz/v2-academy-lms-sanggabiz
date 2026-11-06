"use server"

import { revalidatePath } from "next/cache"

import { requireSuperAdmin } from "@/lib/auth/require-admin"
import {
  discardLandingDraft,
  publishLandingDraft,
  saveLandingBlocks,
  saveLandingDraft,
  saveLandingTheme,
} from "@/lib/landing-server"
import type { LandingBlock } from "@/lib/landing-blocks"
import type { LandingTheme } from "@/lib/landing-theme"
import { isLocale, type Locale } from "@/lib/i18n/config"

import type { ActionResult } from "@/app/admin/courses/actions"

/**
 * Menyimpan susunan blok halaman depan.
 *
 * Kewenangannya diperiksa dua kali dan itu disengaja: `requireSuperAdmin()`
 * di sini, dan RLS `landing_content` di basis data. Server action dapat
 * dipanggil langsung lewat jaringan, jadi penjaga di layar bukan penjaga.
 */
export async function saveLandingBlocksAction(
  blocks: LandingBlock[],
  locale: Locale = "id"
): Promise<ActionResult<undefined>> {
  try {
    await requireSuperAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { ok: false, error: "Halaman depan harus punya setidaknya satu blok." }
  }
  if (!isLocale(locale)) return { ok: false, error: "Bahasa tidak dikenal" }

  const result = await saveLandingBlocks(blocks, locale)
  if ("error" in result) return { ok: false, error: result.error }

  revalidatePath("/", "page")
  revalidatePath("/admin/landing", "page")
  return { ok: true, data: undefined }
}


export async function saveLandingThemeAction(
  theme: LandingTheme
): Promise<ActionResult<undefined>> {
  try {
    await requireSuperAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await saveLandingTheme(theme)
  if ("error" in result) return { ok: false, error: result.error }

  revalidatePath("/", "page")
  revalidatePath("/admin/landing", "page")
  return { ok: true, data: undefined }
}

/* ------------------------------------------------------------------ *
 * Draf: simpan, terbitkan, buang
 *
 * Ketiganya memeriksa kewenangan DUA KALI -- `requireSuperAdmin()` di sini
 * dan RLS `landing_content` di basis data. Server action bisa dipanggil
 * langsung lewat jaringan, jadi penjaga di layar bukan penjaga.
 * ------------------------------------------------------------------ */

export async function saveLandingDraftAction(
  blocks: LandingBlock[],
  blocksEn: LandingBlock[] | null,
  theme: LandingTheme
): Promise<ActionResult<undefined>> {
  try {
    await requireSuperAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await saveLandingDraft(blocks, blocksEn, theme)
  if ("error" in result) return { ok: false, error: result.error }

  // Hanya layar pengelola yang perlu disegarkan: draf tidak mengubah apa pun
  // yang dilihat pengunjung, jadi menyegarkan "/" di sini hanya membuang
  // cache halaman publik tanpa alasan.
  revalidatePath("/admin/landing", "page")
  return { ok: true, data: undefined }
}

export async function publishLandingAction(
  blocks: LandingBlock[],
  blocksEn: LandingBlock[] | null,
  theme: LandingTheme
): Promise<ActionResult<undefined>> {
  try {
    await requireSuperAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await publishLandingDraft(blocks, blocksEn, theme)
  if ("error" in result) return { ok: false, error: result.error }

  revalidatePath("/", "page")
  revalidatePath("/admin/landing", "page")
  return { ok: true, data: undefined }
}

export async function discardLandingDraftAction(): Promise<ActionResult<undefined>> {
  try {
    await requireSuperAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await discardLandingDraft()
  if ("error" in result) return { ok: false, error: result.error }

  revalidatePath("/admin/landing", "page")
  return { ok: true, data: undefined }
}
