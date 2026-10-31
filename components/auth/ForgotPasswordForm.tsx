"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusMessage } from "@/components/ui/status-message"
import { createClient } from "@/lib/supabase/client"
import { authErrorMessage } from "@/lib/auth/auth-error-message"

/**
 * Tautan pemulihan mendarat di `/auth/callback`, rute yang sudah ada dan sudah
 * terdaftar di Auth Supabase, lalu diteruskan ke halaman ganti sandi lewat
 * `?next=`. Memakai rute baru berarti harus mendaftarkan URL baru di dashboard
 * lebih dulu, dan itu di luar jangkauan kode ini.
 */
const RESET_TARGET = "/auth/callback?next=/auth/sandi-baru"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}${RESET_TARGET}`,
      })

      if (resetError) {
        setError(authErrorMessage(resetError.message))
        return
      }

      setSent(true)
    })
  }

  if (sent) {
    return (
      <div className="space-y-3 text-center">
        <MailCheck className="mx-auto size-10 text-ring" />
        <h1 className="text-xl font-bold">Periksa email Anda</h1>
        <p className="text-sm text-muted-foreground">
          Jika <span className="font-medium text-foreground">{email.trim()}</span> terdaftar, kami
          mengirimkan tautan untuk membuat kata sandi baru. Tautannya berlaku sementara.
        </p>
        <p className="text-sm text-muted-foreground">
          Tidak ada di kotak masuk? Periksa folder spam.
        </p>
        <Link href="/auth/login" className="inline-block text-sm text-ring underline underline-offset-4">
          Kembali ke halaman masuk
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold">Lupa kata sandi</h1>
        <p className="text-sm text-muted-foreground">
          Masukkan email akun Anda. Kami kirimkan tautan untuk membuat kata sandi baru.
        </p>
      </div>

      <StatusMessage className={error ? "rounded-lg bg-destructive/10 px-3 py-2" : undefined}>
        {error}
      </StatusMessage>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          aria-label="Email"
          autoComplete="username"
          required
        />
        <Button type="submit" className="w-full" pending={isPending} pendingLabel="Mengirim…">
          Kirim tautan
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Ingat kata sandi Anda?{" "}
        <Link href="/auth/login" className="text-ring underline underline-offset-4">
          Masuk
        </Link>
      </p>
    </>
  )
}
