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
      /*
       * Tabel jawaban tiap operasi diberi NAMA.
       *
       * Swagger memasang role="region" pada tabel itu tanpa label apa pun.
       * Selama hanya satu operasi dibuka hal itu tidak terlihat; begitu dua
       * operasi dijalankan, ada dua landmark region tanpa nama di satu
       * halaman -- tidak unik (axe: landmark-unique), dan bagi pembaca layar
       * keduanya hanya "region", tidak bisa dibedakan.
       *
       * Namanya diambil dari ringkasan operasinya sendiri, bukan dari id,
       * supaya yang terdengar sama dengan yang terbaca di layar.
       */
      for (const tabel of document.querySelectorAll('[id$="_responses"][role="region"]')) {
        if (tabel.getAttribute("aria-label")) continue
        const blok = tabel.closest(".opblock")
        const metode = blok?.querySelector(".opblock-summary-method")?.textContent?.trim()
        const jalur = blok?.querySelector(".opblock-summary-path")?.textContent?.trim()
        if (metode && jalur) tabel.setAttribute("aria-label", `Jawaban ${metode} ${jalur}`)
      }

      /*
       * Warna angka di dalam contoh JSON: #d36363 di atas #333333 hanya
       * 3,45 banding 1 (WCAG 1.4.3 meminta 4,5).
       *
       * Diperbaiki di sini, bukan di berkas CSS, karena Swagger memasangnya
       * sebagai gaya SEBARIS pada tiap <span> -- aturan lembar gaya tidak
       * bisa menangnya, dan satu-satunya cara lewat CSS adalah menyeragamkan
       * semua token dengan !important, yang menghapus pewarnaan sintaksnya.
       * Tiga warna token lainnya (putih 21,0, hijau 10,2, jingga 8,0) sudah
       * lolos dan sengaja tidak disentuh.
       *
       * Hanya terlihat pada jawaban yang BERISI angka. Uji lokal pertama
       * tidak menemukannya karena satu-satunya jawaban yang dijalankan
       * adalah 401, yang badannya hanya dua untai teks; ia baru muncul saat
       * dicoba di produksi. Gerbangnya kini ikut menjalankan endpoint publik
       * supaya jawaban berisi data benar-benar pernah diperiksa.
       */
      for (const angka of document.querySelectorAll<HTMLElement>(".microlight span")) {
        if (angka.style.color === "rgb(211, 99, 99)") angka.style.color = "#f2a0a0" /* 6,20 */
      }

      for (const kode of document.querySelectorAll<HTMLElement>(".microlight")) {
        const meluber = kode.scrollWidth > kode.clientWidth || kode.scrollHeight > kode.clientHeight
        /*
         * Hanya tabindex -- TANPA role="region".
         *
         * Versi pertama menambahkan role="region" dengan label "Contoh JSON"
         * pada tiap blok. Begitu ada dua blok di layar, jadilah dua landmark
         * bernama sama, yang melanggar aturan lain (landmark-unique). Aturan
         * yang ingin dipenuhi di sini hanya meminta isinya bisa difokus,
         * bukan diberi peran.
         */
        if (meluber && !kode.hasAttribute("tabindex")) kode.setAttribute("tabindex", "0")
      }
    }
    rapikan()
    const wadah = document.getElementById("swagger")
    /*
     * `attributes` ikut diamati, bukan hanya `childList`.
     *
     * Pewarna sintaks Swagger menyisipkan <span> lebih dulu lalu MENYETEL
     * `style.color` sesudahnya. Dengan childList saja, pengamat ini berjalan
     * di antara kedua langkah itu, melihat span yang warnanya belum ada, dan
     * tidak melakukan apa-apa -- perbaikan yang tampak terpasang tetapi tidak
     * pernah mengubah satu piksel pun. Gerbang a11y yang menangkapnya.
     *
     * Tidak menjadi gelung tak berujung: tulisan balasannya mengubah warna
     * menjadi nilai yang tidak lagi cocok dengan syaratnya, jadi lintasan
     * berikutnya tidak menulis apa-apa.
     */
    if (wadah) {
      new MutationObserver(rapikan).observe(wadah, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style"],
      })
    }
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
