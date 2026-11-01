"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { StatusMessage } from "@/components/ui/status-message"
import type { CertificateDefaults } from "@/lib/certificate-settings"
import type { CourseCertificateSettings } from "@/lib/courses-admin"

/**
 * Pratinjau sertifikat, dirender server sebagai PDF yang sama persis dengan
 * hasil terbitnya.
 *
 * Perubahan pengaturan tidak langsung merender ulang: tiap render memanggil
 * server, dan merender di setiap ketikan berarti puluhan permintaan untuk
 * satu kalimat deskripsi. Yang dipakai jeda singkat setelah berhenti berubah,
 * jadi pratinjaunya tetap terasa langsung tanpa membanjiri server.
 */
export function CertificatePreview({
  course,
  defaults,
}: {
  course?: Partial<CourseCertificateSettings> | null
  defaults: CertificateDefaults
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const latest = useRef(0)

  const payload = JSON.stringify({ course: course ?? null, defaults })

  useEffect(() => {
    const token = ++latest.current
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch("/admin/certificates/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        })
        // Balasan yang sudah usang dibuang: tanpa ini, permintaan lambat yang
        // dikirim lebih dulu bisa menimpa hasil permintaan terbaru.
        if (token !== latest.current) return
        if (!response.ok) {
          const data = await response.json().catch(() => null)
          setError(data?.error ?? "Pratinjau gagal dibuat")
          return
        }
        const blob = await response.blob()
        if (token !== latest.current) return
        setError(null)
        setUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous)
          return URL.createObjectURL(blob)
        })
      } catch {
        if (token === latest.current) setError("Pratinjau gagal dibuat")
      } finally {
        if (token === latest.current) setLoading(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [payload])

  // Membersihkan object URL terakhir saat komponen dilepas, supaya blob-nya
  // tidak menggantung di memori tab.
  useEffect(() => () => setUrl((p) => (p ? (URL.revokeObjectURL(p), null) : null)), [])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Pratinjau</div>
          <p className="text-xs text-muted-foreground">
            Contoh hasil dengan data peserta sekadar contoh. Dirender memakai dokumen yang sama
            dengan sertifikat yang benar-benar diterbitkan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {loading ? "Memperbarui…" : ""}
          </span>
          {url && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={url} target="_blank" rel="noopener noreferrer" />}
            >
              Buka di tab baru
            </Button>
          )}
        </div>
      </div>

      {error && <StatusMessage variant="error">{error}</StatusMessage>}

      <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
        {url ? (
          <iframe src={url} title="Pratinjau sertifikat" className="h-[420px] w-full" />
        ) : (
          <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
            {error ? "Pratinjau tidak tersedia" : "Menyiapkan pratinjau…"}
          </div>
        )}
      </div>

      {/* Sebagian browser tidak punya penampil PDF bawaan dan menampilkan
          bingkai kosong. Tautan ini selalu ada supaya hasilnya tetap bisa
          dilihat, bukan hanya ketika kebetulan penampilnya tersedia. */}
      {url && (
        <p className="text-xs text-muted-foreground">
          Bingkainya kosong? Browser Anda mungkin tidak menampilkan PDF di dalam halaman — pakai
          &quot;Buka di tab baru&quot; untuk melihatnya.
        </p>
      )}
    </div>
  )
}
