"use server"

import { revalidatePath } from "next/cache"

import { requireSuperAdmin } from "@/lib/auth/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { getTranslations } from "@/lib/i18n/server"
import { buatRingkasanLaporan } from "@/lib/ai/report-summary"
import { keAngkaRingkas } from "@/lib/laporan-departemen"
import { getLaporanDepartemen, lingkupRingkasan } from "@/lib/laporan-departemen-server"
import {
  BATAS_TOKEN_LAPORAN_HARIAN,
  FITUR_LAPORAN,
  formatToken,
} from "@/lib/ai-usage"
import { tokenHariIni } from "@/lib/ai-usage-server"

/**
 * Membuat ringkasan AI untuk laporan per departemen (F3).
 *
 * Hanya superadmin: laporan ini menyatukan angka seluruh organisasi, jauh
 * melewati apa yang boleh dilihat seorang mentor atas kursusnya sendiri.
 *
 * **Angkanya dibaca ulang di sini, bukan dikirim dari peramban.** Kalau
 * layar yang mengirim angkanya, siapa pun yang bisa memanggil action ini
 * bisa menyuruh model meringkas angka karangan -- dan hasilnya tersimpan di
 * `ai_report_summaries` sebagai kalau-kalau itu laporan sungguhan.
 */

export type HasilRingkasan =
  | { ok: true }
  | { ok: false; error: string }

export async function buatRingkasanAction(): Promise<HasilRingkasan> {
  let userId: string
  try {
    userId = (await requireSuperAdmin()).userId
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const terpakai = await tokenHariIni(userId, FITUR_LAPORAN)
  if (terpakai >= BATAS_TOKEN_LAPORAN_HARIAN) {
    return {
      ok: false,
      error:
        `Jatah ringkasan hari ini sudah habis (${formatToken(terpakai, "id")} token). ` +
        "Angka di tabel tetap bisa dibaca. Coba lagi besok.",
    }
  }

  const { t, locale } = await getTranslations()
  const laporan = await getLaporanDepartemen()
  const angka = keAngkaRingkas(laporan.baris, t.laporanDepartemen.noDepartment)

  const hasil = await buatRingkasanLaporan(angka, locale)
  if (!hasil.ok) return { ok: false, error: hasil.error }

  /*
   * Disimpan dengan service role: `ai_report_summaries` sengaja hanya punya
   * policy SELECT untuk superadmin dan tidak punya policy INSERT untuk siapa
   * pun -- pola yang sama dengan `notifications` dan `ai_quiz_feedback`.
   *
   * `figures` diisi angka yang BENAR-BENAR dipakai, supaya nanti bisa
   * diperiksa apakah ringkasan lama masih cocok dengan keadaan sekarang.
   */
  const admin = createAdminClient()
  const { error } = await admin.from("ai_report_summaries").insert({
    scope: lingkupRingkasan(locale),
    summary: JSON.stringify(hasil.data.ringkasan),
    figures: angka,
    model: hasil.data.model,
  })

  if (error) {
    console.error("buatRingkasanAction gagal menyimpan:", error.message)
    return { ok: false, error: "Ringkasannya jadi, tetapi gagal disimpan. Coba lagi." }
  }

  await admin.from("ai_usage").insert({
    user_id: userId,
    feature: "report-summary",
    tokens: hasil.token,
    model: hasil.data.model,
  })

  revalidatePath("/admin/tracking")
  return { ok: true }
}
