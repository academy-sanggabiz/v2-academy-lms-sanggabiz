"use client"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

/**
 * Mengunci satu wilayah selama prosesnya berjalan: isinya tidak bisa diklik,
 * difokus, maupun dicapai dengan Tab (atribut `inert`).
 *
 * Dipakai untuk wilayah yang sedang **ditunggu**, bukan untuk tombol yang
 * sedang bekerja. `inert` juga mengeluarkan isinya dari pohon aksesibilitas,
 * jadi dua hal wajib diperhatikan:
 *
 * 1. Label statusnya sengaja ditaruh di luar subtree yang dikunci, supaya tetap
 *    dibacakan screen reader (STANDAR-UMPAN-BALIK-UI.md R10).
 * 2. Kontrol yang memicu prosesnya sebaiknya **tidak** ikut di dalam sini:
 *    fokus yang sedang berada di dalam subtree inert akan terlempar ke body,
 *    dan itu melanggar R11. Untuk mengunci sesama tombol aksi, pakai
 *    `useBusyGuard` (components/ui/busy-guard.tsx) yang menahan kliknya tanpa
 *    membuang fokus.
 */
function BusyRegion({
  busy,
  label = "Memproses…",
  showOverlay = true,
  className,
  contentClassName,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  busy: boolean
  label?: string
  /** Matikan bila wilayahnya sudah punya penanda sendiri dan hanya perlu dikunci. */
  showOverlay?: boolean
  /**
   * Kelas untuk pembungkus bagian dalam. Pembungkus ini menyisipkan satu
   * tingkat elemen, jadi isi yang mengandalkan tata letak induknya (anak flex
   * yang memakai `flex-1`, misalnya) perlu kelas yang sama diteruskan ke sini.
   */
  contentClassName?: string
}) {
  return (
    <div className={cn("relative", className)} {...props}>
      <p role="status" aria-live="polite" className="sr-only">
        {busy ? label : ""}
      </p>

      {busy && showOverlay && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-card/70 backdrop-blur-[1px]">
          <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium shadow-sm">
            <Spinner className="size-4" />
            {label}
          </span>
        </div>
      )}

      <div inert={busy} className={contentClassName}>
        {children}
      </div>
    </div>
  )
}

export { BusyRegion }
