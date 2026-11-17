import type { Metadata } from "next"

import { SwaggerUI } from "@/components/api-docs/SwaggerUI"

/**
 * Dokumentasi API, terbuka untuk umum.
 *
 * Sengaja di luar /admin: yang membacanya tim IT pelanggan yang belum punya
 * akun di sini, dan dokumentasi yang baru bisa dibaca sesudah dibuatkan akun
 * adalah dokumentasi yang tidak dibaca.
 *
 * Tidak ada kunci di halaman ini, dan itu keputusan yang disengaja. Rute
 * publik bisa langsung ditekan "Try it out" oleh siapa pun; rute /api/v1
 * memerlukan kunci yang diketik sendiri lewat tombol Authorize. Menempelkan
 * kunci yang berlaku di halaman yang bisa dibuka siapa saja akan membuka
 * nama dan surel seluruh peserta kepada siapa pun yang menemukan alamatnya.
 *
 * Prosanya Indonesia, nama ruas dan parameter tetap Inggris -- aturan yang
 * sama dengan halaman Petunjuk API dan koleksi Postman.
 */

export const metadata: Metadata = {
  title: "Dokumentasi API — Sanggabiz Academy",
  description:
    "Dokumentasi terbuka API Sanggabiz Academy: kursus, peserta, kemajuan, nilai, dan sertifikat.",
}

export default function DokumentasiApiPage() {
  return (
    /* `id="main-content"` dan `tabIndex={-1}` wajib: tata letak akar memasang
       pintasan "Lewati ke konten" yang menunjuk ke sana, dan halaman publik di
       luar LearnerShell/AdminShell tidak mewarisi <main> dari mana pun. */
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-5xl px-4 py-8 outline-none">
      <h1 className="text-3xl font-bold">Dokumentasi API Sanggabiz Academy</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Untuk tim IT yang menghubungkan sistem internal perusahaan ke LMS ini. Seluruh data
        dibaca langsung saat permintaan datang, bukan dari salinan berkala.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <section className="rounded-lg border border-border p-3.5">
          <h2 className="text-sm font-semibold">Bisa dicoba sekarang juga</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Endpoint bertanda <strong>Publik</strong> terbuka tanpa kunci. Tekan{" "}
            <strong>Try it out</strong> lalu <strong>Execute</strong>, dan jawabannya datang
            dari basis data yang sedang berjalan. Isinya hanya angka agregat; tidak ada nama,
            surel, atau id orang.
          </p>
        </section>
        <section className="rounded-lg border border-border p-3.5">
          <h2 className="text-sm font-semibold">Perlu kunci</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Endpoint <strong>API v1</strong> memuat data peserta, jadi memerlukan kunci dari
            pengelola Sanggabiz. Tekan <strong>Authorize</strong> di kanan atas dan tempel
            kunci Anda yang diawali <code>sgb_</code>. Kunci itu tidak ikut tersimpan di
            peramban.
          </p>
        </section>
      </div>

      <SwaggerUI spekUrl="/api/openapi.json" />
    </main>
  )
}
