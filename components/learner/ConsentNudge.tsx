"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { LineChart, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/components/i18n/LocaleProvider"

const KUNCI_SIMPAN = "sanggabiz.ajakan-pelacakan.disembunyikan"

/**
 * Ajakan sekali-tampil menuju saklar persetujuan pelacakan.
 *
 * Ada karena satu angka: nol dari empat peserta menyetujui pencatatan — bukan
 * karena menolak, melainkan karena tidak ada yang tahu saklarnya ada di
 * Pengaturan. Persetujuan yang tidak pernah ditanyakan bukan penolakan.
 *
 * Batas-batas yang menjaganya tetap ajakan, bukan pola gelap:
 *
 * - **Tidak memutus apa pun.** Kartu biasa di dasbor, bukan modal; belajar
 *   jalan terus tanpa menyentuhnya.
 * - **Tidak mengambil persetujuan di sini.** Tombolnya menuju pemberitahuan
 *   lengkap di Pengaturan — UU PDP mensyaratkan pemberitahuan yang spesifik
 *   SEBELUM persetujuan, dan ringkasan dua kalimat bukan pemberitahuan.
 * - **"Nanti saja" dihormati.** Sekali disembunyikan, tidak muncul lagi di
 *   peramban ini. Kartu yang kembali terus adalah paksaan pelan-pelan.
 * - Komponen ini hanya dirender saat peserta BELUM pernah memutuskan;
 *   keputusan apa pun (izinkan atau tolak) menghilangkannya di semua
 *   perangkat.
 */
function berlangganan(perubahan: () => void) {
  window.addEventListener("storage", perubahan)
  return () => window.removeEventListener("storage", perubahan)
}

/** Sudah pernah disembunyikan di peramban ini? Dibaca lewat
 *  useSyncExternalStore, bukan effect: localStorage adalah penyimpan di luar
 *  React, dan membacanya lewat effect + setState memicu render berantai yang
 *  ditolak React Compiler. Snapshot server "true" (tersembunyi) supaya kartu
 *  tidak berkedip muncul-hilang saat hidrasi. */
function dibacaTersembunyi(): boolean {
  try {
    return localStorage.getItem(KUNCI_SIMPAN) !== null
  } catch {
    // Penyimpanan diblokir (mode privat): tampilkan saja; paling buruk kartu
    // muncul lagi di kunjungan berikutnya.
    return false
  }
}

export function ConsentNudge() {
  const { t } = useI18n()
  const tersimpanTersembunyi = useSyncExternalStore(berlangganan, dibacaTersembunyi, () => true)
  // Peristiwa "storage" tidak menyala di tab yang menulisnya sendiri, jadi
  // penutupan di tab ini butuh state biasa.
  const [baruDitutup, setBaruDitutup] = useState(false)

  function sembunyikan() {
    setBaruDitutup(true)
    try {
      localStorage.setItem(KUNCI_SIMPAN, new Date().toISOString())
    } catch {
      // Tidak bisa diingat -- tidak apa-apa, ini hanya ajakan.
    }
  }

  if (tersimpanTersembunyi || baruDitutup) return null

  return (
    <section
      aria-label={t.tracking.nudgeTitle}
      className="flex flex-wrap items-start gap-3 rounded-2xl border border-border bg-card p-4 sm:items-center"
    >
      <LineChart className="mt-0.5 size-4 shrink-0 text-ring sm:mt-0" aria-hidden />
      <div className="min-w-0 flex-1 basis-60">
        <p className="text-sm font-semibold">{t.tracking.nudgeTitle}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{t.tracking.nudgeBody}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href="/learner/settings#pelacakan" />}
        >
          {t.tracking.nudgeAction}
        </Button>
        <Button size="sm" variant="ghost" onClick={sembunyikan} aria-label={t.tracking.nudgeDismiss}>
          <X className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">{t.tracking.nudgeDismiss}</span>
        </Button>
      </div>
    </section>
  )
}
