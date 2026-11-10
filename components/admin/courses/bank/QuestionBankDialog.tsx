"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusMessage } from "@/components/ui/status-message"
import { listBankItemsAction } from "@/app/admin/courses/bank-actions"
import type { BankItem } from "@/lib/question-bank-server"
import type { DraftQuestion } from "@/lib/course-draft"
import { QUESTION_TYPES } from "@/lib/question-types"
import { useI18n } from "@/components/i18n/LocaleProvider"

/** Membuang tag HTML supaya teks soal aman ditampilkan sebagai teks biasa. */
function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

/** Satu butir bank menjadi satu soal draf. Id-nya dibuat ulang oleh reducer. */
function toDraftQuestion(item: BankItem): DraftQuestion {
  return {
    id: item.id,
    type: item.type,
    prompt: item.prompt,
    allow_multiple: item.allow_multiple,
    case_sensitive: item.case_sensitive,
    explanation: item.explanation,
    // Bank soal tidak menyimpan modul: soal yang sama dipakai lintas kursus,
    // dan "modul yang diukur" hanya punya arti di dalam satu kursus. Penyusun
    // memilihnya setelah soalnya disisipkan.
    measured_section_id: null,
    options: item.options.map((o) => ({ id: `${item.id}-${o.position}`, text: o.text, is_correct: o.is_correct })),
  }
}

/**
 * Memilih soal dari bank untuk disalin ke kuis ini.
 *
 * Yang disisipkan adalah **salinan**, bukan rujukan. Menyunting salinan di
 * kursus ini tidak mengubah soal di bank, dan sebaliknya -- itu yang menjaga
 * kuis yang sudah dikerjakan peserta tetap seperti saat dikerjakan.
 */
export function QuestionBankDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (questions: DraftQuestion[]) => void
}) {
  const { t } = useI18n()
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<BankItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [notReady, setNotReady] = useState(false)
  const [loading, startLoading] = useTransition()

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      startLoading(async () => {
        const result = await listBankItemsAction(search)
        if (!result.ok) {
          setError(result.error)
          return
        }
        setError(null)
        setNotReady(!result.data.ready)
        setItems(result.data.items)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [open, search])

  // Pilihan tidak dibawa antar pembukaan dialog: membawa pilihan lama membuat
  // penyusun menyisipkan soal yang tidak ia sadari masih tercentang.
  //
  // Penyesuaian saat render, bukan efek -- pola yang sama dipakai di
  // QuestionCard. Efek yang memanggil setState memicu render berantai, dan
  // di sini juga berarti satu frame dengan pilihan lama masih tercentang.
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) setSelected(new Set())
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function insert() {
    const picked = items.filter((i) => selected.has(i.id)).map(toDraftQuestion)
    if (picked.length === 0) {
      toast.error(t.editor.bankNonePicked)
      return
    }
    onPick(picked)
    onOpenChange(false)
    toast.success(t.editor.bankCopied.replace("{n}", String(picked.length)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{t.editor.bankTitle}</DialogTitle>
          <DialogDescription>
            {t.editor.bankCopyNote1} <strong>{t.editor.bankCopiedWord}</strong> {t.editor.bankCopyNote2}
          </DialogDescription>
        </DialogHeader>

        {notReady && (
          <StatusMessage variant="error">
            {t.editor.bankNotReadyPrefix} <code>question_bank_items</code>{" "}
            {t.insight.notReadyMiddle} <code>supabase/migrations/20261101140000_question_bank.sql</code>{" "}
            {t.insight.notReadyEnd}
          </StatusMessage>
        )}
        {error && <StatusMessage variant="error">{error}</StatusMessage>}

        <div className="space-y-2">
          <Input
          inputSize="sm"
            type="search"
            placeholder={t.editor.bankSearchPh}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t.editor.bankSearchAria}
          />
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {loading
              ? t.editor.loadingShort
              : items.length === 0
                ? notReady
                  ? ""
                  : t.editor.bankEmpty
                : t.editor.bankCount
                    .replace("{n}", String(items.length))
                    .replace("{dipilih}", String(selected.size))}
          </p>
        </div>

        <div className="max-h-[320px] space-y-1.5 overflow-y-auto">
          {items.map((item) => {
            const typeLabel =
              {
                multiple_choice: t.editor.qtMultipleChoice,
                true_false: t.editor.qtTrueFalse,
                short_answer: t.editor.qtShortAnswer,
              }[item.type as string] ??
              QUESTION_TYPES.find((j) => j.value === item.type)?.label ??
              item.type
            return (
              <label
                key={item.id}
                className="flex cursor-pointer gap-2.5 rounded-lg border border-border p-2.5"
              >
                <Checkbox
                  checked={selected.has(item.id)}
                  onCheckedChange={() => toggle(item.id)}
                  aria-label={t.editor.bankPickAria.replace("{soal}", plainText(item.prompt).slice(0, 80))}
                />
                <div className="min-w-0">
                  <div className="line-clamp-2 text-sm">{plainText(item.prompt)}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {typeLabel}
                    {item.tags.length > 0 && ` · ${item.tags.join(", ")}`}
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button type="button" variant="outline" onClick={insert} disabled={selected.size === 0}>
            {t.editor.bankCopyToQuiz}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
