"use client"

import { useEffect, useRef } from "react"

/**
 * Mencatat berapa lama sebuah pelajaran benar-benar dibuka.
 *
 * Tiga hal yang membuat angkanya berarti, dan tanpa ketiganya angka ini
 * hanya terlihat seperti data:
 *
 * 1. **Hanya waktu yang terlihat yang dihitung.** Tab yang pindah ke latar
 *    menghentikan hitungan lewat Page Visibility API. Tanpa ini, satu tab yang
 *    ditinggal semalaman tercatat sebagai dua belas jam belajar dan merusak
 *    seluruh rata-rata.
 * 2. **Ada ambang bawah.** Melintas sebentar saat mencari pelajaran lain bukan
 *    "membuka pelajaran". Di bawah lima detik tidak dicatat sama sekali.
 * 3. **Dikirim dengan `sendBeacon` pada `pagehide`, bukan lewat pembersihan
 *    React.** Pembersihan komponen tidak berjalan pada navigasi penuh, dan
 *    permintaan biasa yang dikirim saat halaman ditinggalkan sering dibatalkan
 *    peramban -- keduanya membuang justru pengamatan paling bermakna: peserta
 *    selesai membaca lalu pindah. `pagehide` juga dipilih di atas
 *    `beforeunload`, yang sering tidak pernah berjalan di peramban ponsel.
 *
 * Komponen ini tidak dirender sama sekali bila peserta belum menyetujui
 * pencatatan. Penjagaan sesungguhnya tetap ada di policy basis data -- layar
 * yang lupa memeriksa bukan penjaga.
 */
export function LessonTracker({
  courseId,
  lessonId,
}: {
  courseId: string
  lessonId: string
}) {
  const terlihatSejak = useRef<number | null>(null)
  const terkumpul = useRef(0)

  useEffect(() => {
    terlihatSejak.current = document.visibilityState === "visible" ? Date.now() : null
    terkumpul.current = 0

    function jedaHitungan() {
      if (terlihatSejak.current === null) return
      terkumpul.current += Date.now() - terlihatSejak.current
      terlihatSejak.current = null
    }

    function kirim() {
      jedaHitungan()
      const detik = Math.round(terkumpul.current / 1000)
      terkumpul.current = 0
      if (detik < 5) return

      // Dibatasi sama dengan batas kolomnya; lebih dari satu jam pada satu
      // pelajaran hampir pasti tab yang terlupa, bukan belajar.
      const muatan = JSON.stringify({
        courseId,
        lessonId,
        durationSeconds: Math.min(detik, 3600),
      })

      const terkirim =
        typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function"
          ? navigator.sendBeacon("/api/learning-events", new Blob([muatan], { type: "application/json" }))
          : false

      // `keepalive` adalah cadangan untuk peramban tanpa sendBeacon: ia juga
      // bertahan melewati navigasi, hanya dengan batas ukuran yang lebih ketat.
      if (!terkirim) {
        void fetch("/api/learning-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: muatan,
          keepalive: true,
        }).catch(() => {})
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        terlihatSejak.current = Date.now()
      } else {
        kirim()
      }
    }

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", kirim)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", kirim)
      // Berpindah pelajaran lewat navigasi sisi klien juga mengakhiri
      // pengamatan pelajaran ini.
      kirim()
    }
  }, [courseId, lessonId])

  return null
}
