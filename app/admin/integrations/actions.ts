"use server"

import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"

import { requireSuperAdmin } from "@/lib/auth/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { buatKunci, cabutKunci } from "@/lib/api-keys-server"
import { KEJADIAN_WEBHOOK, type Lingkup } from "@/lib/api-keys"

/**
 * Pengelolaan kunci API dan webhook.
 *
 * Seluruhnya `requireSuperAdmin()`. Kunci API memberi akses ke seluruh daftar
 * peserta dan pendaftaran lintas kursus, jauh melewati apa yang boleh dilihat
 * seorang mentor atas kursusnya sendiri -- jadi yang boleh menerbitkannya
 * harus orang yang memang sudah boleh melihat semuanya.
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function buatKunciAction(
  nama: string,
  lingkup: Lingkup[]
): Promise<ActionResult<{ rahasia: string }>> {
  let userId: string
  try {
    userId = (await requireSuperAdmin()).userId
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const hasil = await buatKunci(nama, lingkup, userId)
  if ("error" in hasil) return { ok: false, error: hasil.error }

  revalidatePath("/admin/integrations")
  return { ok: true, data: { rahasia: hasil.rahasia } }
}

export async function cabutKunciAction(id: string): Promise<ActionResult<true>> {
  try {
    await requireSuperAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const hasil = await cabutKunci(id)
  if (hasil.error) return { ok: false, error: hasil.error }

  revalidatePath("/admin/integrations")
  return { ok: true, data: true }
}

export async function buatEndpointAction(
  url: string,
  keterangan: string,
  kejadian: string[]
): Promise<ActionResult<{ secret: string }>> {
  let userId: string
  try {
    userId = (await requireSuperAdmin()).userId
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const bersih = url.trim()
  let parsed: URL
  try {
    parsed = new URL(bersih)
  } catch {
    return { ok: false, error: "Alamatnya tidak terbaca. Tulis lengkap dengan https://" }
  }

  /*
   * Hanya https, dan bukan alamat dalam jaringan.
   *
   * Rute pengirim berjalan di server kami, jadi URL apa pun yang disimpan di
   * sini akan dihubungi oleh server kami -- termasuk alamat yang hanya bisa
   * dicapai dari dalam, seperti layanan internal penyedia awan. Itu lubang
   * SSRF, dan pintunya ditutup di tempat alamatnya DISIMPAN, bukan nanti saat
   * dikirim: satu baris buruk yang terlanjur tersimpan akan dicoba berkali-
   * kali oleh penjadwal.
   */
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Alamatnya harus https, bukan http." }
  }
  const host = parsed.hostname.toLowerCase()
  const terlarang =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host.endsWith(".internal")
  if (terlarang) {
    return { ok: false, error: "Alamat di dalam jaringan tidak bisa dipakai." }
  }

  const sah = kejadian.filter((k) => (KEJADIAN_WEBHOOK as readonly string[]).includes(k))
  if (sah.length === 0) return { ok: false, error: "Pilih minimal satu kejadian." }

  const secret = randomBytes(24).toString("hex")
  const admin = createAdminClient()
  const { error } = await admin.from("webhook_endpoints").insert({
    url: bersih,
    secret,
    events: sah,
    active: true,
    created_by: userId,
    description: keterangan.trim() || null,
  })

  if (error) {
    console.error("buatEndpointAction gagal:", error.message)
    return { ok: false, error: "Gagal menyimpan alamat. Coba lagi." }
  }

  revalidatePath("/admin/integrations")
  return { ok: true, data: { secret } }
}

export async function hapusEndpointAction(id: string): Promise<ActionResult<true>> {
  try {
    await requireSuperAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const admin = createAdminClient()
  const { error } = await admin.from("webhook_endpoints").delete().eq("id", id)
  if (error) return { ok: false, error: "Gagal menghapus. Coba lagi." }

  revalidatePath("/admin/integrations")
  return { ok: true, data: true }
}

/**
 * Mengirim antrean sekarang juga, tanpa menunggu penjadwal.
 *
 * Ada supaya orang yang baru mendaftarkan alamat tidak perlu menunggu satu
 * menit hanya untuk tahu bahwa URL-nya salah ketik.
 */
export async function kirimSekarangAction(): Promise<ActionResult<{ terkirim: number; gagal: number }>> {
  try {
    await requireSuperAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const { POST } = await import("@/app/api/webhooks/kirim/route")
  const rahasia = process.env.CRON_SECRET
  const r = await POST(
    new Request("https://internal/api/webhooks/kirim", {
      method: "POST",
      headers: rahasia ? { authorization: `Bearer ${rahasia}` } : {},
    })
  )
  const hasil = (await r.json()) as { terkirim?: number; gagal?: number }

  revalidatePath("/admin/integrations")
  return { ok: true, data: { terkirim: hasil.terkirim ?? 0, gagal: hasil.gagal ?? 0 } }
}
