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
      toast.error("Belum ada soal yang dipilih")
      return
    }
    onPick(picked)
    onOpenChange(false)
    toast.success(
      picked.length === 1 ? "1 soal disalin dari bank" : `${picked.length} soal disalin dari bank`
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Ambil dari Bank Soal</DialogTitle>
          <DialogDescription>
            Soal yang dipilih <strong>disalin</strong> ke kuis ini. Menyuntingnya di sini tidak
            mengubah soal di bank.
          </DialogDescription>
        </DialogHeader>

        {notReady && (
          <StatusMessage variant="error">
            Bank soal belum aktif: tabel <code>question_bank_items</code> belum ada di basis data.
            Jalankan <code>supabase/migrations/20261101140000_question_bank.sql</code> di SQL Editor
            Supabase.
          </StatusMessage>
        )}
        {error && <StatusMessage variant="error">{error}</StatusMessage>}

        <div className="space-y-2">
          <Input
            type="search"
            placeholder="Cari teks soal atau label…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari soal di bank"
          />
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {loading
              ? "Memuat…"
              : items.length === 0
                ? notReady
                  ? ""
                  : "Belum ada soal di bank. Simpan soal ke bank dari editor kuis lebih dulu."
                : `${items.length} soal, ${selected.size} dipilih`}
          </p>
        </div>

        <div className="max-h-[320px] space-y-1.5 overflow-y-auto">
          {items.map((item) => {
            const typeLabel =
              QUESTION_TYPES.find((t) => t.value === item.type)?.label ?? item.type
            return (
              <label
                key={item.id}
                className="flex cursor-pointer gap-2.5 rounded-lg border border-border p-2.5"
              >
                <Checkbox
                  checked={selected.has(item.id)}
                  onCheckedChange={() => toggle(item.id)}
                  aria-label={`Pilih soal: ${plainText(item.prompt).slice(0, 80)}`}
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
            Batal
          </Button>
          <Button type="button" variant="outline" onClick={insert} disabled={selected.size === 0}>
            Salin ke Kuis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
