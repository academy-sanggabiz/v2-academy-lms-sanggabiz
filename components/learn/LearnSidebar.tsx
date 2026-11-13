"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, CircleCheck, Circle, FileText, HelpCircle, Presentation, Video, Lock} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDuration, type CourseSection, type LessonContentType } from "@/lib/courses"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { LessonAssistant } from "@/components/learn/LessonAssistant"
import { LessonCompleteCheckbox } from "@/components/learn/LessonCompleteCheckbox"

const typeIcon: Record<LessonContentType, typeof Video> = {
  video: Video,
  text: FileText,
  quiz: HelpCircle,
  mixed: Video,
  ppt: Presentation,
}

const typeLabel: Record<LessonContentType, string> = {
  video: "Video",
  text: "Bacaan",
  quiz: "Kuis",
  mixed: "Campuran",
  ppt: "Slide",
}

export function LearnSidebar({
  courseId,
  sections,
  currentLessonId,
  completedLessonIds,
  unlockedLessonIds,
  basePath = "/learn",
  mode = "learner",
  aiAktif = false,
  currentIsQuiz = false,
  currentHasTranscript = false,
}: {
  courseId: string
  sections: CourseSection[]
  currentLessonId: string
  completedLessonIds: Set<string>
  /** Semua pelajaran bila kursusnya bebas; sebagian bila berurutan. */
  unlockedLessonIds?: Set<string>
  basePath?: string
  mode?: "learner" | "admin-preview"
  /**
   * Tab "Asisten AI" hanya dirender bila ini true. Diputuskan di SERVER
   * (`aiAktif()`), bukan ditebak di peramban.
   *
   * Tab ini pernah ada di v2 lalu DIHAPUS karena hanya tampilan tanpa backend,
   * dan standar v2 memperlakukan kontrol yang tidak melakukan apa-apa sebagai
   * cacat. Ia kembali dengan backend sungguhan -- dan dengan syarat ini,
   * keadaan "tampil lalu gagal" tidak bisa terulang.
   */
  aiAktif?: boolean
  /** Pelajaran yang sedang dibuka: kuis tidak punya asisten. */
  currentIsQuiz?: boolean
  currentHasTranscript?: boolean
}) {
  const { t } = useI18n()
  const [tab, setTab] = useState<"isi" | "asisten">("isi")

  // Kuis dan studi kasus tidak punya asisten: membantu memahami bacaan adalah
  // hal lain dari membantu menjawab penilaian. Ditegakkan lagi di server.
  const adaAsisten = aiAktif && !currentIsQuiz
  const aktif = adaAsisten ? tab : "isi"

  const isi = (
    <ContentTab
      courseId={courseId}
      sections={sections}
      currentLessonId={currentLessonId}
      completedLessonIds={completedLessonIds}
      unlockedLessonIds={unlockedLessonIds}
      basePath={basePath}
      mode={mode}
    />
  )

  if (!adaAsisten) {
    return (
      <aside aria-labelledby="course-content-heading" className="flex min-h-0 flex-1 flex-col border-l border-border bg-card">
        <h2 id="course-content-heading" className="border-b border-muted px-5 py-3 text-sm font-semibold text-foreground">
          {t.player.contentTab}
        </h2>
        {isi}
      </aside>
    )
  }

  return (
    <aside className="flex min-h-0 flex-1 flex-col border-l border-border bg-card">
      <div role="tablist" aria-label={t.player.contentTab} className="flex border-b border-muted">
        {([
          ["isi", t.player.contentTab],
          ["asisten", t.player.assistantTab],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={aktif === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={
              aktif === id
                ? "min-h-11 flex-1 border-b-2 border-ring px-3 text-sm font-semibold text-primary"
                : "min-h-11 flex-1 border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/*
        `hidden`, bukan dilepas: panel yang dilepas kehilangan percakapannya,
        dan berpindah tab lalu kembali tidak boleh menghapus apa yang sudah
        ditanyakan.
      */}
      <div
        role="tabpanel"
        id="panel-isi"
        aria-labelledby="tab-isi"
        hidden={aktif !== "isi"}
        className="flex min-h-0 flex-1 flex-col"
      >
        {isi}
      </div>
      <div
        role="tabpanel"
        id="panel-asisten"
        aria-labelledby="tab-asisten"
        hidden={aktif !== "asisten"}
        className="flex min-h-0 flex-1 flex-col"
      >
        <LessonAssistant
          courseId={courseId}
          lessonId={currentLessonId}
          adaTranskrip={!!currentHasTranscript}
          pratinjau={mode === "admin-preview"}
        />
      </div>
    </aside>
  )
}

function ContentTab({
  courseId,
  sections,
  currentLessonId,
  completedLessonIds,
  unlockedLessonIds,
  basePath = "/learn",
  mode = "learner",
}: {
  courseId: string
  sections: CourseSection[]
  currentLessonId: string
  completedLessonIds: Set<string>
  /** Semua pelajaran bila kursusnya bebas; sebagian bila berurutan. */
  unlockedLessonIds?: Set<string>
  basePath?: string
  mode?: "learner" | "admin-preview"
}) {
  // Open the module that holds the current lesson, so the learner sees where
  // they are without hunting for it.
  const [openId, setOpenId] = useState<string | null>(
    sections.find((s) => s.lessons.some((l) => l.id === currentLessonId))?.id ?? sections[0]?.id ?? null
  )

  return (
    <div className="flex-1 overflow-y-auto">
      {sections.map((section) => {
        const isOpen = openId === section.id
        const doneCount = section.lessons.filter((l) => completedLessonIds.has(l.id)).length

        return (
          <div key={section.id} className="border-b border-muted">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : section.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-2.5 bg-secondary/40 px-5 py-3.5 text-left hover:bg-secondary/70"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold leading-tight">{section.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {mode === "admin-preview"
                    ? `${section.lessons.length} pelajaran`
                    : `${doneCount} dari ${section.lessons.length} selesai`}
                </div>
              </div>
              <ChevronDown
                aria-hidden
                className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
              />
            </button>

            {isOpen && (
              <div className="flex flex-col">
                {section.lessons.map((lesson) => {
                  const Icon = typeIcon[lesson.content_type]
                  const isActive = lesson.id === currentLessonId
                  const isDone = completedLessonIds.has(lesson.id)
                  // Tanpa daftar terbuka, kursusnya bebas -- semua terbuka.
                  const isLocked = unlockedLessonIds ? !unlockedLessonIds.has(lesson.id) : false

                  const body = (
                    <>
                      <div className="line-clamp-2 text-sm leading-snug">{lesson.title}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className="size-3" aria-hidden />
                        <span>
                          {typeLabel[lesson.content_type]}
                          {mode === "learner" && isDone ? " · Selesai" : ""}
                          {isLocked ? " · Terkunci" : ""}
                          {lesson.duration_seconds ? ` · ${formatDuration(lesson.duration_seconds)}` : ""}
                        </span>
                      </div>
                    </>
                  )

                  return (
                    <div
                      key={lesson.id}
                      className={cn(
                        "flex items-center gap-2.5 border-l-2 px-5 py-2.5",
                        isActive ? "border-ring bg-secondary" : "border-transparent hover:bg-muted",
                        isLocked && "opacity-60"
                      )}
                    >
                      {mode === "learner" &&
                        (isLocked ? (
                          /* Gembok menggantikan kotak centang, bukan menemaninya:
                             kotak centang yang bisa ditekan pada pelajaran
                             terkunci akan membuka kunci pelajaran berikutnya
                             tanpa pelajaran ini pernah dibuka. */
                          <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        ) : lesson.content_type === "quiz" ? (
                          /* Pelajaran kuis menunjukkan keadaannya, tidak
                             menawarkan kotak centang.

                             Kuis biasa selesai dengan LULUS; kuis ukur
                             ditandai selesai oleh pengirimannya. Keduanya
                             jalur lain, jadi kotak centang di sini adalah
                             kontrol yang tidak pernah boleh berhasil --
                             dan sejak temuan C-13 ditutup, aksinya memang
                             menolaknya. Menampilkan kontrol yang pasti gagal
                             melanggar docs/STANDAR-UMPAN-BALIK-UI.md.

                             Bukan ikon saja: subjudul di bawah sudah menulis
                             "Selesai" sebagai teks, jadi keadaannya tidak
                             pernah hanya bentuk atau warna. */
                          isDone ? (
                            <CircleCheck className="size-4 shrink-0 text-success-foreground" aria-hidden />
                          ) : (
                            <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                          )
                        ) : (
                          <LessonCompleteCheckbox
                            courseId={courseId}
                            lessonId={lesson.id}
                            title={lesson.title}
                            isDone={isDone}
                          />
                        ))}

                      {isLocked ? (
                        /* Teks biasa, bukan tautan dinonaktifkan: tautan yang
                           tidak membawa ke mana-mana tetap jadi perhentian tab
                           dan tetap diumumkan sebagai tautan. */
                        <div className="min-w-0 flex-1">{body}</div>
                      ) : (
                      <Link
                        href={`${basePath}/${courseId}?lesson=${lesson.id}`}
                        aria-current={isActive ? "page" : undefined}
                        className="min-w-0 flex-1"
                      >
                        {body}
                      </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
