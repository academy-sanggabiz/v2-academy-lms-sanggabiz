import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { NewPasswordForm } from "@/components/auth/NewPasswordForm"

export const metadata = { title: "Kata sandi baru · Sanggabiz Academy" }

/**
 * Hanya bisa dibuka dengan sesi hidup -- yang didapat dari menukar tautan
 * pemulihan di `/auth/callback`. Membukanya langsung tanpa sesi dialihkan ke
 * halaman minta tautan, bukan ditampilkan sebagai formulir yang pasti gagal.
 */
export default async function SandiBaruPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) redirect("/auth/lupa-sandi")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-secondary px-6 py-16">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Sanggabiz" className="size-10 object-contain" />
        <span className="text-2xl font-bold text-ring">sanggabiz</span>
      </div>
      <main id="main-content" tabIndex={-1} className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-8 outline-none">
        <NewPasswordForm />
      </main>
    </div>
  )
}
