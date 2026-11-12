import { createHmac } from "node:crypto"

import { createAdminClient } from "@/lib/supabase/admin"
import { jedaBerikutnya } from "@/lib/api-keys"

/**
 * Mengirim webhook yang sedang mengantre.
 *
 * Dipanggil Vercel Cron tiap menit (lihat vercel.json). Terbuka juga untuk
 * dipanggil tangan dari layar pengelola, supaya orang tidak perlu menunggu
 * satu menit hanya untuk tahu URL-nya salah ketik.
 *
 * == Siapa yang boleh memanggil ==
 *
 * Vercel mengirim `Authorization: Bearer $CRON_SECRET` pada pemanggilan cron.
 * Tanpa CRON_SECRET disetel, rute ini hanya melayani pemanggilan dari dalam
 * aplikasi (layar pengelola, lewat server action) -- bukan dibiarkan
 * terbuka. Rute yang mengirim permintaan keluar atas perintah siapa pun
 * adalah mesin serangan bagi orang lain.
 *
 * == Tanda tangan ==
 *
 * Tiap kiriman membawa `X-Sanggabiz-Signature: sha256=<hmac>` atas badan
 * mentahnya, memakai `secret` milik endpoint. Tanpa itu penerima tidak punya
 * cara membedakan kabar dari kami dengan kabar dari siapa pun yang menebak
 * URL-nya.
 */

const BATAS_SEKALI_JALAN = 25
const BATAS_DETIK = 10

export async function POST(request: Request) {
  const rahasiaCron = process.env.CRON_SECRET
  if (rahasiaCron) {
    const diberikan = request.headers.get("authorization")
    if (diberikan !== `Bearer ${rahasiaCron}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 })
    }
  }

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

  if (baris.length === 0) return Response.json({ terkirim: 0, gagal: 0 })

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

  return Response.json({ terkirim, gagal })
}
