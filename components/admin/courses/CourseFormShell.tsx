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
import type { Category, Instructor } from "@/lib/courses"
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
import { describeIncompleteLesson, findIncompleteLessons } from "@/lib/lesson-completeness"

import { CourseDraftProvider, useCourseDraft } from "./CourseDraftContext"
import { RestoreDraftDialog } from "./RestoreDraftDialog"
import { useDraftAutosave } from "./useDraftAutosave"
import { BasicInfoTab } from "./tabs/BasicInfoTab"
import { LearnersTab } from "./tabs/LearnersTab"
import { LessonsTab } from "./tabs/LessonsTab"
import { PreviewTab } from "./tabs/PreviewTab"
import { SettingsTab } from "./tabs/SettingsTab"
import { describeDraftIssue, describeDraftIssues } from "@/lib/course-draft-issues"
import { CourseMarkdownDialog } from "@/components/admin/courses/markdown/CourseMarkdownDialog"
import { SopDialog } from "@/components/admin/courses/sop/SopDialog"
import type { CertificateDefaults } from "@/lib/certificate-settings"
import { useI18n } from "@/components/i18n/LocaleProvider"

type ShellProps = {
  course: AdminCourseDetail
  certificateDefaultsPromise: Promise<CertificateDefaults>
  certificateReadyPromise: Promise<boolean>
  /**
   * Dioper sebagai promise, bukan nilai: ketiganya hanya dipakai tab Pengaturan
   * dan Peserta, jadi editor sudah bisa tampil sebelum ketiganya selesai.
   */
  instructorsPromise: Promise<Instructor[]>
  categoriesPromise: Promise<Category[]>
  prerequisitesPromise: Promise<CoursePrerequisite[]>
  rosterPromise: Promise<Paginated<CourseRosterEntry>>
  learnerCount: number
  /** Fitur AI menyala di server. Menentukan apakah tombol "Susun dari SOP" ada. */
  aiAktif: boolean
  isNew?: boolean
  /** Datang dari "Impor dari berkas .md" di daftar kursus. */
  openImport?: boolean
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
  certificateDefaultsPromise,
  certificateReadyPromise,
  instructorsPromise,
  categoriesPromise,
  prerequisitesPromise,
  rosterPromise,
  learnerCount,
  aiAktif,
  isNew = false,
  openImport = false,
}: ShellProps) {
  const router = useRouter()
  const { t } = useI18n()
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
    setBlockMessage(isPending ? t.editor.savingBlockMessage : null)
    return () => {
      setIsBlocked(false)
      setBlockMessage(null)
    }
  }, [isDirty, isPending, setIsBlocked, setBlockMessage, t])

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
      if (status === "published") toast.success(t.editor.publishedToast)
      setLastSavedAt(new Date())
      dispatch({ type: "commitSaved", saved: data, from })
      router.refresh()
    })
  }

  function onSubmit(status: "draft" | "published") {
    const parsed = courseDraftSchema.safeParse(draft)
    if (!parsed.success) {
      // Dulu setiap kegagalan dianggap berasal dari tab Info Dasar: penyusun
      // yang salah mengisi pengaturan sertifikat dilempar ke Info Dasar lalu
      // membaca "Perbaiki isian yang ditandai" tanpa ada satu pun isian yang
      // ditandai di sana. Sekarang pesannya menyebut ruasnya, dan tab yang
      // dibuka adalah tab tempat ruas itu berada.
      const issues = describeDraftIssues(parsed.error)
      const fieldErrors: Record<string, string> = {}
      for (const issue of issues) {
        if (issue.basicFieldKey && !fieldErrors[issue.basicFieldKey]) {
          fieldErrors[issue.basicFieldKey] = issue.message
        }
      }
      setBasicInfoErrors(fieldErrors)
      const first = issues[0]
      if (first) setTab(first.tab)
      toast.error(
        first
          ? issues.length === 1
            ? describeDraftIssue(first)
            : `${describeDraftIssue(first)} ${t.editor.plusOthers.replace("{n}", String(issues.length - 1))}`
          : t.editor.invalidData
      )
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
          : `${describeQuizIssue(issues[0])} ${t.editor.plusOthers.replace("{n}", String(issues.length - 1))}`
      )
      return
    }
    setQuizIssues([])

    /*
     * Gerbang terbit. Draf boleh setengah jadi -- memang begitu cara menulis
     * kursus -- tapi "Terbitkan" adalah janji kepada peserta bahwa isinya bisa
     * dipelajari. Sebelum ini editor menandai pelajaran "Belum lengkap" lalu
     * tetap menerbitkannya, sehingga kursus terbit bisa berisi "Pelajaran
     * Tanpa Judul" yang kosong dan peserta membuka halaman hampa.
     */
    if (status === "published") {
      const lessonCount = parsed.data.sections.reduce((n, section) => n + section.lessons.length, 0)
      if (lessonCount === 0) {
        setTab("lessons")
        toast.error(t.editor.noLessonsPublish)
        return
      }

      const incomplete = findIncompleteLessons(parsed.data)
      if (incomplete.length > 0) {
        setTab("lessons")
        toast.error(
          incomplete.length === 1
            ? describeIncompleteLesson(incomplete[0])
            : `${describeIncompleteLesson(incomplete[0])} ${t.editor.plusOtherLessons.replace("{n}", String(incomplete.length - 1))}`
        )
        return
      }
    }

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
    <BusyGuardProvider busy={isPending} reason={t.common.saving}>
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
            <AlertDialogTitle>{t.editor.destructiveTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSave && (
                <>
                  {t.editor.destructivePrefix}{" "}
                  {[
                    pendingSave.destructive.lessons > 0 &&
                      t.editor.nLessons.replace("{n}", String(pendingSave.destructive.lessons)),
                    pendingSave.destructive.questions > 0 &&
                      t.editor.nQuestions.replace("{n}", String(pendingSave.destructive.questions)),
                  ]
                    .filter(Boolean)
                    .join(` ${t.editor.andWord} `)}
                  {t.editor.destructiveSuffix}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              onClick={() => {
                if (!pendingSave) return
                performSave(pendingSave.status, pendingSave.data)
                setPendingSave(null)
              }}
            >
              {t.editor.keepSaving}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          {t.insight.back}
        </Button>
        <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.editor.leaveTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.editor.leaveDesc}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={() => router.push("/admin/courses")}>
                {t.editor.leave}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-3 text-xl font-bold">{isNew ? t.editor.newCourse : t.editor.editCourse}</h1>
          {/*
           * Mengetik di tab mana pun hanya mengubah draf di browser; tidak ada
           * yang sampai ke database sebelum tombol di sebelah ditekan. Tanpa
           * penanda ini admin tidak bisa membedakan "sudah tersimpan" dari
           * "masih di layar saya saja" (STANDAR-UMPAN-BALIK-UI.md R12).
           */}
          {/* Jembatan ke AI yang sudah dipakai penyusun kursus; LMS ini tidak
              memanggil AI sendiri. Lihat CourseMarkdownDialog. */}
          <CourseMarkdownDialog
            courseId={course.id}
            draft={draft}
            canImport={learnerCount === 0}
            openOnMount={openImport}
            learnerCount={learnerCount}
            onImported={(patch) => dispatch({ type: "setField", patch })}
          />
          {/* Jalur kedua ke draf yang sama: dokumen SOP, bukan berkas .md.
              Keduanya berakhir di parseCourseMarkdown dan di draf editor --
              tidak ada jalur tulis baru ke basis data. */}
          <SopDialog
            courseId={course.id}
            canImport={learnerCount === 0}
            learnerCount={learnerCount}
            aiAktif={aiAktif}
            onImported={(patch) => dispatch({ type: "setField", patch })}
          />
          <SaveStatus
            state={saveState}
            savedAt={lastSavedAt}
            unsavedLabel={t.editor.unsavedChanges}
            className="mr-1"
          />
          <Button
            variant="outline"
            pending={isPending}
            pendingLabel={t.common.saving}
            onClick={() => onSubmit("draft")}
          >
            {t.editor.saveDraft}
          </Button>
          <Button
            pending={isPending}
            pendingLabel={t.common.saving}
            className="bg-brand-gradient text-white hover:brightness-105"
            onClick={() => onSubmit("published")}
          >
            {course.status === "published" ? t.common.save : t.editor.publish}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <Tabs value={tab} onValueChange={setTab}>
          {/* Scrolls inside its own box on a phone instead of widening the page (WCAG 1.4.10). */}
          <TabsList className="mb-6 max-w-full justify-start overflow-x-auto">
            <TabsTrigger value="basic">{t.editor.tabBasic}</TabsTrigger>
            <TabsTrigger value="lessons">{t.editor.tabLessons}</TabsTrigger>
            <TabsTrigger value="settings">{t.editor.tabSettings}</TabsTrigger>
            <TabsTrigger value="learners">{t.editor.tabLearners}</TabsTrigger>
            <TabsTrigger value="preview">{t.editor.tabPreview}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoTab errors={basicInfoErrors} />
          </TabsContent>

          <TabsContent value="lessons">
            <LessonsTab quizIssues={quizIssues} />
          </TabsContent>

          <TabsContent value="settings">
            <Suspense fallback={<TabLoadingSkeleton label={t.editor.loadingSettings} />}>
              <SettingsTabStreamed
                status={course.status}
                instructorsPromise={instructorsPromise}
                categoriesPromise={categoriesPromise}
                prerequisitesPromise={prerequisitesPromise}
                certificateDefaultsPromise={certificateDefaultsPromise}
                certificateReadyPromise={certificateReadyPromise}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="learners">
            <Suspense fallback={<TabLoadingSkeleton label={t.editor.loadingLearners} />}>
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
  categoriesPromise,
  prerequisitesPromise,
  certificateDefaultsPromise,
  certificateReadyPromise,
}: {
  status: AdminCourseDetail["status"]
  instructorsPromise: Promise<Instructor[]>
  categoriesPromise: Promise<Category[]>
  prerequisitesPromise: Promise<CoursePrerequisite[]>
  certificateDefaultsPromise: Promise<CertificateDefaults>
  certificateReadyPromise: Promise<boolean>
}) {
  return (
    <SettingsTab
      status={status}
      instructors={use(instructorsPromise)}
      categories={use(categoriesPromise)}
      availableCoursesForPrerequisites={use(prerequisitesPromise)}
      certificateDefaults={use(certificateDefaultsPromise)}
      certificateDefaultsReady={use(certificateReadyPromise)}
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
