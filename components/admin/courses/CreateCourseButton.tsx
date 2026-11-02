"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, FileText, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/components/i18n/LocaleProvider"

import { Button } from "@/components/ui/button"
import { useAdminBusy } from "@/components/admin/AdminBusyContext"
import { createDraftCourseAction } from "@/app/admin/courses/actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function CreateCourseButton() {
  const { t } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { setBusy } = useAdminBusy()

  /**
   * `withImport` membuat draf lalu membuka dialog impor begitu editor tampil.
   *
   * Dua jalan ini sengaja ditawarkan berdampingan di sini, bukan hanya di
   * dalam editor: saat orang menekan "Buat kursus", halaman kosong itulah
   * yang paling menakutkan, dan itu momen paling tepat menawarkan bantuan.
   */
  function handleCreate(withImport: boolean) {
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
      router.push(`/admin/courses/${result.data.id}/edit?new=1${withImport ? "&impor=1" : ""}`)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            pending={pending}
            pendingLabel="Membuat…"
            className="bg-brand-gradient text-white hover:brightness-105"
          >
            <Plus className="size-4" aria-hidden />
            {t.admin.createCourse}
            <ChevronDown className="size-4" aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => handleCreate(false)}>
          <FileText className="size-4" aria-hidden />
          <div>
            <div>Kursus kosong</div>
            <div className="text-xs text-muted-foreground">Isi sendiri dari awal</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCreate(true)}>
          <Sparkles className="size-4" aria-hidden />
          <div>
            <div>Impor dari berkas .md</div>
            <div className="text-xs text-muted-foreground">Hasil dari asisten AI Anda</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
