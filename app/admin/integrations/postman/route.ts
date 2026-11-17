import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { koleksiPostman } from "@/lib/postman-collection"
import { alamatKanonik } from "@/lib/site-url"

/**
 * Mengunduh koleksi Postman sebagai berkas `.json`.
 *
 * Dibatasi superadmin, sejalan dengan layar Integrasi tempat tautannya berada.
 * Isinya memang tidak rahasia -- tidak ada kunci di dalamnya -- tetapi seluruh
 * area itu tertutup, dan satu rute terbuka di dalamnya akan jadi pengecualian
 * yang mudah terlupakan.
 *
 * Berkasnya boleh diteruskan ke tim IT pelanggan apa adanya. Yang mereka
 * tambahkan sendiri hanya kuncinya.
 */
export async function GET() {
  const hasil = await resolveSuperAdminProfile()
  if (hasil.status !== "ok") return new Response("Tidak berwenang", { status: 403 })

  return new Response(JSON.stringify(koleksiPostman(alamatKanonik()), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sanggabiz-api-v1.postman_collection.json"',
      "Cache-Control": "no-store",
    },
  })
}
