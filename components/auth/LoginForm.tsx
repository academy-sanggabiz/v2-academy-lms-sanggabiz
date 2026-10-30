"use client"

import * as React from "react"
import { useActionState } from "react"
import Link from "next/link"
import HCaptcha from "@hcaptcha/react-hcaptcha"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusMessage } from "@/components/ui/status-message"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { GoogleIcon } from "@/components/auth/GoogleIcon"
import { login, type LoginState } from "@/app/auth/login/actions"
import { authErrorMessage } from "@/lib/auth/auth-error-message"
import { createClient } from "@/lib/supabase/client"

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? ""
/**
 * Batas tunggu verifikasi captcha tak terlihat. Tanpa ini, widget yang gagal
 * dimuat membuat klik "Masuk" tidak pernah berbuah apa pun -- tombol diam dan
 * login tidak pernah terjadi (R7). Tantangan yang benar-benar tampil ke
 * pengguna membatalkan hitungan ini lewat `onOpen`, jadi ambangnya hanya
 * menjaga kasus "widget tidak menjawab sama sekali".
 */
const CAPTCHA_TIMEOUT_MS = 15000
/**
 * `onClose` bisa tiba sesaat sebelum `onVerify` ketika tantangan baru saja
 * diselesaikan, jadi penutupan diberi jeda singkat sebelum dianggap batal.
 */
const CAPTCHA_CLOSE_GRACE_MS = 1500

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(login, null)
  const captchaRef = React.useRef<HCaptcha>(null)
  const pendingFormData = React.useRef<FormData | null>(null)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keadaan lokal supaya tombol sudah sibuk sejak detik klik (R2): `isPending`
  // dari useActionState baru menyala setelah captcha terverifikasi.
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [clientError, setClientError] = React.useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)

  const clearTimer = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  React.useEffect(() => clearTimer, [clearTimer])

  function abortVerification(message: string) {
    clearTimer()
    // Token sudah diterima (onVerify mengosongkan ini lebih dulu): tidak ada
    // yang perlu dibatalkan.
    if (!pendingFormData.current) return
    pendingFormData.current = null
    setIsVerifying(false)
    setClientError(message)
    captchaRef.current?.resetCaptcha()
  }

  function abortVerificationAfter(delayMs: number, message: string) {
    clearTimer()
    if (!pendingFormData.current) return
    timeoutRef.current = setTimeout(() => abortVerification(message), delayMs)
  }

  const handleGoogleSignIn = async () => {
    setClientError(null)
    setIsGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setIsGoogleLoading(false)
      setClientError(authErrorMessage(error.message))
    }
  }

  React.useEffect(() => {
    if (state && "error" in state) {
      captchaRef.current?.resetCaptcha()
    }
  }, [state])

  const onVerify = (token: string) => {
    clearTimer()
    const formData = pendingFormData.current
    pendingFormData.current = null
    if (!formData) return
    setIsVerifying(false)
    formData.set("captchaToken", token)
    React.startTransition(() => formAction(formData))
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setClientError(null)
    const formData = new FormData(event.currentTarget)

    if (!HCAPTCHA_SITE_KEY) {
      React.startTransition(() => formAction(formData))
      return
    }

    if (!captchaRef.current) {
      setClientError("Verifikasi keamanan belum siap. Muat ulang halaman, lalu coba lagi.")
      return
    }

    pendingFormData.current = formData
    setIsVerifying(true)
    abortVerificationAfter(
      CAPTCHA_TIMEOUT_MS,
      "Verifikasi keamanan tidak merespons. Muat ulang halaman, lalu coba lagi."
    )
    captchaRef.current.execute()
  }

  const isSigningIn = isVerifying || isPending
  const errorMessage = clientError ?? (state && "error" in state ? state.error : null)

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold">Masuk</h1>
        <p className="text-sm text-muted-foreground">Masuk ke Sanggabiz untuk melanjutkan.</p>
      </div>

      <StatusMessage className={errorMessage ? "rounded-lg bg-destructive/10 px-3 py-2" : undefined}>
        {errorMessage}
      </StatusMessage>

      <form onSubmit={onSubmit} className="space-y-3">
        <Input type="email" name="email" placeholder="Email" aria-label="Email" required />
        <PasswordInput name="password" placeholder="Kata sandi" aria-label="Kata sandi" required />
        <Button type="submit" className="w-full" pending={isSigningIn} pendingLabel="Sedang masuk…">
          Masuk
        </Button>
      </form>

      {HCAPTCHA_SITE_KEY && (
        <HCaptcha
          ref={captchaRef}
          sitekey={HCAPTCHA_SITE_KEY}
          size="invisible"
          onVerify={onVerify}
          // Tantangan yang tampil ditunggu pengguna sendiri, jadi batas waktu
          // otomatis dimatikan selama ia terbuka.
          onOpen={clearTimer}
          onClose={() =>
            abortVerificationAfter(CAPTCHA_CLOSE_GRACE_MS, "Verifikasi keamanan dibatalkan. Coba lagi.")
          }
          onExpire={() => abortVerification("Verifikasi keamanan kedaluwarsa. Coba lagi.")}
          onChalExpired={() => abortVerification("Verifikasi keamanan kedaluwarsa. Coba lagi.")}
          onError={() => abortVerification("Verifikasi keamanan gagal. Periksa koneksi Anda, lalu coba lagi.")}
        />
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">Atau lanjutkan dengan</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        pending={isGoogleLoading}
        pendingLabel="Mengalihkan…"
      >
        <GoogleIcon className="size-4" />
        Lanjutkan dengan Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/auth/learner/signup" className="text-ring underline underline-offset-4">
          Daftar
        </Link>
      </p>
    </>
  )
}
