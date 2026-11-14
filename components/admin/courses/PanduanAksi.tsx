"use client"

import { useState } from "react"
import { Check, Copy, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StatusMessage } from "@/components/ui/status-message"

/**
 * Dua tombol pada panduan yang hanya bisa hidup di peramban.
 *
 * Dipisah ke komponen klien sendiri supaya halamannya tetap Server Component:
 * seluruh isi panduan digambar di server, dan yang dikirim ke peramban cuma
 * dua tombol ini.
 */
export function TombolCetak() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden="true" />
      Cetak atau simpan PDF
    </Button>
  )
}

export function TombolSalin({ teks }: { teks: string }) {
  const [tersalin, setTersalin] = useState(false)
  const [galat, setGalat] = useState("")

  async function salin() {
    try {
      await navigator.clipboard.writeText(teks)
      setTersalin(true)
      setGalat("")
      // Dikembalikan supaya tombolnya bisa dipakai lagi tanpa memuat ulang.
      setTimeout(() => setTersalin(false), 4000)
    } catch {
      // Penyalinan bisa ditolak peramban, misalnya di halaman tanpa HTTPS.
      // Kegagalan diam akan membuat orang mengira perintahnya sudah tersalin
      // lalu menempelkan isi papan klip yang lama.
      setGalat("Penyalinan ditolak peramban. Pilih teksnya lalu salin manual.")
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={salin}>
        {tersalin ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
        {tersalin ? "Tersalin" : "Salin perintah"}
      </Button>
      <StatusMessage>{galat}</StatusMessage>
    </div>
  )
}
