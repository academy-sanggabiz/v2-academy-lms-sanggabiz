"use client"

import { useState, useTransition } from "react"
import { ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { setUserRoleAction, type PeranPengguna } from "@/app/admin/learners/role-actions"

const LABEL: Record<PeranPengguna, string> = {
  learner: "Peserta",
  mentor: "Mentor",
  superadmin: "Superadmin",
}

/**
 * Mengubah peran seseorang, hanya untuk superadmin.
 *
 * Setiap perubahan lewat dialog konfirmasi yang menyebut **apa yang berubah
 * bagi orang itu**, bukan sekadar "Anda yakin?". Mentor bisa melihat data
 * peserta dan membuat kursus; itu bukan perubahan yang pantas terjadi karena
 * satu klik yang salah sasaran di daftar nama yang mirip.
 *
 * Tombol yang menaikkan dan yang menurunkan sengaja dipisah, tidak digabung
 * jadi satu pemilih: pemilih membuat "turunkan dari superadmin" terlihat
 * sama ringannya dengan "jadikan mentor".
 */
export function RoleControl({
  userId,
  nama,
  peran,
}: {
  userId: string
  nama: string
  peran: PeranPengguna
}) {
  const [target, setTarget] = useState<PeranPengguna | null>(null)
  const [pending, startTransition] = useTransition()

  function jalankan(ke: PeranPengguna) {
    startTransition(async () => {
      const hasil = await setUserRoleAction(userId, ke)
      setTarget(null)
      if (!hasil.ok) {
        toast.error(hasil.error)
        return
      }
      toast.success(
        hasil.data.changed ? `${nama} sekarang ${LABEL[ke]}` : `${nama} memang sudah ${LABEL[ke]}`
      )
    })
  }

  /** Perubahan yang masuk akal dari peran sekarang. */
  const pilihan: { ke: PeranPengguna; label: string; variant: "default" | "outline" }[] =
    peran === "learner"
      ? [{ ke: "mentor", label: "Jadikan Mentor", variant: "default" }]
      : peran === "mentor"
        ? [
            { ke: "superadmin", label: "Jadikan Superadmin", variant: "outline" },
            { ke: "learner", label: "Kembalikan jadi Peserta", variant: "outline" },
          ]
        : [{ ke: "mentor", label: "Turunkan jadi Mentor", variant: "outline" }]

  const penjelasan: Record<PeranPengguna, string> = {
    mentor:
      "Mentor dapat membuat dan menyunting kursusnya sendiri, serta melihat data peserta di kursus itu.",
    superadmin:
      "Superadmin dapat melakukan apa pun di seluruh sistem, termasuk mengubah peran orang lain dan menyunting kursus milik siapa pun.",
    learner:
      "Kursus yang pernah ia buat tidak ikut terhapus, tetapi ia tidak lagi bisa membukanya sebagai pengelola.",
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {pilihan.map((p) => (
          <Button
            key={p.ke}
            type="button"
            size="sm"
            variant={p.variant}
            disabled={pending}
            onClick={() => setTarget(p.ke)}
          >
            <ShieldCheck className="size-3.5" aria-hidden />
            {p.label}
          </Button>
        ))}
      </div>

      <AlertDialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ubah peran {nama} menjadi {target ? LABEL[target] : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {target ? penjelasan[target] : ""} Perubahan ini dicatat beserta nama Anda, dan bisa
              dikembalikan kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault()
                if (target) jalankan(target)
              }}
            >
              {pending ? "Menyimpan…" : "Ya, ubah"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
