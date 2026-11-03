"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/field"
import { StatusMessage } from "@/components/ui/status-message"
import { createClient } from "@/lib/supabase/client"
import { authErrorMessage } from "@/lib/auth/auth-error-message"
import { useI18n } from "@/components/i18n/LocaleProvider"

/**
 * Tautan pemulihan mendarat di `/auth/callback`, rute yang sudah ada dan sudah
 * terdaftar di Auth Supabase, lalu diteruskan ke halaman ganti sandi lewat
 * `?next=`. Memakai rute baru berarti harus mendaftarkan URL baru di dashboard
 * lebih dulu, dan itu di luar jangkauan kode ini.
 */
const RESET_TARGET = "/auth/callback?next=/auth/sandi-baru"

export function ForgotPasswordForm() {
  const { t } = useI18n()
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
        <h1 className="text-xl font-bold">{t.forgot.checkEmail}</h1>
        <p className="text-sm text-muted-foreground">
          {t.forgot.sentTo.split("{email}")[0]}
          <span className="font-medium text-foreground">{email.trim()}</span>
          {t.forgot.sentTo.split("{email}")[1]} {t.forgot.sentHint}
        </p>
        <p className="text-sm text-muted-foreground">{t.forgot.checkSpam}</p>
        <Link href="/auth/login" className="inline-block text-sm text-ring underline underline-offset-4">
          {t.forgot.backToSignIn}
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold">{t.forgot.title}</h1>
        <p className="text-sm text-muted-foreground">{t.forgot.subtitle}</p>
      </div>

      <StatusMessage className={error ? "rounded-lg bg-destructive/10 px-3 py-2" : undefined}>
        {error}
      </StatusMessage>

      {/* post, bukan get: lihat catatan di components/auth/LoginForm.tsx --
          tanpa ini pengiriman pra-hidrasi menaruh isian di query string. */}
      <form method="post" onSubmit={handleSubmit} className="space-y-3">
        <Field label={t.auth.email} htmlFor="lupa-email">
          <Input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.auth.emailPlaceholder}
            autoComplete="username"
            required
          />
        </Field>
        <Button type="submit" className="w-full" pending={isPending} pendingLabel={t.forgot.submitting}>
          {t.forgot.submit}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t.forgot.rememberPassword}{" "}
        <Link href="/auth/login" className="text-ring underline underline-offset-4">
          {t.auth.signIn}
        </Link>
      </p>
    </>
  )
}
