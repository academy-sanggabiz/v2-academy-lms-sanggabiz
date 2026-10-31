import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { NewPasswordForm } from "@/components/auth/NewPasswordForm"
import { getTranslations } from "@/lib/i18n/server"

// Layout sudah menambahkan " · Sanggabiz Academy" lewat template metadata.
// Judul tab ikut bahasa: generateMetadata bisa membaca cookie, sedangkan
// `export const metadata` dievaluasi sekali tanpa konteks permintaan.
export async function generateMetadata() {
  const { t } = await getTranslations()
  return { title: t.pageTitles.newPassword }
}

/**
 * Hanya bisa dibuka dengan sesi hidup -- yang didapat dari menukar tautan
 * pemulihan di `/auth/callback`.
 *
 * Penjaga sebenarnya ada di `proxy.ts`, yang memulangkan 307 sebelum satu byte
 * HTML pun terkirim. Yang di bawah ini lapis kedua: kalau pencocokan rute di
 * proxy suatu saat berubah, halaman ini tetap tidak menampilkan formulir yang
 * pasti gagal -- meski pengalihannya akan terasa lebih lambat (lihat komentar
 * di proxy soal meta-refresh).
 */
export default async function SandiBaruPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) redirect("/auth/lupa-sandi")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-secondary px-6 py-16">
      {/* Logo ikut masuk <main>: isi di luar landmark memicu aturan `region`,
          dan menyisakan bagian halaman yang tak terjangkau navigasi landmark. */}
      <main id="main-content" tabIndex={-1} className="flex w-full flex-col items-center gap-6 outline-none">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Sanggabiz" className="size-10 object-contain" />
          <span className="text-2xl font-bold text-ring">sanggabiz</span>
        </div>
        <div className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-8">
        <NewPasswordForm />
        </div>
      </main>
    </div>
  )
}
