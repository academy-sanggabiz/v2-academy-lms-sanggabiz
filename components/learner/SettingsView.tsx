"use client"

import { useState, useTransition } from "react"
import { Bell, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BusyRegion } from "@/components/ui/busy-region"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { StatusMessage } from "@/components/ui/status-message"
import { Switch } from "@/components/ui/switch"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { changePassword, deleteAccount, updateNotificationPref } from "@/app/learner/settings/actions"

export function SettingsView({
  notificationEmailEnabled,
}: {
  notificationEmailEnabled: boolean
}) {
  const [isDeleting, startDeleting] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  return (
    <div>
      <div className="mb-6 text-3xl font-bold">Pengaturan</div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Penghapusan akun tidak dapat dibatalkan, jadi pengaturan lain ikut
            dikunci selama prosesnya (R15 kelas (d)): mengubah kata sandi akun
            yang sedang dihapus tidak pernah menjadi yang diinginkan pengguna.
            Tombol pemicunya sengaja tetap di luar wilayah ini, karena `inert`
            akan melempar fokus keyboard keluar (R18). */}
        <BusyRegion busy={isDeleting} label="Menghapus akun…">
          <div className="flex flex-col gap-6">
            <NotificationsCard initialEnabled={notificationEmailEnabled} />
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
  const [enabled, setEnabled] = useState(initialEnabled)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="rounded-2xl border border-border bg-card p-7">
      <div className="mb-5 flex items-center gap-2.5 text-lg font-bold">
        <Bell className="size-[18px]" />
        Notifikasi
      </div>
      <div className="flex items-center justify-between gap-5">
        <div>
          <div className="text-sm font-semibold">Notifikasi Email</div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            Terima kabar terbaru tentang kursus dan akun Anda melalui email
          </div>
        </div>
        <Switch
          aria-label="Notifikasi email"
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
                message: checked ? "Notifikasi email dinyalakan" : "Notifikasi email dimatikan",
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

function SecurityCard() {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="rounded-2xl border border-border bg-card p-7">
      <div className="mb-5 flex items-center gap-2.5 text-lg font-bold">
        <Shield className="size-[18px]" />
        Keamanan
      </div>
      <div className="mb-2.5 text-sm font-semibold">Ubah Kata Sandi</div>
      <form
        action={(formData) => {
          setStatus(null)
          startTransition(async () => {
            const result = await changePassword(formData)
            if (result?.error) {
              setStatus({ type: "error", message: result.error })
            } else {
              setStatus({ type: "success", message: "Kata sandi tersimpan" })
              ;(document.getElementById("password-form") as HTMLFormElement)?.reset()
            }
          })
        }}
        id="password-form"
        className="flex gap-3"
      >
        <PasswordInput
          name="password"
          placeholder="Masukkan kata sandi baru"
          aria-label="Kata sandi baru"
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
  return (
    <div className="rounded-2xl border border-border bg-card p-7">
      <div className="mb-5 text-lg font-bold">Hapus Akun</div>
      <div className="rounded-xl border border-[#f3d5d5] bg-[#fdf1f1] p-5">
        <div className="text-[14.5px] font-semibold text-destructive">Hapus akun Anda secara permanen</div>
        <div className="mt-1 mb-3.5 text-[13px] text-destructive">
          Akun yang sudah dihapus tidak dapat dipulihkan
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
