import "server-only"

import { createHmac } from "node:crypto"

import { createAdminClient } from "@/lib/supabase/admin"
import { jedaBerikutnya } from "@/lib/api-keys"

/**
 * Mengirim webhook yang sedang mengantre.
 *
 * == Kenapa fungsi, bukan hanya rute ==
 *
 * Akun Vercel proyek ini paket Hobby, dan di sana cron hanya boleh berjalan
 * SEKALI SEHARI -- percobaan pertama memakai `* * * * *` dan deploy-nya
 * ditolak mentah-mentah. Webhook yang baru terkirim besok bukan webhook.
 *
 * Jadi pengirimannya tidak lagi bergantung pada penjadwal: antrean di basis
 * data tetap jaminannya (tidak ada kejadian yang hilang), fungsi ini
 * dipanggil langsung sesudah hal-hal yang mengantrekan kejadian, dan cron
 * harian tinggal menjadi jaring pengaman untuk apa pun yang lolos.
 *
 * Pemanggil memakai `after()` dari next/server, bukan janji yang dilepas
 * begitu saja: fungsi tanpa server bisa dimatikan begitu jawabannya terkirim,
 * dan janji yang menggantung ikut mati di tengah jalan.
 */

const BATAS_SEKALI_JALAN = 25
const BATAS_DETIK = 10

export async function kirimAntrean(): Promise<{ terkirim: number; gagal: number }> {
  const admin = createAdminClient()


  /*
   * Antrean diambil lewat fungsi SQL, bukan dirakit di sini.
   *
   * Versi pertama menyaring `next_attempt_at <= <waktu dari Node>`, padahal
   * nilainya ditulis `now()` oleh Postgres. Dua jam yang berbeda sepersekian
   * detik membuat baris yang baru terantre LEWAT dari pengambilan pertama,
   * lalu terkirim pada pengambilan berikutnya -- terlihat seperti webhook
   * yang sesekali telat satu menit tanpa sebab. Perbandingan waktu harus
   * terjadi di tempat waktunya ditulis.
   */
  const { data: antrean } = await admin.rpc("webhook_antrean_siap", { p_limit: BATAS_SEKALI_JALAN })

  const baris = (antrean ?? []) as {
    id: string
    endpoint_id: string
    event: string
    payload: unknown
    attempt: number
  }[]

  if (baris.length === 0) return { terkirim: 0, gagal: 0 }

  const idEndpoint = [...new Set(baris.map((b) => b.endpoint_id))]
  const { data: endpoints } = await admin
    .from("webhook_endpoints")
    .select("id, url, secret, active")
    .in("id", idEndpoint)

  const peta = new Map(
    ((endpoints ?? []) as { id: string; url: string; secret: string; active: boolean }[]).map((e) => [e.id, e])
  )

  let terkirim = 0
  let gagal = 0

  for (const b of baris) {
    const e = peta.get(b.endpoint_id)
    const percobaan = b.attempt + 1

    if (!e || !e.active) {
      // Endpoint dihapus atau dimatikan setelah kejadiannya terantre.
      // Ditandai selesai, bukan dicoba terus -- tidak ada tujuan untuk dituju.
      await admin
        .from("webhook_deliveries")
        .update({ delivered_at: new Date().toISOString(), error: "endpoint tidak aktif", attempt: percobaan })
        .eq("id", b.id)
      continue
    }

    const badan = JSON.stringify({ event: b.event, data: b.payload, deliveryId: b.id })
    const tanda = createHmac("sha256", e.secret).update(badan).digest("hex")

    let status: number | null = null
    let pesan: string | null = null

    try {
      const r = await fetch(e.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sanggabiz-Event": b.event,
          "X-Sanggabiz-Signature": `sha256=${tanda}`,
          "X-Sanggabiz-Delivery": b.id,
        },
        body: badan,
        signal: AbortSignal.timeout(BATAS_DETIK * 1000),
      })
      status = r.status
      if (!r.ok) pesan = `HTTP ${r.status}`
    } catch (err) {
      pesan = err instanceof Error ? err.message.slice(0, 200) : "gagal terhubung"
    }

    const berhasil = status !== null && status >= 200 && status < 300
    if (berhasil) {
      terkirim++
      await admin
        .from("webhook_deliveries")
        .update({ delivered_at: new Date().toISOString(), status_code: status, error: null, attempt: percobaan })
        .eq("id", b.id)
    } else {
      gagal++
      const jeda = jedaBerikutnya(percobaan)
      await admin
        .from("webhook_deliveries")
        .update({
          status_code: status,
          error: pesan,
          attempt: percobaan,
          // Percobaan terakhir: barisnya dibiarkan belum terkirim dan tidak
          // dijadwalkan lagi. `attempt >= MAKS_PERCOBAAN` membuatnya tidak
          // ikut terambil, dan jejaknya tetap bisa dibaca pengelola.
          next_attempt_at: new Date(Date.now() + (jeda ?? 0) * 60_000).toISOString(),
        })
        .eq("id", b.id)
    }
  }

    return { terkirim, gagal }
}
