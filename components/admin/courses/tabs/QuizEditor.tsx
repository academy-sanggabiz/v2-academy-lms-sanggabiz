"use client"

import { useState, useTransition } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, GripVertical, Library, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { RichTextEditor } from "../RichTextEditor"
import type { AuthorableQuestionType } from "@/lib/courses-admin"
import type { DraftOption, DraftQuestion, DraftQuiz } from "@/lib/course-draft"
import { QUESTION_TYPE_POINTS, type QuizMeasureKind } from "@/lib/courses"
import { ASSESSMENT_GRADE_WEIGHT } from "@/lib/course-grade"
import { QUESTION_TYPES } from "@/lib/question-types"
import { QuestionBankDialog } from "@/components/admin/courses/bank/QuestionBankDialog"
import { addBankItemsAction } from "@/app/admin/courses/bank-actions"
import { useCourseDraft } from "../CourseDraftContext"
import { useQuestionQuizIssue } from "../QuizIssuesContext"
import { dndAnnouncements } from "@/lib/dnd-announcements"
import { useI18n } from "@/components/i18n/LocaleProvider"
import type { Dictionary } from "@/lib/i18n/dictionaries"

// Only auto-gradable types are offered for a normal quiz. Essay/file_upload
// only exist inside a study case (see "Add Study Case" below) -- a normal
// quiz must always resolve to an immediate score, never `pending_review`.
/** Both map to Essay in the UI; the stored `type` is what selects the answer widget. */
function answerFormats(t: Dictionary): { value: "essay" | "file_upload"; label: string; hint: string }[] {
  return [
    { value: "essay", label: t.editor.answerWritten, hint: t.editor.answerWrittenHint },
    { value: "file_upload", label: t.editor.answerUpload, hint: t.editor.answerUploadHint },
  ]
}

/** Label jenis soal mengikuti bahasa; nilai tersimpannya tetap. */
function questionTypeLabels(t: Dictionary): Record<string, string> {
  return {
    multiple_choice: t.editor.qtMultipleChoice,
    true_false: t.editor.qtTrueFalse,
    short_answer: t.editor.qtShortAnswer,
  }
}

function isEssayQuestion(type: AuthorableQuestionType): type is "essay" | "file_upload" {
  return type === "essay" || type === "file_upload"
}

export function QuizEditor({ lessonId, quiz }: { lessonId: string; quiz: DraftQuiz | null }) {
  const { t } = useI18n()
  const [bankOpen, setBankOpen] = useState(false)
  const [savingToBank, startSavingToBank] = useTransition()
  const { dispatch } = useCourseDraft()

  // Sensor sendiri untuk kuis: Space/Enter mengangkat soal, panah
  // memindahkan, Space menjatuhkan -- alternatif non-tetikus yang diminta
  // WCAG 2.5.7, sama seperti di daftar pelajaran.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<AuthorableQuestionType>("multiple_choice")

  function openPicker() {
    // Always start from the default rather than remembering the last pick.
    setSelectedType("multiple_choice")
    setPickerOpen(true)
  }

  function handleAddQuestion(type: AuthorableQuestionType) {
    dispatch({ type: "addQuestion", lessonId, questionType: type })
    setPickerOpen(false)
  }

  function handleAddStudyCase() {
    dispatch({ type: "addQuestion", lessonId, questionType: "essay", isAssessment: true })
  }

  const questions = quiz?.questions ?? []
  const isAssessment = quiz?.is_assessment ?? false

  /**
   * Menyimpan seluruh soal kuis ini ke bank sebagai salinan lepas.
   *
   * Soal yang teksnya masih kosong dilewati, bukan ditolak semuanya: penyusun
   * biasanya menekan ini setelah menulis sebagian soal, dan menolak seluruh
   * kumpulan karena satu soal yang belum diisi membuat tombolnya terasa rusak.
   */
  function saveAllToBank() {
    const siap = questions.filter((q) => q.prompt.trim())
    if (siap.length === 0) {
      toast.error(t.editor.noPromptsFilled)
      return
    }
    startSavingToBank(async () => {
      const result = await addBankItemsAction(
        siap.map((q) => ({
          type: q.type,
          prompt: q.prompt,
          allow_multiple: q.allow_multiple,
          case_sensitive: q.case_sensitive,
          explanation: q.explanation,
          tags: [],
          sourceCourseId: null,
          options: q.options.map((o) => ({ text: o.text, is_correct: o.is_correct })),
        }))
      )
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      const dilewati = questions.length - siap.length
      toast.success(
        (dilewati > 0 ? t.editor.savedToBankSkipped : t.editor.savedToBank)
          .replace("{n}", String(result.data.added))
          .replace("{lewat}", String(dilewati))
      )
    })
  }

  return (
    <div>
      {quiz && questions.length > 0 && <QuizSettings lessonId={lessonId} quiz={quiz} />}

      {questions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {t.editor.noQuestions}
        </p>
      ) : (
        /*
          DndContext sendiri, bukan ikut milik LessonsTab: soal hanya boleh
          berpindah di dalam satu kuis, dan menggabungkannya ke konteks yang
          sama membuat soal bisa dijatuhkan ke modul atau pelajaran lain.
        */
        <DndContext
          sensors={sensors}
          accessibility={dndAnnouncements(t.editor.questionNoun, t)}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event
            if (over && active.id !== over.id) {
              dispatch({
                type: "moveQuestion",
                questionId: active.id as string,
                overQuestionId: over.id as string,
              })
            }
          }}
        >
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2.5">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  measureKind={quiz?.measure_kind ?? null}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!isAssessment && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openPicker}>
            <Plus className="size-3.5" />
            {t.editor.addQuestion}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setBankOpen(true)}>
            <Library className="size-3.5" />
            {t.editor.fromBank}
          </Button>
          {questions.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              pending={savingToBank}
              pendingLabel={t.common.saving}
              onClick={saveAllToBank}
            >
              {t.editor.saveNToBank.replace("{n}", String(questions.length))}
            </Button>
          )}
          {questions.length === 0 && (
            <Button type="button" variant="outline" size="sm" onClick={handleAddStudyCase}>
              <Plus className="size-3.5" />
              {t.editor.addStudyCase}
            </Button>
          )}
        </div>
      )}

      <QuestionBankDialog
        open={bankOpen}
        onOpenChange={setBankOpen}
        onPick={(picked) => dispatch({ type: "insertQuestions", lessonId, questions: picked })}
      />

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{t.editor.addQuestion}</DialogTitle>
            <DialogDescription>{t.editor.pickTypeDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t.editor.typeLabel}</Label>
            <RadioGroup
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as AuthorableQuestionType)}
            >
              {QUESTION_TYPES.map((jenis) => (
                <label key={jenis.value} className="flex items-center gap-2.5 text-sm">
                  <RadioGroupItem value={jenis.value} />
                  {questionTypeLabels(t)[jenis.value] ?? jenis.label}
                </label>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPickerOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="button" variant="outline" onClick={() => handleAddQuestion(selectedType)}>
              {t.editor.addQuestion}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function QuizSettings({ lessonId, quiz }: { lessonId: string; quiz: DraftQuiz }) {
  const { dispatch } = useCourseDraft()
  const { t } = useI18n()
  const [passScore, setPassScore] = useState(String(quiz.pass_score))
  const [maxAttempts, setMaxAttempts] = useState(quiz.max_attempts ? String(quiz.max_attempts) : "")
  const [drawCount, setDrawCount] = useState(quiz.draw_count ? String(quiz.draw_count) : "")
  const total = quiz.questions.length

  /**
   * Angka di luar 1..total tidak punya arti: nol soal bukan kuis, dan menarik
   * lebih banyak daripada yang ada sama saja dengan menampilkan semuanya.
   * Dibulatkan ke dalam rentang alih-alih ditolak -- penyusun yang mengetik
   * 50 dari 30 soal jelas maksudnya "semuanya".
   */
  function simpanPenarikan() {
    const angka = Number(drawCount)
    if (!drawCount.trim() || !Number.isFinite(angka) || angka < 1) {
      setDrawCount("")
      save({ draw_count: null })
      return
    }
    const dipakai = Math.min(Math.floor(angka), total)
    if (dipakai >= total) {
      setDrawCount("")
      save({ draw_count: null })
      return
    }
    setDrawCount(String(dipakai))
    save({ draw_count: dipakai })
  }

  function save(patch: Partial<Omit<DraftQuiz, "id" | "questions">>) {
    dispatch({ type: "patchQuiz", lessonId, patch })
  }

  return (
    <div className="mb-3 flex flex-wrap items-end gap-4 rounded-lg border border-border bg-muted/30 p-3">
      <div className="w-32 space-y-1.5">
        <Label htmlFor={`pass-score-${quiz.id}`}>{t.editor.passScoreLabel}</Label>
        <Input
          id={`pass-score-${quiz.id}`}
          type="number"
          min={0}
          max={100}
          value={passScore}
          onChange={(e) => setPassScore(e.target.value)}
          onBlur={() => save({ pass_score: Number(passScore) || 0 })}
        />
      </div>
      <div className="w-32 space-y-1.5">
        <Label htmlFor={`max-attempts-${quiz.id}`}>{t.editor.maxAttemptsLabel}</Label>
        {quiz.is_assessment ? (
          <Input
            id={`max-attempts-${quiz.id}`}
            type="number"
            min={0}
            placeholder={t.editor.unlimitedPh}
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(e.target.value)}
            onBlur={() => save({ max_attempts: maxAttempts.trim() ? Number(maxAttempts) : null })}
          />
        ) : (
          <p className="flex h-9 items-center text-sm text-muted-foreground">
            {t.editor.unlimited}
          </p>
        )}
      </div>
      {!quiz.is_assessment && (
        <div className="w-44 space-y-1.5">
          <Label htmlFor={`draw-count-${quiz.id}`}>{t.editor.drawCountLabel}</Label>
          <Input
            id={`draw-count-${quiz.id}`}
            type="number"
            min={1}
            max={total}
            placeholder={t.editor.allN.replace("{n}", String(total))}
            value={drawCount}
            onChange={(e) => setDrawCount(e.target.value)}
            onBlur={simpanPenarikan}
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Switch
          id={`shuffle-${quiz.id}`}
          checked={quiz.shuffle}
          onCheckedChange={(checked) => save({ shuffle: checked })}
        />
        <Label htmlFor={`shuffle-${quiz.id}`}>{t.editor.shuffleLabel}</Label>
      </div>
      {quiz.draw_count !== null && quiz.draw_count < total && (
        <p className="w-full text-xs text-muted-foreground">
          {t.editor.drawNote
            .replace("{n}", String(quiz.draw_count))
            .replace("{total}", String(total))}
        </p>
      )}
      {!quiz.is_assessment && (
        <div className="w-44 space-y-1.5">
          <Label htmlFor={`measure-kind-${quiz.id}`}>{t.editor.measureKindLabel}</Label>
          <Select
            value={quiz.measure_kind ?? "normal"}
            onValueChange={(value) =>
              save({ measure_kind: value === "normal" ? null : (value as QuizMeasureKind) })
            }
          >
            <SelectTrigger id={`measure-kind-${quiz.id}`} className="w-full">
              {/*
                Labelnya ditulis di sini, bukan diserahkan ke <SelectValue/>
                kosong: Radix baru tahu teks sebuah pilihan setelah daftarnya
                pernah terbuka, jadi sebelum disentuh pemicunya menampilkan
                nilai mentah -- "normal", bukan "Kuis biasa".
              */}
              <SelectValue>
                {quiz.measure_kind === "pretest"
                  ? t.editor.measurePretest
                  : quiz.measure_kind === "posttest"
                    ? t.editor.measurePosttest
                    : t.editor.measureNormal}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">{t.editor.measureNormal}</SelectItem>
              <SelectItem value="pretest">{t.editor.measurePretest}</SelectItem>
              <SelectItem value="posttest">{t.editor.measurePosttest}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {quiz.measure_kind !== null && (
        <p className="w-full text-xs text-muted-foreground">{t.editor.measureNote}</p>
      )}
      <div className="flex w-full items-start gap-2 border-t border-border pt-3">
        <span
          className={cn(
            "mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            quiz.is_assessment
              ? "bg-secondary text-secondary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {quiz.is_assessment ? t.editor.studyCase : t.editor.normalQuiz}
        </span>
        <p className="text-xs text-muted-foreground">
          {quiz.is_assessment
            ? t.editor.assessmentNote.replace("{w}", String(ASSESSMENT_GRADE_WEIGHT))
            : t.editor.normalQuizNote}{" "}
          {t.editor.changeModeNote}
        </p>
      </div>
    </div>
  )
}

function QuestionCard({
  question,
  index,
  measureKind,
}: {
  question: DraftQuestion
  index: number
  /** Kuis induknya kuis ukur? Menentukan apakah pemilih modul dirender. */
  measureKind: QuizMeasureKind | null
}) {
  const { draft, dispatch } = useCourseDraft()
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const [prompt, setPrompt] = useState(question.prompt)
  const points = QUESTION_TYPE_POINTS[question.type]

  function save(patch: Partial<DraftQuestion>) {
    dispatch({ type: "patchQuestion", id: question.id, patch })
  }

  function handleDelete() {
    dispatch({ type: "deleteQuestion", id: question.id })
  }

  // file_upload has no QUESTION_TYPES entry any more -- it reads as "Essay".
  const typeLabel = isEssayQuestion(question.type)
    ? t.editor.qtEssay
    : (questionTypeLabels(t)[question.type] ?? question.type)

  const issue = useQuestionQuizIssue(question.id)
  // Render-time adjustment rather than an effect: a failed Save must open the
  // offending question immediately, without a second paint.
  const [seenIssue, setSeenIssue] = useState(issue)
  if (issue !== seenIssue) {
    setSeenIssue(issue)
    if (issue) setExpanded(true)
  }

  const indeksModul = draft.sections.findIndex((s) => s.id === question.measured_section_id)
  const labelModul =
    indeksModul >= 0
      ? `${indeksModul + 1}. ${draft.sections[indeksModul].title.trim() || t.editor.measuredSectionNone}`
      : null

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition: transition }}
      className={cn(
        "overflow-hidden rounded-lg border border-border",
        issue && "border-destructive",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2.5 bg-muted/30 px-3 py-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t.editor.moveQuestionAria.replace("{n}", String(index + 1))}
          className="-m-1 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded active:cursor-grabbing"
        >
          <GripVertical className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        </button>
        <span className="text-sm font-semibold whitespace-nowrap">{t.editor.questionN.replace("{n}", String(index + 1))}</span>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
          {typeLabel}
        </span>
        <span className="text-xs text-muted-foreground">
          {t.editor.nPoints.replace("{n}", String(points))}
        </span>
        <div className="flex-1" />
        <Button type="button" variant="ghost" size="icon-sm" onClick={handleDelete} aria-label={t.editor.deleteQuestionAria.replace("{n}", String(index + 1))}>
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setExpanded((v) => !v)} aria-label={t.editor.toggleQuestionAria.replace("{n}", String(index + 1))} aria-expanded={expanded}>
          <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
        </Button>
      </div>

      {expanded && (
        <div className="space-y-3.5 p-3.5">
          {issue && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {issue.message}
            </p>
          )}
          {measureKind !== null && (
            <div className="space-y-1.5">
              <Label htmlFor={`measured-section-${question.id}`}>{t.editor.measuredSectionLabel}</Label>
              <Select
                value={question.measured_section_id ?? ""}
                onValueChange={(value) => save({ measured_section_id: value || null })}
              >
                <SelectTrigger id={`measured-section-${question.id}`} className="w-full sm:w-80">
                  {/* Label ditulis sendiri; alasannya sama dengan pemilih
                      jenis kuis di atas -- <SelectValue/> kosong menampilkan
                      nilai mentah, di sini berarti satu UUID. */}
                  <SelectValue placeholder={t.editor.measuredSectionNone}>
                    {labelModul ?? t.editor.measuredSectionNone}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {draft.sections.map((section, i) => (
                    <SelectItem key={section.id} value={section.id}>
                      {`${i + 1}. ${section.title.trim() || t.editor.measuredSectionNone}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t.editor.measuredSectionHint}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{t.editor.promptLabel}</Label>
            <RichTextEditor
              ariaLabel={t.editor.promptAria.replace("{n}", String(index + 1))}
              value={prompt}
              onChange={(html) => {
                const next = html.replace(/<[^>]*>/g, "").trim() ? html : ""
                setPrompt(next)
                save({ prompt: next })
              }}
            />
          </div>
          {question.type === "multiple_choice" && (
            <>
              <div className="flex items-center gap-2">
                <Switch
                  id={`allow-multiple-${question.id}`}
                  checked={question.allow_multiple}
                  onCheckedChange={(checked) => save({ allow_multiple: checked })}
                />
                <Label htmlFor={`allow-multiple-${question.id}`}>{t.editor.allowMultiple}</Label>
              </div>
              <OptionsEditor
                questionId={question.id}
                options={question.options}
                variant={question.allow_multiple ? "multi" : "single"}
              />
            </>
          )}

          {question.type === "true_false" && <TrueFalseEditor questionId={question.id} options={question.options} />}

          {question.type === "short_answer" && (
            <>
              <div className="flex items-center gap-2">
                <Switch
                  id={`case-sensitive-${question.id}`}
                  checked={question.case_sensitive}
                  onCheckedChange={(checked) => save({ case_sensitive: checked })}
                />
                <Label htmlFor={`case-sensitive-${question.id}`}>{t.editor.caseSensitive}</Label>
              </div>
              <OptionsEditor questionId={question.id} options={question.options} variant="keyword" />
              {question.options.every((o) => !o.is_correct) && (
                <p className="text-xs text-destructive">
                  {t.editor.needAcceptedAnswer}
                </p>
              )}
            </>
          )}

          {!isEssayQuestion(question.type) && (
            <div className="space-y-1.5">
              <Label htmlFor={`explanation-${question.id}`}>{t.editor.explanationLabel}</Label>
              <p id={`explanation-help-${question.id}`} className="text-xs text-muted-foreground">
                {t.editor.explanationHelp}
              </p>
              <Textarea
                id={`explanation-${question.id}`}
                aria-describedby={`explanation-help-${question.id}`}
                value={question.explanation ?? ""}
                maxLength={5000}
                onChange={(e) => save({ explanation: e.target.value })}
                placeholder={t.editor.explanationPh}
                className="min-h-[72px]"
              />
            </div>
          )}

          {isEssayQuestion(question.type) && (
            <div className="space-y-2">
              <Label>{t.editor.answerFormat}</Label>
              <RadioGroup
                value={question.type}
                onValueChange={(value) => save({ type: value as AuthorableQuestionType })}
              >
                {answerFormats(t).map((f) => (
                  <label key={f.value} className="flex items-start gap-2.5 text-sm">
                    <RadioGroupItem value={f.value} className="mt-0.5" />
                    <span>
                      {f.label}
                      <span className="block text-xs text-muted-foreground">{f.hint}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">{t.editor.notAutoGraded}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TrueFalseEditor({ questionId, options }: { questionId: string; options: DraftOption[] }) {
  const { dispatch } = useCourseDraft()
  const { t } = useI18n()

  function handleSetCorrect(optionId: string) {
    dispatch({ type: "setCorrectOption", questionId, optionId })
  }

  return (
    <div className="space-y-2">
      <Label>{t.editor.correctAnswer}</Label>
      <div className="flex gap-2.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSetCorrect(option.id)}
            className={cn(
              "flex flex-1 items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-sm font-semibold transition-colors disabled:opacity-50",
              option.is_correct ? "border-primary bg-primary/10" : "border-border hover:border-ring"
            )}
          >
            <div
              className={cn(
                "size-4 shrink-0 rounded-full border-2",
                option.is_correct ? "border-primary bg-primary/20" : "border-border"
              )}
            />
            {option.text}
          </button>
        ))}
      </div>
    </div>
  )
}

function OptionsEditor({
  questionId,
  options,
  variant,
}: {
  questionId: string
  options: DraftOption[]
  variant: "single" | "multi" | "keyword"
}) {
  const { dispatch } = useCourseDraft()
  const { t } = useI18n()

  function handleAddOption() {
    dispatch({ type: "addOption", questionId, option: { is_correct: variant === "keyword" } })
  }

  function handleSetCorrect(optionId: string) {
    dispatch({ type: "setCorrectOption", questionId, optionId })
  }

  function handleToggleCorrect(optionId: string, isCorrect: boolean) {
    dispatch({ type: "patchOption", id: optionId, patch: { is_correct: isCorrect } })
  }

  function handleRemove(optionId: string) {
    dispatch({ type: "deleteOption", id: optionId })
  }

  return (
    <div className="space-y-2">
      <Label>{variant === "keyword" ? t.editor.acceptedAnswers : t.editor.choices}</Label>
      {options.map((option) => (
        <OptionRow
          key={option.id}
          option={option}
          variant={variant}
          onSetCorrect={() => handleSetCorrect(option.id)}
          onToggleCorrect={(checked) => handleToggleCorrect(option.id, checked)}
          onRemove={() => handleRemove(option.id)}
        />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
        <Plus className="size-3.5" />
        {variant === "keyword" ? t.editor.addAnswer : t.editor.addChoice}
      </Button>
    </div>
  )
}

function OptionRow({
  option,
  variant,
  onSetCorrect,
  onToggleCorrect,
  onRemove,
}: {
  option: DraftOption
  variant: "single" | "multi" | "keyword"
  onSetCorrect: () => void
  onToggleCorrect: (checked: boolean) => void
  onRemove: () => void
}) {
  const { dispatch } = useCourseDraft()
  const { t } = useI18n()
  const [text, setText] = useState(option.text)

  function save() {
    dispatch({ type: "patchOption", id: option.id, patch: { text } })
  }

  return (
    <div className="flex items-center gap-2.5">
      {variant === "single" && (
        <button
          type="button"
          title={t.editor.markCorrect}
          aria-label={t.editor.markCorrect}
          onClick={onSetCorrect}
          className={cn(
            "size-4 shrink-0 rounded-full border-2",
            option.is_correct ? "border-primary bg-primary/20" : "border-border"
          )}
        />
      )}
      {variant === "multi" && (
        <button
          type="button"
          title={t.editor.markCorrect}
          aria-label={t.editor.markCorrect}
          onClick={() => onToggleCorrect(!option.is_correct)}
          className={cn(
            "size-4 shrink-0 rounded-sm border-2",
            option.is_correct ? "border-primary bg-primary/20" : "border-border"
          )}
        />
      )}
      <Input value={text} onChange={(e) => setText(e.target.value)} onBlur={save} className="flex-1" aria-label={variant === "keyword" ? t.editor.acceptedAnswerAria : t.editor.choiceTextAria} />
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={t.editor.removeChoice}>
        <X className="size-3.5 text-destructive" />
      </Button>
    </div>
  )
}
