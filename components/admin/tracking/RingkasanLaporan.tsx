"use client"

import { useState, useTransition } from "react"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StatusMessage } from "@/components/ui/status-message"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { buatRingkasanAction } from "@/app/admin/tracking/laporan-actions"
import type { RingkasanLaporan as Isi } from "@/lib/ai/report-summary"

/**
 * Ringkasan AI di atas tabel laporan departemen.
 *
 * **Tabelnya tetap ada dan tetap utuh.** Ringkasan ini bacaan cepat, bukan
 * pengganti angkanya -- dan kalimat terakhir di kotak ini mengatakan terus
 * terang bahwa bila keduanya berbeda, tabelnya yang benar. Ringkasan yang
 * menyamar sebagai sumber angka adalah cara tercepat membuat orang berhenti
 * memeriksa.
 *
 * Tombolnya diberi ikon ✨ dan kata "AI" di labelnya karena permintaan
 * pemilik: pemakaian AI harus kelihatan, bukan tersamar sebagai fitur biasa.
 */
export function RingkasanLaporan({
  isi,
  dibuatPada,
  basi,
  bisaDiringkas,
}: {
  isi: Isi | null
  dibuatPada: string | null
  /** Angkanya sudah berubah sejak ringkasan ini dibuat. */
  basi: boolean
  /** False bila tidak ada satu pun departemen yang angkanya tampil. */
  bisaDiringkas: boolean
}) {
  const { t, locale } = useI18n()
  const [pending, startTransition] = useTransition()
  const [galat, setGalat] = useState("")

  const waktu = dibuatPada
    ? new Date(dibuatPada).toLocaleString(locale === "en" ? "en-US" : "id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold">{t.laporanDepartemen.summaryTitle}</h3>
        {bisaDiringkas && (
          <Button
            size="sm"
            variant="outline"
            pending={pending}
            pendingLabel={t.laporanDepartemen.summaryMaking}
            onClick={() =>
              startTransition(async () => {
                setGalat("")
                const r = await buatRingkasanAction()
                if (!r.ok) setGalat(r.error)
              })
            }
          >
            <Sparkles className="size-4" aria-hidden />
            {isi ? t.laporanDepartemen.summaryAgain : t.laporanDepartemen.summaryMake}
          </Button>
        )}
      </div>

      <StatusMessage className="mt-2">{galat}</StatusMessage>

      {!isi ? (
        <p className="mt-2 text-sm text-muted-foreground">{t.laporanDepartemen.summaryNone}</p>
      ) : (
        <div className="mt-2 space-y-3 text-sm">
          <p className="leading-relaxed">{isi.ringkas}</p>

          {isi.temuan.length > 0 && (
            <div>
              <p className="font-semibold">{t.laporanDepartemen.summaryFindings}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                {isi.temuan.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          {isi.saran.length > 0 && (
            <div>
              <p className="font-semibold">{t.laporanDepartemen.summaryActions}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                {isi.saran.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
            {waktu && <p>{t.laporanDepartemen.summaryMadeAt.replace("{waktu}", waktu)}</p>}
            {/*
              Status tidak pernah hanya warna (STANDAR-UMPAN-BALIK-UI R9):
              "basi" ditulis sebagai kalimat, bukan ditandai titik kuning.
            */}
            {basi && <p className="font-medium text-foreground">{t.laporanDepartemen.summaryStale}</p>}
            <p>{t.laporanDepartemen.summaryNote}</p>
          </div>
        </div>
      )}
    </div>
  )
}
