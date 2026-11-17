import { copyFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Menyalin dua berkas Swagger UI dari node_modules ke public/swagger.
 *
 * Kenapa disajikan dari domain sendiri, bukan dari CDN: halaman ini dibuka
 * tim IT pelanggan, sering dari jaringan kantor yang memblokir CDN pihak
 * ketiga -- dan paling sering justru saat sedang dipakai presentasi, ketika
 * tidak ada waktu mencari tahu kenapa halamannya kosong. Satu <script> ke
 * domain luar juga berarti pemilik domain itu bisa menjalankan kode apa pun
 * di halaman kita.
 *
 * Kenapa disalin, bukan disimpan di repositori: berkasnya 1,9 MB hasil
 * kompilasi yang tidak bisa diperiksa siapa pun saat ditinjau. Sebagai
 * dependensi npm ia punya versi, punya catatan perubahan, dan ikut terperiksa
 * `npm audit`.
 *
 * Dijalankan oleh `postinstall` (supaya `next dev` langsung jalan sesudah
 * npm install) dan `prebuild` (supaya Vercel menyalinnya sebelum membangun).
 */

const akar = join(dirname(fileURLToPath(import.meta.url)), "..")
const asal = join(akar, "node_modules", "swagger-ui-dist")
const tujuan = join(akar, "public", "swagger")

// Hanya bundel JS. CSS-nya diimpor langsung oleh komponennya, jadi Next yang
// mengurus pemuatannya dan tidak ada salinan kedua yang bisa ketinggalan versi.
const BERKAS = ["swagger-ui-bundle.js"]

mkdirSync(tujuan, { recursive: true })

for (const berkas of BERKAS) {
  try {
    copyFileSync(join(asal, berkas), join(tujuan, berkas))
  } catch (galat) {
    // Tidak menggagalkan pemasangan: `npm install` yang berhenti karena satu
    // berkas dokumentasi akan memblokir seluruh pekerjaan lain. Halamannya
    // sendiri sudah menjelaskan kalau berkasnya tidak ada.
    console.warn(`salin-swagger: ${berkas} tidak tersalin -- ${galat.message}`)
    process.exit(0)
  }
}

console.log(`salin-swagger: ${BERKAS.length} berkas disalin ke public/swagger`)
