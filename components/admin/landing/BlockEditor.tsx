"use client"

import { useId, useState, useTransition } from "react"
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { saveLandingBlocksAction } from "@/app/admin/landing/actions"
import { LandingPreview } from "@/components/admin/landing/LandingPreview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LANDING_BLOCK_TYPES,
  SINGLETON_BLOCKS,
  createBlock,
  type LandingBlock,
  type LandingBlockType,
} from "@/lib/landing-blocks"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n/LocaleProvider"
import type { Dictionary } from "@/lib/i18n/dictionaries"

/**
 * Penyusun halaman depan.
 *
 * Pengurutan memakai tombol naik-turun, bukan seret-lepas. Seret-lepas sudah
 * dipakai di editor pelajaran dan bisa dipakai di sini juga, tetapi untuk
 * daftar sependek ini tombol lebih baik: ia langsung bisa dipakai papan ketik
 * dan pembaca layar tanpa pengumuman tambahan, dan tidak ada yang perlu
 * dipelajari. Kalau nanti bloknya jadi belasan, seret-lepas dengan
 * pengumuman seperti di LessonsTab layak ditambahkan di sampingnya.
 *
 * Blok yang disembunyikan tetap tersimpan isinya -- menyembunyikan bukan
 * menghapus, dan itu dua maksud yang berbeda.
 */
function blockLabels(t: Dictionary): Record<LandingBlockType, string> {
  return {
    hero: t.superadmin.blockHero,
    courses: t.superadmin.blockCourses,
    features: t.superadmin.blockFeatures,
    testimonials: t.superadmin.blockTestimonials,
    faq: t.superadmin.blockFaq,
    cta: t.superadmin.blockCta,
  }
}

export function BlockEditor({ initialBlocks }: { initialBlocks: LandingBlock[] }) {
  const { t } = useI18n()
  const LABELS = blockLabels(t)
  const [blocks, setBlocks] = useState(initialBlocks)
  const [pending, startTransition] = useTransition()
  // Naik setiap kali penyimpanan berhasil; pratinjau memakainya sebagai aba-aba
  // memuat ulang, supaya ia tidak memuat ulang pada setiap ketikan.
  const [savedAt, setSavedAt] = useState(0)

  const usedTypes = new Set(blocks.map((b) => b.type))
  const addableTypes = LANDING_BLOCK_TYPES.filter(
    (type) => !(SINGLETON_BLOCKS.includes(type) && usedTypes.has(type))
  )

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    setBlocks(next)
  }

  function patch(id: string, changes: Partial<LandingBlock>) {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? ({ ...block, ...changes } as LandingBlock) : block))
    )
  }

  function save() {
    startTransition(async () => {
      const result = await saveLandingBlocksAction(blocks)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setSavedAt(Date.now())
      toast.success(t.superadmin.landingSaved)
    })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t.superadmin.landingTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {t.superadmin.landingSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" disabled={pending}>
                  <Plus className="size-4" aria-hidden />
                  {t.superadmin.addSection}
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {addableTypes.map((type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setBlocks((current) => [...current, createBlock(type)])}
                >
                  {LABELS[type]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={save}
            pending={pending}
            pendingLabel={t.common.saving}
            className="bg-brand-gradient text-white hover:brightness-105"
          >
            {t.common.save}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <LandingPreview reloadToken={savedAt} />
      </div>

      <ol className="space-y-4">
        {blocks.map((block, index) => (
          <li
            key={block.id}
            className={cn(
              "rounded-2xl border border-border bg-card p-5",
              block.hidden && "border-dashed opacity-70"
            )}
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold">{LABELS[block.type]}</span>
              {block.hidden && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {t.superadmin.hiddenBadge}
                </span>
              )}
              <div className="flex-1" />
              <Button
                size="sm"
                variant="ghost"
                aria-label={t.superadmin.moveUp.replace("{nama}", LABELS[block.type])}
                disabled={index === 0 || pending}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="size-4" aria-hidden />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t.superadmin.moveDown.replace("{nama}", LABELS[block.type])}
                disabled={index === blocks.length - 1 || pending}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="size-4" aria-hidden />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={(block.hidden ? t.superadmin.showBlock : t.superadmin.hideBlock).replace(
                  "{nama}",
                  LABELS[block.type]
                )}
                aria-pressed={!!block.hidden}
                disabled={pending}
                onClick={() => patch(block.id, { hidden: !block.hidden } as Partial<LandingBlock>)}
              >
                {block.hidden ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t.editor.deleteNamed.replace("{nama}", LABELS[block.type])}
                disabled={pending}
                onClick={() => setBlocks((current) => current.filter((b) => b.id !== block.id))}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>

            <BlockFields block={block} onPatch={(changes) => patch(block.id, changes)} disabled={pending} />
          </li>
        ))}
      </ol>

      {blocks.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t.superadmin.noBlocks}
        </p>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  // useId, bukan Math.random(): id yang berbeda antara render server dan
  // klien membuat hidrasi tidak cocok, dan label kehilangan kaitannya ke
  // isian -- pembaca layar lalu membacakan isian tanpa nama.
  const id = useId()
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function BlockFields({
  block,
  onPatch,
  disabled,
}: {
  block: LandingBlock
  onPatch: (changes: Partial<LandingBlock>) => void
  disabled: boolean
}) {
  const { t } = useI18n()
  switch (block.type) {
    case "hero":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t.superadmin.fieldHeading}
            value={block.hero.heading}
            disabled={disabled}
            onChange={(heading) => onPatch({ hero: { ...block.hero, heading } } as Partial<LandingBlock>)}
          />
          <Field
            label={t.superadmin.fieldHighlight}
            value={block.hero.highlightWord}
            disabled={disabled}
            onChange={(highlightWord) =>
              onPatch({ hero: { ...block.hero, highlightWord } } as Partial<LandingBlock>)
            }
          />
          <Field
            label={t.superadmin.fieldCtaText}
            value={block.hero.primaryCtaText}
            disabled={disabled}
            onChange={(primaryCtaText) =>
              onPatch({ hero: { ...block.hero, primaryCtaText } } as Partial<LandingBlock>)
            }
          />
          <Field
            label={t.superadmin.fieldCtaHref}
            value={block.hero.primaryCtaHref}
            disabled={disabled}
            onChange={(primaryCtaHref) =>
              onPatch({ hero: { ...block.hero, primaryCtaHref } } as Partial<LandingBlock>)
            }
          />
        </div>
      )

    case "courses":
    case "testimonials":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t.superadmin.fieldHeading}
            value={block.heading}
            disabled={disabled}
            onChange={(heading) => onPatch({ heading } as Partial<LandingBlock>)}
          />
          <Field
            label={t.superadmin.fieldSubheading}
            value={block.subheading}
            disabled={disabled}
            onChange={(subheading) => onPatch({ subheading } as Partial<LandingBlock>)}
          />
          {block.type === "courses" ? (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              {t.superadmin.coursesEmptyNote}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              {t.superadmin.testimonialsNote.replace("{n}", String(block.limit))}
            </p>
          )}
        </div>
      )

    case "features":
      return (
        <div className="space-y-4">
          <Field
            label={t.superadmin.fieldHeading}
            value={block.heading}
            disabled={disabled}
            onChange={(heading) => onPatch({ heading } as Partial<LandingBlock>)}
          />
          <p className="text-xs text-muted-foreground">
            {t.superadmin.featuresNote.replace("{n}", String(block.features.length))}
          </p>
        </div>
      )

    case "faq":
      return (
        <div className="space-y-4">
          <Field
            label={t.superadmin.fieldHeading}
            value={block.heading}
            disabled={disabled}
            onChange={(heading) => onPatch({ heading } as Partial<LandingBlock>)}
          />
          {block.items.map((item, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
              <Field
                label={t.superadmin.faqQuestionN.replace("{n}", String(i + 1))}
                value={item.question}
                disabled={disabled}
                onChange={(question) => {
                  const items = [...block.items]
                  items[i] = { ...items[i], question }
                  onPatch({ items } as Partial<LandingBlock>)
                }}
              />
              <Field
                label={t.superadmin.faqAnswerN.replace("{n}", String(i + 1))}
                value={item.answer}
                disabled={disabled}
                onChange={(answer) => {
                  const items = [...block.items]
                  items[i] = { ...items[i], answer }
                  onPatch({ items } as Partial<LandingBlock>)
                }}
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onPatch({ items: [...block.items, { question: "", answer: "" }] } as Partial<LandingBlock>)}
          >
            <Plus className="size-4" aria-hidden />
            {t.superadmin.addFaq}
          </Button>
        </div>
      )

    case "cta":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t.superadmin.fieldHeading}
            value={block.heading}
            disabled={disabled}
            onChange={(heading) => onPatch({ heading } as Partial<LandingBlock>)}
          />
          <Field
            label={t.superadmin.fieldSubheading}
            value={block.subheading}
            disabled={disabled}
            onChange={(subheading) => onPatch({ subheading } as Partial<LandingBlock>)}
          />
          <Field
            label={t.superadmin.fieldPrimaryBtn}
            value={block.primaryText}
            disabled={disabled}
            onChange={(primaryText) => onPatch({ primaryText } as Partial<LandingBlock>)}
          />
          <Field
            label={t.superadmin.fieldPrimaryHref}
            value={block.primaryHref}
            disabled={disabled}
            onChange={(primaryHref) => onPatch({ primaryHref } as Partial<LandingBlock>)}
          />
          <Field
            label={t.superadmin.fieldSecondaryBtn}
            value={block.secondaryText}
            disabled={disabled}
            onChange={(secondaryText) => onPatch({ secondaryText } as Partial<LandingBlock>)}
          />
          <Field
            label={t.superadmin.fieldSecondaryHref}
            value={block.secondaryHref}
            disabled={disabled}
            onChange={(secondaryHref) => onPatch({ secondaryHref } as Partial<LandingBlock>)}
          />
        </div>
      )
  }
}
