"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteCourseAction } from "@/app/admin/courses/actions"
import { useI18n } from "@/components/i18n/LocaleProvider"

export function DeleteCourseDialog({
  courseId,
  courseTitle,
  className,
}: {
  courseId: string
  courseTitle: string
  className?: string
}) {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCourseAction(courseId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t.editor.courseDeleted)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive" className={className} aria-label={t.editor.deleteCourseAria} />}
      >
        <Trash2 className="size-3.5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.editor.deleteTitled.replace("{judul}", courseTitle)}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.editor.deleteCourseDesc}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
            onClick={handleDelete}
            pending={isPending}
            pendingLabel={t.editor.deleting}
          >
            {t.editor.deleteWord}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
