"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
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
import { BusyGuardProvider } from "@/components/ui/busy-guard"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Instructor } from "@/lib/courses"
import { createInstructorAction, deleteInstructorAction } from "@/app/admin/courses/actions"
import { useCourseDraft } from "./CourseDraftContext"
import { useI18n } from "@/components/i18n/LocaleProvider"

// instructors is a global directory (is_admin()-gated, not owns_course()) --
// multiple admins' courses can reference the same instructor -- so create
// and delete stay immediate server writes; only the course<->instructor
// assignment itself is drafted.
export function InstructorPicker({ instructors: initialInstructors }: { instructors: Instructor[] }) {
  const { draft, dispatch } = useCourseDraft()
  const { t } = useI18n()
  const [instructors, setInstructors] = useState(initialInstructors)
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")

  function handleSelect(instructorId: string) {
    const isSelected = instructorId === draft.instructorId
    dispatch({ type: "setField", patch: { instructorId: isSelected ? null : instructorId } })
  }

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createInstructorAction({ name: name.trim(), title: null, bio: bio.trim() || null })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      // createInstructorAction doesn't revalidatePath (it's not tied to any
      // one course) -- append locally instead of relying on a server refresh.
      setInstructors((prev) => [
        ...prev,
        { id: result.data.id, name: name.trim(), title: null, bio: bio.trim() || null, avatar_url: null },
      ])
      dispatch({ type: "setField", patch: { instructorId: result.data.id } })
      toast.success(t.editor.instructorCreated)
      setName("")
      setBio("")
      setDialogOpen(false)
    })
  }

  function handleDelete(instructorId: string) {
    startTransition(async () => {
      const result = await deleteInstructorAction(instructorId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setInstructors((prev) => prev.filter((i) => i.id !== instructorId))
      if (draft.instructorId === instructorId) {
        dispatch({ type: "setField", patch: { instructorId: null } })
      }
      toast.success(t.editor.instructorDeleted)
    })
  }

  return (
    /*
     * Menghapus atau membuat instruktur menulis langsung ke server. Guard ini
     * menahan tombol tetangganya tanpa melepas fokus keyboard, menggantikan
     * `disabled` yang membuat tombol keluar dari urutan tab di tengah aksi
     * (STANDAR-UMPAN-BALIK-UI.md R11, R14).
     */
    <BusyGuardProvider busy={isPending} reason={t.common.saving}>
    <div className="space-y-3">
      {instructors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          {t.editor.noInstructors}
        </p>
      ) : (
        <div className="space-y-2">
          {instructors.map((instructor) => {
            const selected = instructor.id === draft.instructorId
            return (
              <div key={instructor.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelect(instructor.id)}
                  className={`flex flex-1 items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selected ? "border-primary bg-secondary" : "border-border hover:bg-muted"
                  }`}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {instructor.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{instructor.name}</span>
                    {instructor.bio && (
                      <span className="block truncate text-xs text-muted-foreground">{instructor.bio}</span>
                    )}
                  </span>
                  {selected && <span className="text-xs font-semibold text-primary">{t.editor.selectedMark}</span>}
                </button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t.editor.deleteNamed.replace("{nama}", instructor.name)}
                        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      />
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.editor.deleteInstructorTitle.replace("{nama}", instructor.name)}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.editor.deleteInstructorDesc}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                        onClick={() => handleDelete(instructor.id)}
                        pending={isPending}
                        pendingLabel={t.editor.deleting}
                      >
                        {t.editor.deleteWord}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <Plus className="size-3.5" />
          {t.editor.addInstructor}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editor.addInstructor}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="instructor-name">{t.editor.nameLabel}</Label>
              <Input id="instructor-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instructor-bio">{t.editor.bioLabel}</Label>
              <Textarea id="instructor-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={!name.trim()}
              pending={isPending}
              pendingLabel={t.editor.creating}
            >
              {t.editor.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </BusyGuardProvider>
  )
}
