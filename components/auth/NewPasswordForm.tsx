"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { StatusMessage } from "@/components/ui/status-message"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { setNewPassword } from "@/app/auth/sandi-baru/actions"

const MIN_LENGTH = 6

export function NewPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Diperiksa sebelum dikirim supaya pesannya muncul tanpa perjalanan ke
    // server, dan tombolnya tidak pernah mati tanpa penjelasan (§14).
    if (password.length < MIN_LENGTH) {
      setError(`Kata sandi minimal ${MIN_LENGTH} karakter.`)
      return
    }
    if (password !== confirm) {
      setError("Kedua kata sandi belum sama.")
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await setNewPassword(password)
      if (!result.ok) {
        setError(result.error)
        return
      }
      // Sesi pemulihan sudah menjadi sesi biasa, jadi langsung ke beranda
      // perannya; perpindahan itu sendiri yang menjadi konfirmasinya (R6).
      router.replace(result.destination)
    })
  }

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold">Buat kata sandi baru</h1>
        <p className="text-sm text-muted-foreground">
          Pilih kata sandi baru untuk akun Anda.
        </p>
      </div>

      <StatusMessage className={error ? "rounded-lg bg-destructive/10 px-3 py-2" : undefined}>
        {error}
      </StatusMessage>

      {/* post, bukan get: lihat catatan di components/auth/LoginForm.tsx --
          tanpa ini pengiriman pra-hidrasi menaruh isian di query string. */}
      <form method="post" onSubmit={handleSubmit} className="space-y-3">
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Kata sandi baru"
          aria-label="Kata sandi baru"
          autoComplete="new-password"
          required
        />
        <PasswordInput
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ulangi kata sandi baru"
          aria-label="Ulangi kata sandi baru"
          autoComplete="new-password"
          required
        />
        <Button type="submit" className="w-full" pending={isPending} pendingLabel="Menyimpan…">
          Simpan kata sandi
        </Button>
      </form>
    </>
  )
}
