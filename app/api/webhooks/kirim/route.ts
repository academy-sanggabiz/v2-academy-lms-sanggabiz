import { kirimAntrean } from "@/lib/webhook-kirim"

/**
 * Mengirim antrean webhook atas perintah penjadwal.
 *
 * Jadwalnya HARIAN, bukan tiap menit: akun Vercel proyek ini paket Hobby,
 * yang menolak cron lebih sering dari sekali sehari (deploy pertama gagal
 * persis karena itu). Rute ini karena itu bukan jalur utama pengiriman
 * melainkan jaring pengaman -- jalur utamanya `kirimAntrean()` yang dipanggil
 * langsung sesudah kejadian terantre. Lihat lib/webhook-kirim.ts.
 *
 * Vercel mengirim `Authorization: Bearer $CRON_SECRET` pada pemanggilan cron.
 * Tanpa pemeriksaan ini, rute yang mengirim permintaan keluar atas perintah
 * siapa pun adalah mesin serangan bagi orang lain.
 */
export async function POST(request: Request) {
  const rahasiaCron = process.env.CRON_SECRET
  if (rahasiaCron && request.headers.get("authorization") !== `Bearer ${rahasiaCron}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  const hasil = await kirimAntrean()
  return Response.json(hasil)
}

/** Vercel Cron memanggil dengan GET. */
export async function GET(request: Request) {
  return POST(request)
}
