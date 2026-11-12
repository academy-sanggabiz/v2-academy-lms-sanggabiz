"use client"

import { Sparkles } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

import { bahasJawabanSaya } from "@/app/learn/[courseId]/quiz-actions"
import { Button } from "@/components/ui/button"
import { StatusMessage } from "@/components/ui/status-message"
import { useI18n } from "@/components/i18n/LocaleProvider"
import type { ItemPembahasan } from "@/lib/ai/quiz-feedback"

/**
 * "Bahas jawaban saya" (F5).
 *
 * **Duduk setelah kotak adaptif, bukan menggantikannya.** Skor, kalimat
 * langkah berikutnya, penjelasan penyusun per soal, "Pelajari lagi", kotak
 * "3 kali salah", dan tombol "Coba lagi" tidak berubah sedikit pun. Bagian ini
 * hanya menambah satu lapisan: kenapa pilihan YANG ITU keliru.
 *
 * **Hanya berjalan saat tombolnya ditekan.** Tidak ada pemanggilan AI otomatis
 * saat halaman hasil dibuka -- peserta yang tidak memerlukannya tidak membayar
 * jatah hariannya, dan halaman hasil tidak jadi lambat untuk semua orang.
 *
 * **Labelnya fungsional, bukan pemasaran.** "Dibuat AI dan bisa keliru", bukan
 * lencana "AI-powered" -- standar v2 mencatat yang kedua sebagai anti-pattern.
 */
export function DiscussAnswers({
  attemptId,
  adaJawabanSalah,
  reviewLessons,
}: {
  attemptId: string
  adaJawabanSalah: boolean
  /** Tautan materi yang SAMA dengan yang dipakai "Pelajari lagi". */
  reviewLessons: { href: string; title: string }[]
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<ItemPembahasan[] | null>(null)
  const [galat, setGalat] = useState("")
  const [pending, startTransition] = useTransition()

  // Tanpa jawaban salah tidak ada yang bisa dibahas, jadi tombolnya tidak
  // dirender sama sekali -- bukan dirender lalu menolak.
  if (!adaJawabanSalah) return null

  function minta() {
    setGalat("")
    startTransition(async () => {
      const hasil = await bahasJawabanSaya(attemptId)
      if (!hasil.ok) {
        setGalat(hasil.error)
        return
      }
      setItems(hasil.items)
    })
  }

  return (
    <section
      aria-label={t.adaptive.discussTitle}
      className="rounded-xl border border-border bg-card p-4 text-left"
    >
      <p className="text-sm font-semibold">{t.adaptive.discussTitle}</p>

      {items === null ? (
        <div className="mt-2">
          <Button
            variant="outline"
            onClick={minta}
            pending={pending}
            pendingLabel={t.adaptive.discussWorking}
          >
            <Sparkles className="size-4" aria-hidden />
            {t.adaptive.discussButton}
          </Button>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.questionId} className="rounded-lg border border-muted p-3">
              <p className="text-sm">
                <span className="font-semibold">{t.adaptive.discussWhy}: </span>
                {item.kenapa}
              </p>
              <p className="mt-1.5 text-sm">
                <span className="font-semibold">{t.adaptive.discussConcept}: </span>
                {item.konsep}
              </p>
              <p className="mt-1.5 text-sm">
                <span className="font-semibold">{t.adaptive.discussNext}: </span>
                {item.langkah}
              </p>
            </li>
          ))}
        </ul>
      )}

      {items !== null && reviewLessons.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span>{t.adaptive.reason}</span>
          {reviewLessons.map((lesson) => (
            <Link
              key={lesson.href}
              href={lesson.href}
              className="font-semibold text-ring underline underline-offset-4"
            >
              {lesson.title}
            </Link>
          ))}
        </p>
      )}

      {/*
        Selalu dirender, bukan muncul bersama isinya: wilayah aria-live yang
        baru ada saat ada pesannya sering tidak diumumkan (STANDAR-UMPAN-BALIK
        R1).
      */}
      <StatusMessage className="mt-2">{galat}</StatusMessage>

      {items !== null && (
        <p className="mt-2 text-xs text-muted-foreground">{t.adaptive.discussAiNote}</p>
      )}
      {/* Disebut sebelum DAN sesudah: yang menekan tombol perlu tahu lebih dulu. */}
      <p className="mt-1 text-xs text-muted-foreground">{t.player.aiThirdParty}</p>
    </section>
  )
}
