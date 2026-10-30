"use client"

import * as React from "react"
import { useActionState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusMessage } from "@/components/ui/status-message"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { GoogleIcon } from "@/components/auth/GoogleIcon"
import { signupSchema, type SignupFormValues } from "@/components/auth/schema"
import { signup, type SignupState } from "@/app/auth/learner/actions"
import { authErrorMessage } from "@/lib/auth/auth-error-message"
import { createClient } from "@/lib/supabase/client"

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? ""

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<SignupState, FormData>(signup, null)
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null)
  const captchaRef = React.useRef<HCaptcha>(null)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)
  const [googleError, setGoogleError] = React.useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setGoogleError(null)
    setIsGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setIsGoogleLoading(false)
      setGoogleError(authErrorMessage(error.message))
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  })

  React.useEffect(() => {
    // hCaptcha tokens are single-use; resetting the widget also fires
    // onExpire, which clears captchaToken via setCaptchaToken(null) below.
    if (state && "error" in state) {
      captchaRef.current?.resetCaptcha()
    }
  }, [state])

  if (state && "status" in state && state.status === "check-email") {
    return (
      <div className="space-y-3 text-center">
        <Mail className="mx-auto size-10 text-ring" />
        <h1 className="text-xl font-bold">Periksa email Anda</h1>
        <p className="text-sm text-muted-foreground">
          Kami telah mengirim tautan konfirmasi ke <span className="font-medium text-foreground">{state.email}</span>.
          Klik tautan tersebut untuk mengaktifkan akun Anda.
        </p>
        <Link href="/auth/login" className="inline-block text-sm text-ring underline underline-offset-4">
          Kembali ke halaman masuk
        </Link>
      </div>
    )
  }

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData()
    formData.set("fullName", values.fullName)
    formData.set("email", values.email)
    formData.set("password", values.password)
    formData.set("confirmPassword", values.confirmPassword)
    formData.set("captchaToken", captchaToken ?? "")
    React.startTransition(() => formAction(formData))
  })

  const formError = googleError ?? (state && "error" in state ? state.error : null)

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold">Buat akun Anda</h1>
        <p className="text-sm text-muted-foreground">Mulai belajar bersama Sanggabiz.</p>
      </div>

      <StatusMessage className={formError ? "rounded-lg bg-destructive/10 px-3 py-2" : undefined}>
        {formError}
      </StatusMessage>

      <form onSubmit={onSubmit} className="space-y-3">
        {/*
         * Pesan per-kolom disambungkan ke inputnya dengan aria-describedby dan
         * aria-invalid, bukan dibuat live region sendiri: pembaca layar
         * membacakannya saat fokus masuk ke kolom yang bermasalah, dan kolomnya
         * ikut ditandai (WCAG 2.2 SC 3.3.1).
         */}
        <div>
          <Input
            type="text"
            id="signup-fullName"
            autoComplete="name"
            placeholder="Nama lengkap"
            aria-label="Nama lengkap"
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={errors.fullName ? "signup-fullName-error" : undefined}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p id="signup-fullName-error" className="mt-1 text-xs text-destructive">
              {errors.fullName.message}
            </p>
          )}
        </div>
        <div>
          <Input
            type="email"
            id="signup-email"
            autoComplete="username"
            placeholder="Email"
            aria-label="Email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="signup-email-error" className="mt-1 text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <PasswordInput
            id="signup-password"
            autoComplete="new-password"
            placeholder="Kata sandi"
            aria-label="Kata sandi"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "signup-password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p id="signup-password-error" className="mt-1 text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
        <div>
          <PasswordInput
            id="signup-confirmPassword"
            autoComplete="new-password"
            placeholder="Konfirmasi kata sandi"
            aria-label="Konfirmasi kata sandi"
            aria-invalid={errors.confirmPassword ? true : undefined}
            aria-describedby={errors.confirmPassword ? "signup-confirmPassword-error" : undefined}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p id="signup-confirmPassword-error" className="mt-1 text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {HCAPTCHA_SITE_KEY && (
          <HCaptcha
            ref={captchaRef}
            sitekey={HCAPTCHA_SITE_KEY}
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
          />
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!!HCAPTCHA_SITE_KEY && !captchaToken}
          pending={isPending}
          pendingLabel="Mendaftarkan…"
        >
          Daftar
        </Button>
      </form>

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
        Sudah punya akun?{" "}
        <Link href="/auth/login" className="text-ring underline underline-offset-4">
          Masuk
        </Link>
      </p>
    </>
  )
}
