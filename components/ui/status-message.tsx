import { AlertCircle, CircleCheck } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Pesan hasil aksi yang dibacakan screen reader tanpa memindahkan fokus
 * (WCAG 2.2 SC 4.1.3, STANDAR-UMPAN-BALIK-UI.md R10).
 *
 * Wadahnya **selalu** dirender, juga saat kosong: live region yang baru muncul
 * bersamaan dengan isinya sering tidak terbaca screen reader. Jadi pakai
 * `<StatusMessage>{error}</StatusMessage>`, bukan `{error && <StatusMessage>}`.
 */
function StatusMessage({
  variant = "error",
  children,
  className,
  ...props
}: React.ComponentProps<"p"> & { variant?: "error" | "success" }) {
  const isError = variant === "error"
  const Icon = isError ? AlertCircle : CircleCheck

  return (
    <p
      // Kegagalan menghentikan pekerjaan, jadi diumumkan segera; keberhasilan
      // menunggu jeda agar tidak memotong pembacaan yang sedang berjalan.
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={cn(
        "flex items-center gap-1.5 text-sm",
        children && (isError ? "text-destructive" : "text-success-foreground"),
        className
      )}
      {...props}
    >
      {children ? (
        <>
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {children}
        </>
      ) : null}
    </p>
  )
}

export { StatusMessage }
