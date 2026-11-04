"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { StatusMessage } from "@/components/ui/status-message"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { enroll } from "@/app/learner/courses/actions"

export type EnrollState = "anon" | "dapat-daftar" | "berbayar" | "terdaftar"

/**
 * Tombol daftar di halaman pratinjau publik.
 *
 * Empat keadaan, dan tidak satu pun berbohong tentang apa yang akan terjadi:
 *
 * - **anon** -- tautan ke halaman masuk yang membawa kembali ke sini. Tombol
 *   yang berbunyi "Daftar" lalu ternyata meminta masuk adalah janji yang
 *   meleset, jadi tombolnya memang berbunyi "Masuk untuk mendaftar" dan
 *   keterangannya menyebutkan bahwa ia akan kembali.
 * - **dapat-daftar** -- sudah masuk, kelasnya publik: satu klik, langsung ke
 *   ruang belajar.
 * - **berbayar** -- `enroll` menolak kursus berharga karena belum ada gerbang
 *   pembayaran. Daripada menampilkan tombol yang pasti gagal, keadaannya
 *   dinyatakan di muka.
 * - **terdaftar** -- tautan melanjutkan belajar.
 */
export function EnrollPanel({
  courseId,
  state,
  priceLabel,
}: {
  courseId: string
  state: EnrollState
  priceLabel: string
}) {
  const { t } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (state === "terdaftar") {
    return (
      <div className="flex flex-col gap-2">
        <StatusMessage variant="success" className="rounded-lg bg-success px-3 py-2 text-sm">
          {t.catalog.alreadyEnrolled}
        </StatusMessage>
        <Button
          size="xl"
          className="w-full bg-brand-gradient text-white hover:brightness-105"
          render={<Link href={`/learn/${courseId}`} />}
          nativeButton={false}
        >
          {t.catalog.continueLearning}
        </Button>
      </div>
    )
  }

  if (state === "anon") {
    // Alamat kembali dibawa lewat ?next=, dan di sisi penerima ia masih
    // disaring safeNextPath() -- parameter yang datang dari luar tidak pernah
    // dipercaya apa adanya untuk mengarahkan orang.
    const next = encodeURIComponent(`/kelas/${courseId}`)
    return (
      <div className="flex flex-col gap-2">
        <Button
          size="xl"
          className="w-full bg-brand-gradient text-white hover:brightness-105"
          render={<Link href={`/auth/login?next=${next}`} />}
          nativeButton={false}
        >
          {t.catalog.loginToEnroll}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t.catalog.loginNote}</p>
      </div>
    )
  }

  if (state === "berbayar") {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-center text-sm font-semibold">
          {priceLabel}
        </div>
        <StatusMessage className="rounded-lg bg-muted px-3 py-2 text-sm">
          {t.catalog.paidNotice}
        </StatusMessage>
      </div>
    )
  }

  return (
    <Button
      size="xl"
      className="w-full bg-brand-gradient text-white hover:brightness-105"
      pending={pending}
      pendingLabel={t.catalog.enrollingNow}
      onClick={() =>
        startTransition(async () => {
          const result = await enroll(courseId)
          if (!result.ok) {
            toast.error(result.error)
            return
          }
          // Langsung ke ruang belajar: pendaftaran yang berhasil lalu
          // meninggalkan orang di halaman pemasaran yang sama membuat mereka
          // menebak apakah tombolnya bekerja.
          router.push(`/learn/${courseId}`)
        })
      }
    >
      {t.catalog.enrollFree}
    </Button>
  )
}
