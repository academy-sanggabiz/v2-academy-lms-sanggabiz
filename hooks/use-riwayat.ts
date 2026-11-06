"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/** Berapa lama dua perubahan pada medan yang sama masih dianggap satu langkah. */
const JEDA_GABUNG_MS = 700

/**
 * Riwayat suntingan: urung dan ulang.
 *
 * **Kenapa bukan satu `useState` biasa.** Menyusun halaman adalah pekerjaan
 * mencoba: menggeser bagian, mengganti kalimat, lalu memutuskan yang tadi
 * lebih baik. Tanpa urung, satu-satunya jalan kembali adalah mengetik ulang
 * dari ingatan -- dan itu membuat orang berhenti mencoba.
 *
 * **Penggabungan per medan, bukan per penekanan tombol.** Setiap huruf yang
 * diketik memanggil `set`. Kalau tiap panggilan jadi satu langkah, satu kali
 * urung hanya menghapus satu huruf dan tombolnya praktis tidak berguna.
 * Perubahan berturut-turut pada medan yang SAMA dalam 700ms digabung jadi satu
 * langkah; berpindah medan selalu memulai langkah baru. Jadi satu kali urung
 * membatalkan "satu hal yang saya lakukan", bukan satu kejadian papan ketik.
 *
 * **Cabang masa depan dibuang saat menyunting setelah urung**, seperti
 * penyunting teks mana pun: setelah mundur tiga langkah lalu mengetik sesuatu
 * yang baru, ketiga langkah yang ditinggalkan tidak bisa diulang lagi.
 */
export function useRiwayat<T>(awal: T) {
  const [tumpukan, setTumpukan] = useState<T[]>([awal])
  const [posisi, setPosisi] = useState(0)
  const gabungTerakhir = useRef<{ kunci: string; waktu: number } | null>(null)

  const nilai = tumpukan[posisi]

  const set = useCallback(
    (ubah: T | ((sekarang: T) => T), kunciGabung?: string) => {
      const sekarang = Date.now()
      const gabung =
        kunciGabung !== undefined &&
        gabungTerakhir.current?.kunci === kunciGabung &&
        sekarang - gabungTerakhir.current.waktu < JEDA_GABUNG_MS

      gabungTerakhir.current =
        kunciGabung === undefined ? null : { kunci: kunciGabung, waktu: sekarang }

      setTumpukan((riwayat) => {
        const dasar = riwayat[posisi]
        const berikut =
          typeof ubah === "function" ? (ubah as (s: T) => T)(dasar) : ubah
        if (Object.is(berikut, dasar)) return riwayat

        if (gabung) {
          // Menimpa langkah terakhir, bukan menambah: masih "satu hal".
          const disalin = riwayat.slice(0, posisi + 1)
          disalin[posisi] = berikut
          return disalin
        }
        // Semua yang ada di depan posisi sekarang dibuang -- cabang itu
        // ditinggalkan begitu penyusun menyunting lagi.
        return [...riwayat.slice(0, posisi + 1), berikut]
      })

      if (!gabung) setPosisi((p) => p + 1)
    },
    [posisi]
  )

  const bisaUrung = posisi > 0
  const bisaUlang = posisi < tumpukan.length - 1

  const urung = useCallback(() => {
    gabungTerakhir.current = null
    setPosisi((p) => Math.max(0, p - 1))
  }, [])

  const ulang = useCallback(() => {
    gabungTerakhir.current = null
    setPosisi((p) => Math.min(tumpukan.length - 1, p + 1))
  }, [tumpukan.length])

  /** Mengganti seluruh isi dan mengosongkan riwayat -- dipakai setelah memuat ulang dari server. */
  const ganti = useCallback((baru: T) => {
    gabungTerakhir.current = null
    setTumpukan([baru])
    setPosisi(0)
  }, [])

  // Ctrl+Z / Ctrl+Shift+Z (Cmd di Mac). Diabaikan saat fokus berada di medan
  // teks: di sana peramban punya urungnya sendiri untuk teks yang sedang
  // diketik, dan merebutnya justru membuat dua riwayat yang saling bertengkar.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return
      const fokus = document.activeElement as HTMLElement | null
      const diTeks =
        fokus &&
        (fokus.tagName === "INPUT" ||
          fokus.tagName === "TEXTAREA" ||
          fokus.isContentEditable)
      if (diTeks) return
      e.preventDefault()
      if (e.shiftKey) ulang()
      else urung()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [urung, ulang])

  return { nilai, set, urung, ulang, bisaUrung, bisaUlang, ganti }
}
