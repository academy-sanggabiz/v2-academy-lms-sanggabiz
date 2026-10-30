// Komponen klien: Button membaca BusyGuard lewat context, supaya tombol
// tetangga ikut terkunci selama satu proses berjalan (R14). Halaman Server
// Component tetap boleh memakainya seperti biasa.
"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { useBusyGuard } from "@/components/ui/busy-guard"

const buttonVariants = cva(
  // ring-offset wajib: --ring (#167384) di atas --primary (#13707f) hanya
  // 1,05:1, jadi tanpa jarak putih pemisah, cincin fokus di tombol utama
  // praktis tidak terlihat (WCAG 2.4.7 / 1.4.11).
  // data-[locked]: tombol yang ditahan karena proses lain. Base UI memakai
  // aria-disabled (bukan atribut disabled) agar fokus tidak hilang, sehingga
  // varian :disabled tidak menyala -- tanpa kelas ini tombolnya tampak normal
  // tapi diam saja saat diklik.
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 data-[locked]:cursor-not-allowed data-[locked]:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xl: "h-12 gap-2 rounded-[10px] px-7 text-[15px] font-semibold has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-10",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * `pending` adalah cara baku menampilkan "sedang bekerja" di seluruh LMS
 * (STANDAR-UMPAN-BALIK-UI.md §3). Ia mengunci tombol, memasang aria-busy, dan
 * menampilkan spinner bersama teks -- `disabled` saja dilarang sebagai umpan
 * balik (R4), dan spinner saja tidak cukup (R5).
 *
 * Tombol tetap bisa difokus selama pending (R11) supaya posisi keyboard dan
 * konteks screen reader tidak hilang di tengah aksi. Base UI menukar atribut
 * `disabled` native dengan `aria-disabled` saat focusableWhenDisabled aktif,
 * sambil tetap memblokir klik -- karena itu kelas `disabled:opacity-50` tidak
 * ikut menyala, yang memang diinginkan: tombol harus terlihat sibuk, bukan mati.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  pending = false,
  pendingLabel,
  ignoreBusyGuard = false,
  disabled,
  focusableWhenDisabled,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    pending?: boolean
    pendingLabel?: React.ReactNode
    /**
     * Tetap bisa diklik walau ada proses lain berjalan di permukaan yang sama.
     * Hanya untuk kontrol yang tidak menulis apa pun dan aman dipakai kapan
     * saja -- menutup pemberitahuan, membuka bantuan.
     */
    ignoreBusyGuard?: boolean
  }) {
  const { lockedByOther } = useBusyGuard(pending)
  const locked = lockedByOther && !ignoreBusyGuard

  return (
    <ButtonPrimitive
      data-slot="button"
      data-pending={pending || undefined}
      data-locked={locked || undefined}
      aria-busy={pending || undefined}
      disabled={disabled || pending || locked}
      // Terkunci karena proses lain tetap bisa difokus (R11); hanya yang benar
      // benar dinonaktifkan karena isian belum lengkap yang keluar dari urutan tab.
      focusableWhenDisabled={focusableWhenDisabled ?? (pending || locked)}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {pending ? (
        <>
          <Spinner />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
