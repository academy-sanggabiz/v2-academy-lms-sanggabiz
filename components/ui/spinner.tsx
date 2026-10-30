import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Penanda "sedang bekerja" yang selalu didampingi teks, tidak pernah sendirian:
 * app/globals.css mematikan animasi pada prefers-reduced-motion, sehingga ikon
 * ini membeku bagi sebagian pengguna (STANDAR-UMPAN-BALIK-UI.md R5).
 */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2
      aria-hidden="true"
      data-slot="spinner"
      className={cn("animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
