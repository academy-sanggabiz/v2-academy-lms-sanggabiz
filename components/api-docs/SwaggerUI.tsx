"use client"

import Script from "next/script"
import { useRef } from "react"

// Diimpor, bukan dipasang sebagai <link> ke public/: Next lalu ikut
// mengurusnya seperti CSS lain, dan hanya halaman ini yang memuatnya.
// Aman dipakai bersama gaya kita -- 2.605 dari 2.610 aturannya diawali
// `.swagger-ui`, dan lima sisanya langkah @keyframes.
import "swagger-ui-dist/swagger-ui.css"
// Dimuat SESUDAH gaya bawaan supaya perbaikan kontrasnya menang.
import "./swagger-sanggabiz.css"

/**
 * Penampil Swagger UI.
 *
 * Berkasnya disajikan dari domain sendiri (/swagger/...), bukan dari CDN --
 * lihat alasannya di scripts/salin-swagger.mjs.
 *
 * Dipasang lewat onLoad milik <Script>, bukan di dalam useEffect: pemasangan
 * ini bergantung pada SATU peristiwa (berkasnya selesai diunduh), bukan pada
 * perubahan state React, dan efek yang menunggu global muncul harus memutar
 * pengatur waktu untuk tahu kapan ia ada.
 */

type SwaggerGlobal = {
  SwaggerUIBundle?: ((opsi: Record<string, unknown>) => void) & {
    presets: { apis: unknown }
  }
}

export function SwaggerUI({ spekUrl }: { spekUrl: string }) {
  // Penjaga pasang-sekali: pada navigasi klien, <Script> bisa memanggil
  // onLoad lagi untuk berkas yang sudah ada di memori, dan Swagger yang
  // dipasang dua kali menumpuk dua salinan dokumen di layar.
  const sudahDipasang = useRef(false)

  function pasang() {
    if (sudahDipasang.current) return
    const w = window as unknown as SwaggerGlobal
    if (!w.SwaggerUIBundle) return
    sudahDipasang.current = true

    w.SwaggerUIBundle({
      url: spekUrl,
      dom_id: "#swagger",
      presets: [w.SwaggerUIBundle.presets.apis],
      layout: "BaseLayout",
      /*
       * Tautan dalam dimatikan, dan itu bukan pilihan gaya.
       *
       * Dengan deepLinking menyala, Swagger membungkus jalur tiap operasi
       * dengan <a> DI DALAM tombol ringkasannya -- kendali interaktif di
       * dalam kendali interaktif, yang membuat pembaca layar mengumumkan dua
       * hal untuk satu benda (axe: nested-interactive, serius, 6 tempat).
       * Yang hilang hanya alamat per-operasi; daftar endpoint di halaman ini
       * pendek dan seluruhnya terlihat sekaligus.
       */
      deepLinking: false,
      tryItOutEnabled: true,
      /*
       * Kunci TIDAK disimpan di peramban.
       *
       * Bawaannya Swagger menaruh apa yang diketik di tombol Authorize ke
       * localStorage dan memakainya lagi pada kunjungan berikutnya. Halaman
       * ini dipakai saat presentasi, sering di komputer pinjaman atau layar
       * bersama; kunci yang tertinggal di sana bisa dipakai orang berikutnya
       * yang membuka alamat yang sama.
       */
      persistAuthorization: false,
      // Daftar "Models" mentah di bawah halaman membingungkan pembaca yang
      // bukan pemrogram. Bentuk tiap ruas tetap terlihat di dalam contoh
      // jawaban masing-masing endpoint.
      defaultModelsExpandDepth: -1,
      docExpansion: "list",
    })

    /*
     * Swagger membungkus daftar operasinya dengan <main id="operations">.
     * Halaman ini sudah punya <main> sendiri -- tujuan pintasan "Lewati ke
     * konten" -- jadi tanpa ini ada dua landmark utama di satu halaman, dan
     * yang satu bersarang di dalam yang lain (axe: landmark-unique, dan HTML
     * memang melarang <main> di dalam <main>).
     *
     * Diturunkan jadi region bernama, bukan dihapus perannya: daftar endpoint
     * memang satu bagian tersendiri yang pantas bisa dilompati.
     *
     * Lewat MutationObserver, BUKAN sekali jalan sesudah SwaggerUIBundle():
     * fungsi itu hanya memulai render React-nya dan kembali sebelum satu
     * simpul pun ada, jadi versi sekali-jalan menyetel atribut pada elemen
     * yang belum lahir -- diam-diam tidak melakukan apa-apa, dan diukur
     * memang begitu. Pengamatnya dibiarkan hidup karena Swagger membangun
     * ulang bagian ini setiap operasi dibuka.
     */
    const rapikan = () => {
      const operasi = document.getElementById("operations")
      if (operasi && operasi.getAttribute("role") !== "region") {
        operasi.setAttribute("role", "region")
        operasi.setAttribute("aria-label", "Daftar endpoint")
      }

      /*
       * Tombol tutup pada dialog Authorize dikirim tanpa teks sama sekali --
       * hanya sebuah ikon (axe: button-name, KRITIS). Bagi pembaca layar ia
       * tombol tanpa nama di dalam dialog yang menutup seluruh halaman.
       */
      for (const tutup of document.querySelectorAll(".close-modal")) {
        if (!tutup.getAttribute("aria-label")) tutup.setAttribute("aria-label", "Tutup")
      }

      /*
       * Contoh JSON yang panjang bisa digulir mendatar, tetapi tidak bisa
       * dicapai papan ketik: orang yang tidak memakai tetikus tidak punya
       * cara menggulirnya (axe: scrollable-region-focusable). Diberi
       * tabindex hanya pada yang BENAR-BENAR meluber -- memberikannya ke
       * semua blok kode menambah perhentian Tab yang tidak ada gunanya.
       */
      for (const kode of document.querySelectorAll<HTMLElement>(".microlight")) {
        const meluber = kode.scrollWidth > kode.clientWidth || kode.scrollHeight > kode.clientHeight
        if (meluber && !kode.hasAttribute("tabindex")) {
          kode.setAttribute("tabindex", "0")
          kode.setAttribute("role", "region")
          kode.setAttribute("aria-label", "Contoh JSON")
        }
      }
    }
    rapikan()
    const wadah = document.getElementById("swagger")
    if (wadah) new MutationObserver(rapikan).observe(wadah, { childList: true, subtree: true })
  }

  return (
    <>
      <div id="swagger" className="swagger-sanggabiz">
        {/* Terlihat hanya sampai Swagger menggantinya. Kalau berkasnya gagal
            dimuat, inilah yang tertinggal di layar -- jadi isinya harus
            menjelaskan keadaan, bukan sekadar "Memuat...". */}
        <p className="text-sm text-muted-foreground">
          Memuat dokumentasi. Kalau bagian ini tidak berganti dalam beberapa detik, dokumen
          mentahnya tetap bisa dibuka di{" "}
          <a className="underline" href={spekUrl}>
            {spekUrl}
          </a>
          .
        </p>
      </div>
      <Script src="/swagger/swagger-ui-bundle.js" strategy="afterInteractive" onReady={pasang} onLoad={pasang} />
    </>
  )
}
