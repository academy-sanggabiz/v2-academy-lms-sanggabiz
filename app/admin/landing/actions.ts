"use server"

import { revalidatePath } from "next/cache"

import { requireSuperAdmin } from "@/lib/auth/require-admin"
import { saveLandingBlocks, saveLandingContent, saveLandingTheme } from "@/lib/landing-server"
import type { LandingContent } from "@/lib/landing"
import type { LandingBlock } from "@/lib/landing-blocks"
import type { LandingTheme } from "@/lib/landing-theme"

import type { ActionResult } from "@/app/admin/courses/actions"

export async function saveLandingContentAction(
  input: LandingContent
): Promise<ActionResult<undefined>> {
  try {
    await requireSuperAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await saveLandingContent(input)
  if ("error" in result) return { ok: false, error: result.error }

  revalidatePath("/", "page")
  revalidatePath("/admin/landing", "page")
  return { ok: true, data: undefined }
}

/**
 * Menyimpan susunan blok halaman depan.
 *
 * Kewenangannya diperiksa dua kali dan itu disengaja: `requireSuperAdmin()`
 * di sini, dan RLS `landing_content` di basis data. Server action dapat
 * dipanggil langsung lewat jaringan, jadi penjaga di layar bukan penjaga.
 */
export async function saveLandingBlocksAction(
  blocks: LandingBlock[]
): Promise<ActionResult<undefined>> {
  try {
    await requireSuperAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { ok: false, error: "Halaman depan harus punya setidaknya satu blok." }
  }

  const result = await saveLandingBlocks(blocks)
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
