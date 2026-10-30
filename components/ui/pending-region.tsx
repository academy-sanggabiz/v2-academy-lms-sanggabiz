"use client"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

/**
 * Wadah untuk isi yang sedang dimuat ulang dari server -- daftar yang dicari,
 * difilter, diurutkan, atau dipaginasi.
 *
 * Isinya diredupkan (bukan disembunyikan) supaya pengguna tidak kehilangan
 * konteks, ditambah label yang terbaca agar tidak bergantung pada animasi saja
 * (STANDAR-UMPAN-BALIK-UI.md R4, R5) dan `aria-busy` agar screen reader tahu
 * daftarnya sedang berubah (R10).
 */
function PendingRegion({
  pending,
  label = "Memuat…",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { pending: boolean; label?: string }) {
  return (
    <div
      aria-busy={pending || undefined}
      className={cn("relative", className)}
      {...props}
    >
      {/*
       * Satu live region yang selalu ada dan hanya isinya yang berubah --
       * menukar elemennya saat status berganti membuat sebagian screen reader
       * melewatkan pengumumannya.
       */}
      <span role="status" aria-live="polite" className="sr-only">
        {pending ? label : ""}
      </span>

      {pending && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center"
        >
          <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium shadow-sm">
            <Spinner className="size-3.5" />
            {label}
          </span>
        </div>
      )}

      <div className={cn("transition-opacity", pending && "opacity-50")}>{children}</div>
    </div>
  )
}

export { PendingRegion }
