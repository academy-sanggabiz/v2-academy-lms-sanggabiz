import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"

export const metadata = { title: "Lupa kata sandi · Sanggabiz Academy" }

export default function LupaSandiPage() {
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
        <ForgotPasswordForm />
        </div>
      </main>
    </div>
  )
}
