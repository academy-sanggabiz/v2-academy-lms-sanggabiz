"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  CircleHelp,
  FileText,
  MousePointerClick,
  PlayCircle,
  Presentation,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { CourseSection, LessonContentType } from "@/lib/courses"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { plural } from "@/lib/i18n/plural"
import type { Dictionary } from "@/lib/i18n/dictionaries"

/** Label jenis pelajaran; ikut bahasa antarmuka, bukan teks tetap. */
function typeLabels(t: Dictionary): Record<LessonContentType, string> {
  return {
    video: t.catalog.typeVideo,
    text: t.catalog.typeText,
    quiz: t.catalog.typeQuiz,
    mixed: t.catalog.typeMixed,
    ppt: t.catalog.typeSlides,
    interactive: t.catalog.typeInteractive,
  }
}

const typeIcon: Record<LessonContentType, typeof PlayCircle> = {
  video: PlayCircle,
  text: FileText,
  quiz: CircleHelp,
  mixed: PlayCircle,
  ppt: Presentation,
  interactive: MousePointerClick,
}

export function CourseCurriculum({
  sections,
  courseId,
  basePath = "/learn",
  enrolled = true,
  onLockedLessonClick,
}: {
  sections: CourseSection[]
  courseId: string
  basePath?: string
  enrolled?: boolean
  onLockedLessonClick?: () => void
}) {
  const { t } = useI18n()
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null)

  return (
    <div>
      {sections.map((section) => {
        const isOpen = openId === section.id
        return (
          <div key={section.id} className="border-b border-muted last:border-b-0">
            <button
              onClick={() => setOpenId(isOpen ? null : section.id)}
              className="flex w-full items-center gap-3 py-4 text-left text-base font-semibold hover:text-primary"
            >
              <span className="flex-1">{section.title}</span>
              <ChevronDown
                className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
              />
            </button>
            {isOpen && (
              <div className="flex flex-col gap-1 pb-3.5 pl-1">
                {section.lessons.map((lesson) => {
                  const Icon = typeIcon[lesson.content_type]
                  const lessonContent = (
                    <>
                      <Icon className="size-4 shrink-0 text-primary" />
                      <span className="flex-1 truncate">{lesson.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {lesson.content_type === "quiz" && lesson.quiz
                          ? plural(
                              lesson.quiz.questions.length,
                              t.catalog.nQuestionsOne,
                              t.catalog.nQuestions
                            )
                          : typeLabels(t)[lesson.content_type]}
                      </span>
                    </>
                  )

                  if (!enrolled) {
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={onLockedLessonClick}
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground/80 hover:bg-muted"
                      >
                        {lessonContent}
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={lesson.id}
                      href={`${basePath}/${courseId}?lesson=${lesson.id}`}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground/80 hover:bg-muted"
                    >
                      {lessonContent}
                    </Link>
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
