import { KEJADIAN_WEBHOOK } from "@/lib/api-keys"
import { KATALOG_API, type Operasi } from "@/lib/api-katalog"

/**
 * Koleksi Postman untuk API Sanggabiz.
 *
 * Dibuat di sini, bukan disimpan sebagai berkas JSON statis, supaya alamat
 * dasarnya ikut lingkungan: koleksi yang menunjuk localhost tidak berguna
 * bagi tim IT pelanggan, dan koleksi yang menunjuk produksi tidak berguna
 * saat menguji di pratinjau.
 *
 * Daftar endpoint-nya TIDAK lagi ditulis di sini. Ia dibaca dari
 * lib/api-katalog, yang juga dibaca pembuat dokumentasi OpenAPI -- supaya
 * Swagger dan Postman tidak bisa menjelaskan API yang berbeda. Lihat komentar
 * di kepala berkas itu.
 *
 * Kuncinya TIDAK pernah ikut di dalam berkas. Ia variabel koleksi yang kosong
 * (`apiKey`), diisi sendiri oleh yang memakainya. Menyematkan kunci ke dalam
 * berkas yang lalu dikirim lewat surel dan disimpan di repositori pelanggan
 * adalah cara paling mudah membocorkannya.
 */
export function koleksiPostman(dasar: string) {
  const permintaan = (op: Operasi) => ({
    name: op.nama,
    request: {
      method: op.metode,
      header: [
        { key: "Authorization", value: "Bearer {{apiKey}}" },
        ...(op.badan ? [{ key: "Content-Type", value: "application/json" }] : []),
      ],
      ...(op.badan ? { body: { mode: "raw", raw: JSON.stringify(op.badan.contoh, null, 2) } } : {}),
      url: {
        raw: `{{baseUrl}}${op.jalur}`,
        host: ["{{baseUrl}}"],
        path: op.jalur.replace(/^\//, "").split("/"),
        // Parameter saringan dimatikan secara bawaan: koleksi yang langsung
        // mengirim `email=` kosong menyaring ke nol baris, dan orang yang
        // baru pertama membukanya menyimpulkan API-nya kosong.
        query: (op.kueri ?? []).map((q) => ({
          key: q.nama,
          value: q.contoh,
          description: q.keterangan,
          disabled: !q.selaluAktif,
        })),
      },
      description: op.keterangan,
    },
  })

  return {
    info: {
      name: "Sanggabiz Academy API v1",
      description: [
        "API Sanggabiz Academy untuk sistem internal perusahaan.",
        "",
        "CARA MEMAKAI",
        "1. Buka tab Variables pada koleksi ini.",
        "2. Isi `apiKey` dengan kunci yang diberikan Sanggabiz (diawali sgb_).",
        "3. Jalankan permintaan mana pun.",
        "",
        "Kunci tidak ikut tersimpan di dalam berkas ini. Setiap orang mengisi",
        "kuncinya sendiri.",
        "",
        "Seluruh data dibaca langsung dari basis data saat permintaan datang,",
        "bukan dari salinan berkala.",
        "",
        `Kejadian webhook yang tersedia: ${KEJADIAN_WEBHOOK.join(", ")}.`,
      ].join("\n"),
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    variable: [
      { key: "baseUrl", value: dasar, type: "string" },
      { key: "apiKey", value: "", type: "string" },
    ],
    item: KATALOG_API.map(permintaan),
  }
}
