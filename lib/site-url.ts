/**
 * Alamat kanonik aplikasi.
 *
 * Dipakai Next.js untuk melengkapi URL relatif di metadata -- tautan kanonik
 * dan gambar pratinjau saat halaman dibagikan ke WhatsApp atau LinkedIn.
 * Tanpa ini Next memakai alamat tebakan, dan tautan yang dibagikan bisa
 * menunjuk alamat .vercel.app lama walau pengunjungnya datang dari
 * lms.sanggabiz.com.
 *
 * Dibaca dari environment supaya deployment pratinjau menunjuk dirinya
 * sendiri, bukan produksi. `VERCEL_PROJECT_PRODUCTION_URL` dan `VERCEL_URL`
 * diisi Vercel sendiri; nilai terakhir dipakai saat berjalan di komputer.
 *
 * Dipindah keluar dari app/layout.tsx karena layar pengaturan SEO juga
 * memerlukannya -- untuk menggambar baris alamat pada tiruan hasil pencarian.
 */
export function alamatKanonik(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_ENV === "production") return "https://lms.sanggabiz.com"
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3270"
}
