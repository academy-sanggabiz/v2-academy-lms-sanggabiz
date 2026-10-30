"use client"

import { useRouter } from "next/navigation"
import { Suspense, use, useEffect, useState, useTransition } from "react"
import { ArrowLeft } from "lucide-react"
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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BusyGuardProvider } from "@/components/ui/busy-guard"
import { SaveStatus, type SaveState } from "@/components/ui/save-status"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigationBlocker } from "@/components/admin/NavigationBlockerContext"
import type { Instructor } from "@/lib/courses"
import type { AdminCourseDetail, CoursePrerequisite } from "@/lib/courses-admin"
import type { CourseRosterEntry } from "@/lib/learners-admin"
import type { Paginated } from "@/lib/pagination"
import { saveCourseDraftAction } from "@/app/admin/courses/actions"
import {
  countDestructiveChanges,
  courseDraftSchema,
  describeQuizIssue,
  validateQuizzes,
  type CourseDraft,
  type QuizIssue,
} from "@/lib/course-draft"

import { CourseDraftProvider, useCourseDraft } from "./CourseDraftContext"
import { RestoreDraftDialog } from "./RestoreDraftDialog"
import { useDraftAutosave } from "./useDraftAutosave"
import { BasicInfoTab } from "./tabs/BasicInfoTab"
import { LearnersTab } from "./tabs/LearnersTab"
import { LessonsTab } from "./tabs/LessonsTab"
import { PreviewTab } from "./tabs/PreviewTab"
import { SettingsTab } from "./tabs/SettingsTab"

type ShellProps = {
  course: AdminCourseDetail
  /**
   * Dioper sebagai promise, bukan nilai: ketiganya hanya dipakai tab Pengaturan
   * dan Peserta, jadi editor sudah bisa tampil sebelum ketiganya selesai.
   */
  instructorsPromise: Promise<Instructor[]>
  prerequisitesPromise: Promise<CoursePrerequisite[]>
  rosterPromise: Promise<Paginated<CourseRosterEntry>>
  isNew?: boolean
}

export function CourseFormShell(props: ShellProps) {
  return (
    <CourseDraftProvider course={props.course} isNew={props.isNew}>
      <CourseFormShellInner {...props} />
    </CourseDraftProvider>
  )
}

function CourseFormShellInner({
  course,
  instructorsPromise,
  prerequisitesPromise,
  rosterPromise,
  isNew = false,
}: ShellProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [basicInfoErrors, setBasicInfoErrors] = useState<Record<string, string>>({})
  const [quizIssues, setQuizIssues] = useState<QuizIssue[]>([])
  const [tab, setTab] = useState("basic")
  const [pendingSave, setPendingSave] = useState<{
    status: "draft" | "published"
    data: CourseDraft
    destructive: { lessons: number; questions: number }
  } | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const { setIsBlocked, setBlockMessage } = useNavigationBlocker()
  const { draft, baseline, dispatch, isDirty, courseId } = useCourseDraft()
  const autosave = useDraftAutosave({ courseId, draft, baseline, isDirty, dispatch })

  const saveState: SaveState = isPending
    ? "saving"
    : isDirty
      ? "unsaved"
      : lastSavedAt
        ? "saved"
        : "idle"

  useEffect(() => {
    // Saat penyimpanan sedang berjalan, pesan baku ("belum disimpan") keliru:
    // penyimpanannya akan mendarat. Pergi sekarang hanya membuat admin tidak
    // pernah melihat hasilnya (R16).
    setIsBlocked(isDirty || isPending)
    setBlockMessage(
      isPending ? "Penyimpanan sedang berjalan. Tinggalkan halaman tanpa menunggu hasilnya?" : null
    )
    return () => {
      setIsBlocked(false)
      setBlockMessage(null)
    }
  }, [isDirty, isPending, setIsBlocked, setBlockMessage])

  useEffect(() => {
    if (!isDirty) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  function handleBack() {
    if (isDirty) {
      setShowLeaveDialog(true)
      return
    }
    router.push("/admin/courses")
  }

  function performSave(status: "draft" | "published", data: CourseDraft) {
    // Potret draf saat penyimpanan dimulai, supaya reducer bisa membedakan
    // "tidak ada perubahan" dari "disunting lagi selama menyimpan".
    const from = draft

    startTransition(async () => {
      const result = await saveCourseDraftAction(course.id, data, status)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      // Simpan draf sudah dikonfirmasi oleh penanda "Tersimpan pukul …" di
      // sebelah tombolnya, jadi toast tambahan menjadi pesan kedua untuk satu
      // aksi (R6). Terbit tetap pakai toast: itu aksi berdampak luas (R8).
      if (status === "published") toast.success("Kursus diterbitkan")
      setLastSavedAt(new Date())
      dispatch({ type: "commitSaved", saved: data, from })
      router.refresh()
    })
  }

  function onSubmit(status: "draft" | "published") {
    const parsed = courseDraftSchema.safeParse(draft)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "")
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setBasicInfoErrors(fieldErrors)
      setTab("basic")
      toast.error("Perbaiki isian yang ditandai")
      return
    }
    setBasicInfoErrors({})

    // Blocks Save to Draft as well as Publish -- a question with no correct
    // answer is broken either way, and the localStorage autosave means
    // refusing the save loses nothing.
    const issues = validateQuizzes(parsed.data)
    if (issues.length > 0) {
      setQuizIssues(issues)
      setTab("lessons")
      toast.error(
        issues.length === 1
          ? describeQuizIssue(issues[0])
          : `${describeQuizIssue(issues[0])} (+${issues.length - 1} lainnya)`
      )
      return
    }
    setQuizIssues([])

    const destructive = countDestructiveChanges(parsed.data, baseline)
    if (destructive.lessons > 0 || destructive.questions > 0) {
      setPendingSave({ status, data: parsed.data, destructive })
      return
    }

    performSave(status, parsed.data)
  }

  return (
    /*
     * Satu penyimpanan menulis seluruh pohon kursus sekaligus. Selama itu
     * berjalan, setiap tombol penulis lain di editor ikut terkunci -- menekan
     * "Terbitkan" saat "Simpan Draf" masih jalan, atau menghapus pelajaran yang
     * sedang ikut terkirim, menghasilkan dua tulisan untuk data yang sama
     * (STANDAR-UMPAN-BALIK-UI.md R14, R17).
     */
    <BusyGuardProvider busy={isPending} reason="Menyimpan…">
    <div className="mx-auto max-w-[900px]">
      {autosave.pendingRestore && (
        <RestoreDraftDialog
          updatedAt={autosave.pendingRestore.updatedAt}
          isStale={autosave.isStale}
          onRestore={autosave.restore}
          onDiscard={autosave.discard}
        />
      )}
      <AlertDialog open={pendingSave !== null} onOpenChange={(open) => !open && setPendingSave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Penyimpanan ini menghapus konten</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSave && (
                <>
                  Menyimpan akan menghapus permanen{" "}
                  {[
                    pendingSave.destructive.lessons > 0 &&
                      `${pendingSave.destructive.lessons} pelajaran`,
                    pendingSave.destructive.questions > 0 &&
                      `${pendingSave.destructive.questions} soal`,
                  ]
                    .filter(Boolean)
                    .join(" dan ")}
                  , termasuk progres peserta atau percobaan kuis yang terkait. Tindakan ini tidak
                  dapat dibatalkan.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              onClick={() => {
                if (!pendingSave) return
                performSave(pendingSave.status, pendingSave.data)
                setPendingSave(null)
              }}
            >
              Tetap simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
        <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Perubahan belum disimpan</AlertDialogTitle>
              <AlertDialogDescription>
                Ada perubahan yang belum disimpan. Tinggalkan tanpa menyimpan?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => router.push("/admin/courses")}>
                Tinggalkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-3 text-xl font-bold">{isNew ? "Kursus Baru" : "Ubah Kursus"}</h1>
          {/*
           * Mengetik di tab mana pun hanya mengubah draf di browser; tidak ada
           * yang sampai ke database sebelum tombol di sebelah ditekan. Tanpa
           * penanda ini admin tidak bisa membedakan "sudah tersimpan" dari
           * "masih di layar saya saja" (STANDAR-UMPAN-BALIK-UI.md R12).
           */}
          <SaveStatus
            state={saveState}
            savedAt={lastSavedAt}
            unsavedLabel="Perubahan belum disimpan"
            className="mr-1"
          />
          <Button
            variant="outline"
            pending={isPending}
            pendingLabel="Menyimpan…"
            onClick={() => onSubmit("draft")}
          >
            Simpan Draf
          </Button>
          <Button
            pending={isPending}
            pendingLabel="Menyimpan…"
            className="bg-brand-gradient text-white hover:brightness-105"
            onClick={() => onSubmit("published")}
          >
            {course.status === "published" ? "Simpan" : "Terbitkan"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <Tabs value={tab} onValueChange={setTab}>
          {/* Scrolls inside its own box on a phone instead of widening the page (WCAG 1.4.10). */}
          <TabsList className="mb-6 max-w-full justify-start overflow-x-auto">
            <TabsTrigger value="basic">Info Dasar</TabsTrigger>
            <TabsTrigger value="lessons">Pelajaran</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
            <TabsTrigger value="learners">Peserta</TabsTrigger>
            <TabsTrigger value="preview">Pratinjau</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoTab errors={basicInfoErrors} />
          </TabsContent>

          <TabsContent value="lessons">
            <LessonsTab quizIssues={quizIssues} />
          </TabsContent>

          <TabsContent value="settings">
            <Suspense fallback={<TabLoadingSkeleton label="Memuat pengaturan…" />}>
              <SettingsTabStreamed
                status={course.status}
                instructorsPromise={instructorsPromise}
                prerequisitesPromise={prerequisitesPromise}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="learners">
            <Suspense fallback={<TabLoadingSkeleton label="Memuat peserta…" />}>
              <LearnersTabStreamed courseId={course.id} rosterPromise={rosterPromise} />
            </Suspense>
          </TabsContent>

          <TabsContent value="preview">
            <PreviewTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </BusyGuardProvider>
  )
}

/** Bentuk sementara saat data tab masih mengalir dari server. */
function TabLoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4">
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {label}
      </p>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-2/3" />
    </div>
  )
}

function SettingsTabStreamed({
  status,
  instructorsPromise,
  prerequisitesPromise,
}: {
  status: AdminCourseDetail["status"]
  instructorsPromise: Promise<Instructor[]>
  prerequisitesPromise: Promise<CoursePrerequisite[]>
}) {
  return (
    <SettingsTab
      status={status}
      instructors={use(instructorsPromise)}
      availableCoursesForPrerequisites={use(prerequisitesPromise)}
    />
  )
}

function LearnersTabStreamed({
  courseId,
  rosterPromise,
}: {
  courseId: string
  rosterPromise: Promise<Paginated<CourseRosterEntry>>
}) {
  return <LearnersTab courseId={courseId} roster={use(rosterPromise)} />
}
