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
import { Field } from "@/components/ui/field"
import { StatusMessage } from "@/components/ui/status-message"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { GoogleIcon } from "@/components/auth/GoogleIcon"
import { signupSchema, type SignupFormValues } from "@/components/auth/schema"
import { signup, type SignupState } from "@/app/auth/learner/actions"
import { authErrorMessage } from "@/lib/auth/auth-error-message"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/components/i18n/LocaleProvider"

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? ""

export function SignupForm() {
  const { t } = useI18n()
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
    defaultValues: { fullName: "", email: "", password: "" },
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
        <h1 className="text-xl font-bold">{t.signup.checkEmail}</h1>
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
    formData.set("captchaToken", captchaToken ?? "")
    React.startTransition(() => formAction(formData))
  })

  const formError = googleError ?? (state && "error" in state ? state.error : null)

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold">{t.signup.title}</h1>
        <p className="text-sm text-muted-foreground">{t.signup.subtitle}</p>
      </div>

      <StatusMessage className={formError ? "rounded-lg bg-destructive/10 px-3 py-2" : undefined}>
        {formError}
      </StatusMessage>

      {/* post, bukan get: lihat catatan di components/auth/LoginForm.tsx --
          tanpa ini pengiriman pra-hidrasi menaruh isian di query string. */}
      <form method="post" onSubmit={onSubmit} className="space-y-4">
        {/*
         * Pesan per-kolom disambungkan ke inputnya dengan aria-describedby dan
         * aria-invalid, bukan dibuat live region sendiri: pembaca layar
         * membacakannya saat fokus masuk ke kolom yang bermasalah, dan kolomnya
         * ikut ditandai (WCAG 2.2 SC 3.3.1).
         */}
        <Field label={t.signup.fullName} htmlFor="signup-fullName" help={t.signup.fullNameHelp} error={errors.fullName?.message}>
          <Input type="text" autoComplete="name" {...register("fullName")} />
        </Field>

        <Field label={t.auth.email} htmlFor="signup-email" help={t.signup.emailHelp} error={errors.email?.message}>
          <Input
            type="email"
            placeholder={t.auth.emailPlaceholder}
            autoComplete="username"
            {...register("email")}
          />
        </Field>

        <Field label={t.auth.password} htmlFor="signup-password" help={t.signup.passwordHelp} error={errors.password?.message}>
          <PasswordInput autoComplete="new-password" {...register("password")} />
        </Field>

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
          pendingLabel={t.signup.submitting}
        >
          {t.signup.submit}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t.auth.orContinueWith}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        pending={isGoogleLoading}
        pendingLabel={t.signup.redirecting}
      >
        <GoogleIcon className="size-4" />
        {t.auth.continueWithGoogle}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.signup.haveAccount}{" "}
        <Link href="/auth/login" className="text-ring underline underline-offset-4">
          {t.signup.signIn}
        </Link>
      </p>
    </>
  )
}
