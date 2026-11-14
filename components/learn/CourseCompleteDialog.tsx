"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { Award, PartyPopper } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/components/i18n/LocaleProvider"

function kunciSimpan(courseId: string) {
  return `sanggabiz:selesai:${courseId}`
}

function berlangganan(perubahan: () => void) {
  window.addEventListener("storage", perubahan)
  return () => window.removeEventListener("storage", perubahan)
}

/**
 * Ucapan selamat saat kursus selesai, muncul SEKALI.
 *
 * Sebelum ini momen selesainya lewat tanpa suara. Sertifikatnya terbit --
 * terukur, ada barisnya di basis data -- tetapi tidak ada yang memberi tahu
 * peserta, dan satu-satunya tempat kabarnya muncul adalah panel yang baru
 * terlihat kalau orangnya kebetulan menavigasi melewati pelajaran terakhir.
 * Pencapaian yang tidak diakui terasa seperti tidak terjadi.
 *
 * Dibaca lewat `useSyncExternalStore`, BUKAN effect + setState: localStorage
 * adalah penyimpan di luar React, dan membacanya lewat effect memicu render
 * berantai yang ditolak React Compiler. Polanya menyalin `ConsentNudge`.
 * Snapshot server "sudah dilihat" supaya dialognya tidak berkedip muncul lalu
 * hilang saat hidrasi.
 *
 * Ditandai sudah dilihat saat DITUTUP, bukan saat dibuka. Kalau peserta
 * berpindah halaman sebelum sempat membacanya, ia memang belum melihatnya,
 * dan memunculkannya lagi lebih benar daripada menelannya.
 *
 * "Sekali" tersimpan per peramban, bukan di basis data. Konsekuensinya jujur:
 * membuka kursus yang sama di perangkat lain memunculkannya sekali lagi.
 * Untuk sebuah ucapan selamat itu sepadan -- menambah kolom dan migrasinya
 * demi menandai perayaan sudah dilihat bukan ukuran yang sebanding. Kalau
 * kelak harus benar-benar sekali seumur hidup, tempatnya satu kolom di
 * `enrollments`.
 */
export function CourseCompleteDialog({
  courseId,
  courseTitle,
  hasCertificate,
}: {
  courseId: string
  courseTitle: string
  hasCertificate: boolean
}) {
  const { t } = useI18n()

  const sudahDilihat = useSyncExternalStore(
    berlangganan,
    () => {
      try {
        return localStorage.getItem(kunciSimpan(courseId)) === "1"
      } catch {
        // Penyimpanan diblokir (mode penyamaran): tampilkan saja. Paling buruk
        // ia muncul lagi di kunjungan berikutnya.
        return false
      }
    },
    () => true
  )

  // Peristiwa "storage" tidak menyala di tab yang menulisnya sendiri, jadi
  // penutupan di tab ini butuh state biasa.
  const [baruDitutup, setBaruDitutup] = useState(false)

  function tandaiDilihat() {
    setBaruDitutup(true)
    try {
      localStorage.setItem(kunciSimpan(courseId), "1")
    } catch {
      // Tidak bisa diingat -- tidak apa-apa, ini hanya ucapan selamat.
    }
  }

  const buka = !sudahDilihat && !baruDitutup

  return (
    <Dialog open={buka} onOpenChange={(next) => !next && tandaiDilihat()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="mb-1.5 flex size-11 items-center justify-center rounded-full bg-primary/10">
            <PartyPopper className="size-5 text-primary" aria-hidden="true" />
          </div>
          <DialogTitle>{t.player.congratsTitle}</DialogTitle>
          <DialogDescription>
            {t.player.congratsBody.replace("{kursus}", courseTitle)}
          </DialogDescription>
        </DialogHeader>

        {hasCertificate && (
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
            <Award className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t.player.congratsCertificate}</p>
          </div>
        )}

        <div className="mt-1 flex flex-wrap gap-2.5">
          {hasCertificate && (
            <Button
              className="bg-brand-gradient text-white hover:brightness-105"
              render={<Link href="/learner/profile?tab=certificates" />}
              nativeButton={false}
              // Ditandai juga di sini: menuju sertifikat berarti pesannya sudah
              // sampai, dan berpindah halaman tidak memicu onOpenChange.
              onClick={tandaiDilihat}
            >
              {t.player.viewCertificate}
            </Button>
          )}
          <Button variant="outline" onClick={tandaiDilihat}>
            {t.player.congratsClose}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
