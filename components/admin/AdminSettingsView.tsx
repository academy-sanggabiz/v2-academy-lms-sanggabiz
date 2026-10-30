"use client"

import { useEffect, useState, useTransition } from "react"
import { Bell, Shield } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { BusyRegion } from "@/components/ui/busy-region"
import { StatusMessage } from "@/components/ui/status-message"
import { Switch } from "@/components/ui/switch"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { useNavigationBlocker } from "@/components/admin/NavigationBlockerContext"
import { changePassword, deleteAccount, updateNotificationPref } from "@/app/admin/settings/actions"

const DELETING_LABEL = "Menghapus akun… Jangan ubah pengaturan atau tinggalkan halaman ini."

export function AdminSettingsView({
  notificationEmailEnabled,
}: {
  notificationEmailEnabled: boolean
}) {
  // Penghapusan akun tidak dapat dibatalkan dan menyentuh seluruh akun, bukan
  // satu kolom -- kelas (d) pada tabel lingkup penguncian. Selama ia berjalan,
  // mengubah kata sandi atau preferensi notifikasi berarti menulis ke akun yang
  // sedang dihapus (STANDAR-UMPAN-BALIK-UI.md R15, R16).
  const [isDeleting, setIsDeleting] = useState(false)
  const { setIsBlocked, setBlockMessage } = useNavigationBlocker()

  useEffect(() => {
    if (!isDeleting) return

    setBlockMessage("Penghapusan akun sedang berjalan. Tetap tinggalkan halaman ini?")
    setIsBlocked(true)
    return () => {
      setIsBlocked(false)
      setBlockMessage(null)
    }
  }, [isDeleting, setIsBlocked, setBlockMessage])

  return (
    <div>
      <div className="mb-6 text-3xl font-bold">Pengaturan</div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Kartu pemicunya sendiri ada di kolom kanan, di luar wilayah inert
            ini, supaya fokus keyboard tidak terlempar ke body (R18). */}
        <BusyRegion busy={isDeleting} label={DELETING_LABEL}>
          <div className="flex flex-col gap-6">
            <NotificationsCard initialEnabled={notificationEmailEnabled} />
            <SecurityCard />
          </div>
        </BusyRegion>
        <div className="flex flex-col gap-6">
          <DeleteAccountCard onDeletingChange={setIsDeleting} />
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
              setStatus({ type: "success", message: "Tersimpan" })
            })
          }}
        />
      </div>
      {/* The switch flips optimistically, so the only thing missing was the
          outcome: this says whether the server actually took the change. */}
      <StatusMessage variant={status?.type === "error" ? "error" : "success"} className="mt-2.5">
        {status?.message}
      </StatusMessage>
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
              setStatus({ type: "success", message: "Kata sandi diperbarui" })
              ;(document.getElementById("admin-password-form") as HTMLFormElement)?.reset()
            }
          })
        }}
        id="admin-password-form"
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
      <StatusMessage variant={status?.type === "error" ? "error" : "success"} className="mt-2.5">
        {status?.message}
      </StatusMessage>
    </div>
  )
}

function DeleteAccountCard({ onDeletingChange }: { onDeletingChange: (deleting: boolean) => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    onDeletingChange(isPending)
  }, [isPending, onDeletingChange])

  return (
    <div className="rounded-2xl border border-border bg-card p-7">
      <div className="mb-5 text-lg font-bold">Hapus Akun</div>
      <div className="rounded-xl border border-[#f3d5d5] bg-[#fdf1f1] p-5">
        <div className="text-[14.5px] font-semibold text-destructive">Hapus akun Anda secara permanen</div>
        <div className="mt-1 mb-3.5 text-[13px] text-destructive">
          Akun yang sudah dihapus tidak dapat dipulihkan
        </div>
        <StatusMessage className="mb-3">{error}</StatusMessage>
        <AlertDialog
          open={confirmOpen}
          onOpenChange={(next) => {
            // Escape dan klik di luar tidak boleh menyembunyikan proses yang
            // tidak dapat dibatalkan ini (R16).
            if (!next && isPending) return
            setConfirmOpen(next)
          }}
        >
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                className="w-full bg-destructive text-white hover:bg-destructive/90"
              />
            }
          >
            Hapus Akun
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus akun Anda?</AlertDialogTitle>
              <AlertDialogDescription>
                Akun dan seluruh datanya akan dihapus secara permanen. Tindakan ini tidak dapat
                dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                pending={isPending}
                pendingLabel="Menghapus…"
                onClick={() => {
                  setError(null)
                  startTransition(async () => {
                    const result = await deleteAccount()
                    // Success redirects away; on failure close the dialog so the
                    // message behind it is actually readable.
                    if (result?.error) {
                      setError(result.error)
                      setConfirmOpen(false)
                    }
                  })
                }}
              >
                Hapus Akun
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
