"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useAdminBusy } from "@/components/admin/AdminBusyContext"
import { createDraftCourseAction } from "@/app/admin/courses/actions"

export function CreateCourseButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { setBusy } = useAdminBusy()

  function handleCreate() {
    setBusy(true, "Membuat kursus…")

    startTransition(async () => {
      const result = await createDraftCourseAction()

      if (!result.ok) {
        setBusy(false)
        toast.error(result.error)
        return
      }

      // Navigasi ikut di dalam transition ini, jadi layar tetap terkunci sampai
      // halaman editor benar-benar tampil -- bukan hanya sampai barisnya dibuat.
      // Kuncinya dilepas oleh AdminBusyProvider begitu path berubah; layout
      // admin dipakai bersama, jadi ia tidak me-mount ulang dengan sendirinya.
      router.push(`/admin/courses/${result.data.id}/edit?new=1`)
    })
  }

  return (
    <Button
      type="button"
      onClick={handleCreate}
      pending={pending}
      pendingLabel="Membuat…"
      className="bg-brand-gradient text-white hover:brightness-105"
    >
      <Plus className="size-4" />
      Buat Kursus
    </Button>
  )
}
