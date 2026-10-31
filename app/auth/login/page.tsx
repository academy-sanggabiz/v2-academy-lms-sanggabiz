import { StatusMessage } from "@/components/ui/status-message"
import { LoginForm } from "@/components/auth/LoginForm"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ akun?: string }>
}) {
  const { akun } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-secondary px-6 py-16">
      {/*
        * Seluruh isi halaman duduk di dalam satu <main>: tanpa ini axe
        * melaporkan landmark-one-main dan region, dan yang lebih penting
        * pengguna screen reader tidak punya tempat untuk dilompati tautan
        * "Langsung ke konten utama" (WCAG 2.4.1).
        */}
      <main id="main-content" tabIndex={-1} className="flex w-full flex-col items-center gap-6 outline-none">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Sanggabiz" className="size-10 object-contain" />
        <span className="text-2xl font-bold text-ring">sanggabiz</span>
      </div>
      <div className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-8">
        {/* Penutup untuk aksi tak dapat dibatalkan: hapus akun mendarat di sini,
            jadi konfirmasi "sudah terhapus" diberikan di tempat tujuan (R8). */}
        {akun === "terhapus" && (
          <StatusMessage variant="success" className="rounded-lg bg-success px-3 py-2">
            Akun Anda telah dihapus permanen beserta seluruh datanya.
          </StatusMessage>
        )}
        <LoginForm />
      </div>
    </main>
    </div>
  )
}
