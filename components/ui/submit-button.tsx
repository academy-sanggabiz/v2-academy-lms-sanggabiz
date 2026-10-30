"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"

/**
 * Tombol kirim untuk `<form action={serverAction}>`.
 *
 * `useFormStatus` hanya melaporkan status form **induk**, jadi hook ini wajib
 * dipanggil di komponen anak -- memakainya di komponen yang sama dengan
 * `<form>` selalu mengembalikan `pending: false`. Komponen inilah anak itu,
 * sehingga halaman Server Component tetap bisa memakai server action secara
 * langsung tanpa berubah menjadi Client Component.
 */
function SubmitButton({
  pendingLabel,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" pending={pending} pendingLabel={pendingLabel} {...props}>
      {children}
    </Button>
  )
}

export { SubmitButton }
