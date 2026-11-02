"use client"

import { useState, useTransition } from "react"
import { Bell, LineChart, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BusyRegion } from "@/components/ui/busy-region"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { StatusMessage } from "@/components/ui/status-message"
import { Switch } from "@/components/ui/switch"
import { PasswordInput } from "@/components/auth/PasswordInput"
import {
  changePassword,
  deleteAccount,
  setTrackingConsent,
  updateNotificationPref,
} from "@/app/learner/settings/actions"
import type { TrackingConsentState } from "@/lib/tracking-consent-server"
import { useI18n } from "@/components/i18n/LocaleProvider"

export function SettingsView({
  notificationEmailEnabled,
  trackingConsent,
}: {
  notificationEmailEnabled: boolean
  trackingConsent: TrackingConsentState
}) {
  const { t } = useI18n()
  const [isDeleting, startDeleting] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  return (
    <div>
      <div className="mb-6 text-3xl font-bold">{t.settings.title}</div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Penghapusan akun tidak dapat dibatalkan, jadi pengaturan lain ikut
            dikunci selama prosesnya (R15 kelas (d)): mengubah kata sandi akun
            yang sedang dihapus tidak pernah menjadi yang diinginkan pengguna.
            Tombol pemicunya sengaja tetap di luar wilayah ini, karena `inert`
            akan melempar fokus keyboard keluar (R18). */}
        <BusyRegion busy={isDeleting} label={t.settings.deletingAccount}>
          <div className="flex flex-col gap-6">
            <NotificationsCard initialEnabled={notificationEmailEnabled} />
            <TrackingConsentCard state={trackingConsent} />
            <SecurityCard />
          </div>
        </BusyRegion>
        <div className="flex flex-col gap-6">
          <DeleteAccountCard
            isPending={isDeleting}
            error={deleteError}
            onConfirm={() => {
              setDeleteError(null)
              startDeleting(async () => {
                const result = await deleteAccount()
                if (result?.error) setDeleteError(result.error)
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}

function NotificationsCard({ initialEnabled }: { initialEnabled: boolean }) {
  const { t } = useI18n()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="rounded-2xl border border-border bg-card p-7">
      <div className="mb-5 flex items-center gap-2.5 text-lg font-bold">
        <Bell className="size-[18px]" />
        {t.settings.notifications}
      </div>
      <div className="flex items-center justify-between gap-5">
        <div>
          <div className="text-sm font-semibold">{t.settings.emailNotifications}</div>
          {/*
            Pilihan ini tersimpan tapi belum ada yang membacanya: tidak ada
            pengirim email di sistem ini selain email autentikasi bawaan
            Supabase (lihat catatan di
            supabase/migrations/20260805000000_notifications.sql). Menjanjikan
            "terima kabar terbaru lewat email" berarti berjanji sesuatu yang
            tidak pernah datang, jadi keterangannya menyebut apa adanya.
          */}
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            {t.settings.emailNotificationsHint}
          </div>
        </div>
        <Switch
          aria-label={t.settings.emailNotifications}
          aria-busy={isPending || undefined}
          checked={enabled}
          disabled={isPending}
          onCheckedChange={(checked) => {
            setEnabled(checked)
            setStatus(null)
            startTransition(async () => {
              const result = await updateNotificationPref(checked)
              if (result?.error) {
                setEnabled(!checked)
                setStatus({ type: "error", message: result.error })
                return
              }
              setStatus({
                type: "success",
                message: checked ? t.settings.emailOn : t.settings.emailOff,
              })
            })
          }}
        />
      </div>
      {/*
       * Satu live region yang tetap, isinya saja yang berganti. Sebelumnya
       * keadaan "menyimpan" dan keadaan "hasil" adalah dua elemen berbeda yang
       * saling menggantikan, sehingga hasilnya sering tidak diumumkan sama
       * sekali: screen reader memantau elemen yang justru baru saja dilepas
       * (WCAG 2.2 SC 4.1.3).
       */}
      <p
        role="status"
        aria-live="polite"
        className={cn(
          "mt-2.5 flex min-h-5 items-center gap-1.5 text-sm",
          isPending
            ? "text-muted-foreground"
            : status?.type === "error"
              ? "text-destructive"
              : "text-success-foreground"
        )}
      >
        {isPending ? (
          <>
            <Spinner className="size-3.5" />
            Menyimpan…
          </>
        ) : (
          status?.message
        )}
      </p>
    </div>
  )
}

/**
 * Persetujuan pelacakan perilaku.
 *
 * Bawaannya MATI, dan itu bukan pilihan desain melainkan syarat: UU PDP
 * menuntut persetujuan diberikan sebelum pengumpulan, bukan diasumsikan
 * sampai ditolak. Karena itu tidak ada saklar yang sudah menyala di sini.
 *
 * Isinya sengaja panjang. Pemberitahuan yang ringkas memang lebih enak
 * dilihat, tetapi yang diwajibkan justru yang spesifik -- data apa, untuk
 * apa, berapa lama, siapa yang melihat. Meringkasnya sampai tidak menjawab
 * itu berarti persetujuannya tidak sah.
 */
function TrackingConsentCard({ state }: { state: TrackingConsentState }) {
  const { t } = useI18n()
  const [granted, setGranted] = useState(state.granted)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function ubah(nilai: boolean) {
    setError(null)
    setGranted(nilai)
    startTransition(async () => {
      const hasil = await setTrackingConsent(nilai)
      if (hasil.error) {
        setError(hasil.error)
        setGranted(!nilai)
      }
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <LineChart className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-bold">{t.tracking.cardTitle}</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        {t.tracking.cardHint}
      </p>

      <div className="space-y-3 text-xs">
        <div>
          <div className="font-semibold">{t.tracking.collected}</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
            {t.tracking.collectedItems.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-semibold">{t.tracking.purpose}</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
            {t.tracking.purposeItems.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-semibold">{t.tracking.notDone}</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
            {t.tracking.notDoneItems.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">{t.tracking.storedLabel}</span>{" "}
          {t.tracking.storage}{" "}
          <span className="font-semibold text-foreground">{t.tracking.whoSeesLabel}</span>{" "}
          {t.tracking.whoSees}
        </p>
        <p className="text-muted-foreground">{t.tracking.withdrawal}</p>
      </div>

      {error && (
        <div className="mt-3">
          <StatusMessage variant="error">{error}</StatusMessage>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
        <label htmlFor="tracking-consent" className="text-sm font-medium">
          {t.tracking.allow}
        </label>
        <div className="flex items-center gap-2">
          {pending && <Spinner />}
          <Switch
            id="tracking-consent"
            checked={granted}
            disabled={pending}
            onCheckedChange={ubah}
          />
        </div>
      </div>
      <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
        {granted
          ? t.tracking.stateOn
          : state.belumMemutuskan
            ? t.tracking.stateUndecided
            : t.tracking.stateOff}
      </p>
    </div>
  )
}

function SecurityCard() {
  const { t } = useI18n()
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="rounded-2xl border border-border bg-card p-7">
      <div className="mb-5 flex items-center gap-2.5 text-lg font-bold">
        <Shield className="size-[18px]" />
        {t.settings.security}
      </div>
      <div className="mb-2.5 text-sm font-semibold">{t.settings.changePassword}</div>
      <form
        action={(formData) => {
          setStatus(null)
          startTransition(async () => {
            const result = await changePassword(formData)
            if (result?.error) {
              setStatus({ type: "error", message: result.error })
            } else {
              setStatus({ type: "success", message: t.settings.passwordSaved })
              ;(document.getElementById("password-form") as HTMLFormElement)?.reset()
            }
          })
        }}
        id="password-form"
        className="flex gap-3"
      >
        <PasswordInput
          name="password"
          placeholder={t.settings.newPasswordPlaceholder}
          aria-label={t.newPassword.newPassword}
          className="flex-1"
          required
        />
        <Button
          type="submit"
          pending={isPending}
          pendingLabel="Menyimpan…"
          className="bg-brand-gradient text-white hover:brightness-105"
        >
          Simpan
        </Button>
      </form>
      <StatusMessage
        variant={status?.type === "error" ? "error" : "success"}
        className="mt-2.5"
      >
        {status?.message}
      </StatusMessage>
    </div>
  )
}

function DeleteAccountCard({
  isPending,
  error,
  onConfirm,
}: {
  isPending: boolean
  error: string | null
  onConfirm: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="rounded-2xl border border-border bg-card p-7">
      <div className="mb-5 text-lg font-bold">{t.settings.deleteAccount}</div>
      <div className="rounded-xl border border-[#f3d5d5] bg-[#fdf1f1] p-5">
        <div className="text-[14.5px] font-semibold text-destructive">{t.settings.deleteAccountHint}</div>
        <div className="mt-1 mb-3.5 text-[13px] text-destructive">
          {t.settings.deleteAccountWarning}
        </div>
        <StatusMessage className="mb-3">{error}</StatusMessage>
        <Button
          type="button"
          pending={isPending}
          pendingLabel="Menghapus…"
          className="w-full bg-destructive text-white hover:bg-destructive/90"
          onClick={() => {
            const confirmed = window.confirm(
              "Akun dan seluruh datanya akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan. Lanjutkan?"
            )
            if (!confirmed) return

            onConfirm()
          }}
        >
          Hapus Akun
        </Button>
        {isPending && (
          <p className="mt-3 text-[13px] text-destructive">
            Pengaturan lain dikunci. Jangan tutup halaman ini sampai penghapusan selesai.
          </p>
        )}
      </div>
    </div>
  )
}
