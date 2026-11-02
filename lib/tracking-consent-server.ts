import { createClient } from "@/lib/supabase/server"
import { dbErrorMessage } from "@/lib/db-error-message"
import { TRACKING_NOTICE_VERSION } from "@/lib/tracking-notice"

export type TrackingConsentState = {
  granted: boolean
  decidedAt: string | null
  /** Versi pemberitahuan yang disetujui; dipakai untuk tahu kapan harus
   *  bertanya ulang karena teksnya sudah berubah. */
  noticeVersion: string | null
  /** True bila belum pernah memutuskan sama sekali. */
  belumMemutuskan: boolean
}

export async function getTrackingConsent(): Promise<TrackingConsentState> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub as string | undefined
  if (!userId) return { granted: false, decidedAt: null, noticeVersion: null, belumMemutuskan: true }

  const { data, error } = await supabase
    .from("tracking_consents")
    .select("granted, decided_at, notice_version")
    .eq("user_id", userId)
    .order("decided_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Tabelnya belum ada (jeda sebelum migrasi dijalankan) diperlakukan sama
  // dengan "belum memutuskan": tidak ada yang dikumpulkan, dan layarnya tetap
  // hidup.
  if (error || !data) return { granted: false, decidedAt: null, noticeVersion: null, belumMemutuskan: true }

  return {
    granted: data.granted,
    decidedAt: data.decided_at,
    noticeVersion: data.notice_version,
    belumMemutuskan: false,
  }
}

/**
 * Mencatat keputusan sebagai baris baru. Tidak pernah menimpa yang lama --
 * riwayatnya justru yang menjadi bukti kalau suatu saat dipersoalkan.
 */
export async function recordTrackingConsent(granted: boolean): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub as string | undefined
  if (!userId) return { error: "Anda belum masuk" }

  const { error } = await supabase
    .from("tracking_consents")
    .insert({ user_id: userId, granted, notice_version: TRACKING_NOTICE_VERSION })

  if (error) {
    console.error("recordTrackingConsent failed:", error.message)
    return { error: dbErrorMessage(error.message) }
  }
  return { error: null }
}

/** Menghapus seluruh peristiwa milik pemanggil. Dipakai saat menarik
 *  persetujuan: menghentikan pengumpulan saja tidak cukup kalau yang sudah
 *  terkumpul tetap dipakai. */
export async function deleteOwnLearningEvents(): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub as string | undefined
  if (!userId) return { error: "Anda belum masuk" }

  const { error } = await supabase.from("learning_events").delete().eq("user_id", userId)
  if (error) {
    console.error("deleteOwnLearningEvents failed:", error.message)
    return { error: dbErrorMessage(error.message) }
  }
  return { error: null }
}
