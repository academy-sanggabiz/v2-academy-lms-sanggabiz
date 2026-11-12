"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, FileText, FileUp, Plus, Sparkles } from "lucide-react"
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
   * Membuat draf, lalu -- untuk dua jalur berbantuan -- langsung membuka
   * dialognya begitu editor tampil.
   *
   * Ketiganya ditawarkan berdampingan di sini, bukan hanya di dalam editor:
   * saat orang menekan "Buat Kursus", halaman kosong itulah yang paling
   * menakutkan, dan itu momen paling tepat menawarkan bantuan.
   *
   * Dua jalur AI-nya sengaja dibedakan kata dan ikonnya, karena artinya
   * berlawanan: `"md"` mengimpor hasil dari asisten AI MILIK PENGGUNA
   * (Sanggabiz tidak memanggil AI sama sekali), sedangkan `"ai"` adalah
   * Sanggabiz yang memanggil AI. Sampai 2026-11-10 kilau ✨ justru terpasang
   * di jalur yang tidak memanggil AI, dan jalur yang memanggil AI memakai
   * ikon berkas biasa -- persis terbalik.
   */
  function handleCreate(cara: "kosong" | "md" | "ai") {
    setBusy(true, t.editor.creatingCourse)

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
      const tambahan = cara === "md" ? "&impor=1" : cara === "ai" ? "&ai=1" : ""
      router.push(`/admin/courses/${result.data.id}/edit?new=1${tambahan}`)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            pending={pending}
            pendingLabel={t.editor.creating}
            className="bg-brand-gradient text-white hover:brightness-105"
          >
            <Plus className="size-4" aria-hidden />
            {t.admin.createCourse}
            <ChevronDown className="size-4" aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => handleCreate("kosong")}>
          <FileText className="size-4" aria-hidden />
          <div>
            <div>{t.editor.blankCourse}</div>
            <div className="text-xs text-muted-foreground">{t.editor.blankCourseDesc}</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCreate("ai")}>
          <Sparkles className="size-4" aria-hidden />
          <div>
            <div>{t.editor.createWithAi}</div>
            <div className="text-xs text-muted-foreground">{t.editor.createWithAiDesc}</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCreate("md")}>
          <FileUp className="size-4" aria-hidden />
          <div>
            <div>{t.editor.importMd}</div>
            <div className="text-xs text-muted-foreground">{t.editor.importMdDesc}</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
