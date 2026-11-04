"use client"

import { useId, useState, useTransition } from "react"
import { Copy, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"

import { saveLandingBlocksAction } from "@/app/admin/landing/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/admin/courses/RichTextEditor"
import { LANDING_ICON_OPTIONS, type LandingIcon } from "@/lib/landing"
import { FeaturedCoursesPicker, type PickableCourse } from "./FeaturedCoursesPicker"
import { LivePreview, type PreviewData } from "./LivePreview"
import { dndAnnouncements } from "@/lib/dnd-announcements"
import { ImageDropzone } from "@/components/admin/courses/ImageDropzone"
import { uploadLessonImage } from "@/lib/storage"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LANDING_BLOCK_TYPES,
  SINGLETON_BLOCKS,
  createBlock,
  newBlockId,
  type LandingBlock,
  type LandingBlockType,
} from "@/lib/landing-blocks"
import { LOCALE_LABELS, type Locale } from "@/lib/i18n/config"
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
    stats: t.superadmin.blockStats,
    categories: t.superadmin.blockCategories,
    steps: t.superadmin.blockSteps,
    logos: t.superadmin.blockLogos,
    instructors: t.superadmin.blockInstructors,
    alumni: t.superadmin.blockAlumni,
    testimonials: t.superadmin.blockTestimonials,
    faq: t.superadmin.blockFaq,
    cta: t.superadmin.blockCta,
  }
}

/** Keterangan singkat tiap jenis bagian, dipakai palet "Tambah bagian". */
function blockHints(t: Dictionary): Record<LandingBlockType, string> {
  return {
    hero: t.superadmin.hintHero,
    stats: t.superadmin.hintStats,
    categories: t.superadmin.hintCategories,
    courses: t.superadmin.hintCourses,
    features: t.superadmin.hintFeatures,
    steps: t.superadmin.hintSteps,
    instructors: t.superadmin.hintInstructors,
    alumni: t.superadmin.hintAlumni,
    logos: t.superadmin.hintLogos,
    testimonials: t.superadmin.hintTestimonials,
    faq: t.superadmin.hintFaq,
    cta: t.superadmin.hintCta,
  }
}

export function BlockEditor({
  initialBlocks,
  initialBlocksEn,
  availableCourses,
  previewData,
}: {
  initialBlocks: LandingBlock[]
  /** null: versi Inggris belum pernah disimpan; pengunjung EN mendapat versi ID. */
  initialBlocksEn: LandingBlock[] | null
  availableCourses: PickableCourse[]
  previewData: PreviewData
}) {
  const { t } = useI18n()
  const LABELS = blockLabels(t)
  // Dua bahasa, dua susunan blok yang tersimpan terpisah. Tab bahasa memilih
  // susunan mana yang sedang disunting; Simpan hanya menulis kolom bahasa itu.
  const [lang, setLang] = useState<Locale>("id")
  const [blocksId, setBlocksId] = useState(initialBlocks)
  const [blocksEn, setBlocksEn] = useState<LandingBlock[] | null>(initialBlocksEn)
  const blocks = lang === "en" ? (blocksEn ?? []) : blocksId
  const setBlocks = (updater: (current: LandingBlock[]) => LandingBlock[]) => {
    if (lang === "en") setBlocksEn((current) => updater(current ?? []))
    else setBlocksId(updater)
  }
  const [pending, startTransition] = useTransition()
  // Bagian yang sedang disorot. Kanvas dan daftar di sebelahnya menunjuk
  // keadaan yang sama, jadi menekan "Sunting bagian ini" di kanvas membawa
  // penyusun ke ruasnya -- itu yang membuat menyunting terasa "di layoutnya".
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [paletOpen, setPaletOpen] = useState(false)

  // Spasi/Enter mengangkat blok, panah memindahkan, Spasi menjatuhkan --
  // alternatif non-tetikus yang diminta WCAG 2.5.7, sama seperti di daftar
  // pelajaran.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const usedTypes = new Set(blocks.map((b) => b.type))
  const addableTypes = LANDING_BLOCK_TYPES.filter(
    (type) => !(SINGLETON_BLOCKS.includes(type) && usedTypes.has(type))
  )

  function patch(id: string, changes: Partial<LandingBlock>) {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? ({ ...block, ...changes } as LandingBlock) : block))
    )
  }

  function pilih(id: string) {
    setSelectedId(id)
    // Menggulir ke ruasnya: menyorot sesuatu yang berada di luar layar sama
    // saja dengan tidak menyorot apa pun.
    document.getElementById(`sunting-${id}`)?.scrollIntoView({ block: "center", behavior: "smooth" })
  }

  function duplikat(block: LandingBlock) {
    setBlocks((current) => {
      const i = current.findIndex((b) => b.id === block.id)
      const salinan = { ...structuredClone(block), id: newBlockId() } as LandingBlock
      const next = [...current]
      next.splice(i + 1, 0, salinan)
      return next
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setBlocks((current) => {
      const dari = current.findIndex((b) => b.id === active.id)
      const ke = current.findIndex((b) => b.id === over.id)
      if (dari < 0 || ke < 0) return current
      return arrayMove(current, dari, ke)
    })
  }

  /** Salinan dalam versi ID sebagai titik awal terjemahan, dengan id baru
   *  supaya kedua versi benar-benar lepas satu sama lain. */
  function startEnglishFromCopy() {
    setBlocksEn(blocksId.map((b) => ({ ...structuredClone(b), id: newBlockId() })))
  }

  function save() {
    startTransition(async () => {
      const result = await saveLandingBlocksAction(blocks, lang)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(lang === "en" ? t.superadmin.landingSavedEn : t.superadmin.landingSaved)
    })
  }

  const belumAdaVersiEn = lang === "en" && blocksEn === null

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t.superadmin.landingTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.superadmin.landingSubtitle}</p>
        </div>
        {/*
          flex-wrap, bukan satu baris: di 320px -- lebar yang disyaratkan WCAG
          1.4.10 Reflow -- dua tab bahasa bersama "Tambah Bagian" dan "Simpan"
          melebar jauh melewati layar.
        */}
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label={t.superadmin.langTabsAria} className="flex gap-1">
            {(["id", "en"] as const).map((value) => (
              <button
                key={value}
                type="button"
                lang={value}
                aria-pressed={lang === value}
                disabled={pending}
                onClick={() => setLang(value)}
                className={
                  lang === value
                    ? "flex min-h-9 items-center rounded-lg border border-ring bg-secondary px-3 text-xs font-semibold text-primary"
                    : "flex min-h-9 items-center rounded-lg border border-input px-3 text-xs font-semibold text-muted-foreground hover:bg-muted"
                }
              >
                {LOCALE_LABELS[value]}
              </button>
            ))}
          </div>
          <Button variant="outline" disabled={pending || belumAdaVersiEn} onClick={() => setPaletOpen(true)}>
            <Plus className="size-4" aria-hidden />
            {t.superadmin.addSection}
          </Button>
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

      <p className="mb-4 text-xs text-muted-foreground">
        {lang === "en" ? t.superadmin.enFallbackNote : t.superadmin.idVersionNote}
      </p>

      {belumAdaVersiEn ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-semibold">{t.superadmin.enEmptyTitle}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{t.superadmin.enEmptyDesc}</p>
          <Button className="mt-4" variant="outline" onClick={startEnglishFromCopy}>
            {t.superadmin.copyFromId}
          </Button>
        </div>
      ) : (
        /*
          Kanvas di kiri, panel ruas di kanan -- susunan yang sama dengan
          pembangun halaman pada umumnya. Di bawah `xl` keduanya menumpuk,
          jadi di layar sempit kanvasnya tetap terbaca penuh.
        */
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="xl:sticky xl:top-20">
            <LivePreview
              blocks={blocks}
              data={previewData}
              locale={lang}
              selectedId={selectedId}
              onSelect={pilih}
            />
          </div>

          <DndContext
            sensors={sensors}
            accessibility={dndAnnouncements(t.superadmin.sectionNoun, t)}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <ol className="space-y-4">
                {blocks.map((block) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    label={LABELS[block.type]}
                    selected={selectedId === block.id}
                    disabled={pending}
                    availableCourses={availableCourses}
                    onSelect={() => setSelectedId(block.id)}
                    onPatch={(changes) => patch(block.id, changes)}
                    onDuplicate={() => duplikat(block)}
                    onDelete={() => setBlocks((current) => current.filter((b) => b.id !== block.id))}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {!belumAdaVersiEn && blocks.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t.superadmin.noBlocks}
        </p>
      )}

      {/*
        Palet bagian: kartu bernama dan berketerangan, bukan daftar nama saja.
        Nama seperti "Logo Mitra" atau "Angka Platform" tidak menjelaskan apa
        yang akan muncul di halaman, dan penyusun hanya tahu setelah
        menambahkannya lalu menghapusnya lagi.
      */}
      <Dialog open={paletOpen} onOpenChange={setPaletOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{t.superadmin.addSectionTitle}</DialogTitle>
            <DialogDescription>{t.superadmin.addSectionHint}</DialogDescription>
          </DialogHeader>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {addableTypes.map((type) => (
              <li key={type}>
                <button
                  type="button"
                  onClick={() => {
                    const blokBaru = createBlock(type)
                    setBlocks((current) => [...current, blokBaru])
                    setSelectedId(blokBaru.id)
                    setPaletOpen(false)
                  }}
                  className="flex h-full w-full flex-col rounded-xl border border-border bg-card p-4 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <span className="text-sm font-bold">{LABELS[type]}</span>
                  <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {blockHints(t)[type]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Satu blok di panel ruas: pegangan geser, kendali, lalu isiannya. */
function BlockCard({
  block,
  label,
  selected,
  disabled,
  availableCourses,
  onSelect,
  onPatch,
  onDuplicate,
  onDelete,
}: {
  block: LandingBlock
  label: string
  selected: boolean
  disabled: boolean
  availableCourses: PickableCourse[]
  onSelect: () => void
  onPatch: (changes: Partial<LandingBlock>) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const { t } = useI18n()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { title: label },
  })

  return (
    <li
      ref={setNodeRef}
      id={`sunting-${block.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onFocusCapture={onSelect}
      className={cn(
        "rounded-2xl border border-border bg-card p-5",
        /*
         * Garis putus-putus, bukan `opacity-*`. Meredupkan seluruh kartu ikut
         * meredupkan teks di dalamnya: lencana "Disembunyikan" lalu jatuh di
         * bawah 4,5:1 (axe: color-contrast, serius).
         */
        block.hidden && "border-dashed bg-muted/30",
        selected && "ring-2 ring-ring",
        isDragging && "opacity-50"
      )}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t.superadmin.dragHandleBlock.replace("{nama}", label)}
          className="-m-1 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded active:cursor-grabbing"
        >
          <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
        <span className="text-sm font-bold">{label}</span>
        {block.hidden && (
          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground">
            {t.superadmin.hiddenBadge}
          </span>
        )}
        <div className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          aria-label={t.superadmin.duplicateBlock.replace("{nama}", label)}
          disabled={disabled}
          onClick={onDuplicate}
        >
          <Copy className="size-4" aria-hidden />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label={(block.hidden ? t.superadmin.showBlock : t.superadmin.hideBlock).replace(
            "{nama}",
            label
          )}
          aria-pressed={!!block.hidden}
          disabled={disabled}
          onClick={() => onPatch({ hidden: !block.hidden } as Partial<LandingBlock>)}
        >
          {block.hidden ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label={t.editor.deleteNamed.replace("{nama}", label)}
          disabled={disabled}
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>

      <BlockFields block={block} onPatch={onPatch} disabled={disabled} availableCourses={availableCourses} />
    </li>
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
  availableCourses,
}: {
  block: LandingBlock
  onPatch: (changes: Partial<LandingBlock>) => void
  disabled: boolean
  availableCourses: PickableCourse[]
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

    case "categories":
    case "instructors":
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
          <p className="text-xs text-muted-foreground sm:col-span-2">
            {block.type === "categories" ? t.superadmin.categoriesNote : t.superadmin.instructorsNote}
          </p>
        </div>
      )

    case "steps":
      return (
        <div className="space-y-4">
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
          </div>
          {block.items.map((item, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {t.superadmin.stepN.replace("{n}", String(i + 1))}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={disabled || block.items.length <= 1}
                  aria-label={t.superadmin.deleteStepN.replace("{n}", String(i + 1))}
                  onClick={() =>
                    onPatch({ items: block.items.filter((_, j) => j !== i) } as Partial<LandingBlock>)
                  }
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              <Field
                label={t.superadmin.fieldHeading}
                value={item.title}
                disabled={disabled}
                onChange={(title) => {
                  const items = [...block.items]
                  items[i] = { ...items[i], title }
                  onPatch({ items } as Partial<LandingBlock>)
                }}
              />
              <Field
                label={t.superadmin.descriptionLabel}
                value={item.description}
                disabled={disabled}
                onChange={(description) => {
                  const items = [...block.items]
                  items[i] = { ...items[i], description }
                  onPatch({ items } as Partial<LandingBlock>)
                }}
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() =>
              onPatch({ items: [...block.items, { title: "", description: "" }] } as Partial<LandingBlock>)
            }
          >
            <Plus className="size-4" aria-hidden />
            {t.superadmin.addStep}
          </Button>
        </div>
      )

    case "alumni":
      return (
        <div className="space-y-4">
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
          </div>
          <p className="text-xs text-muted-foreground">{t.superadmin.alumniNote}</p>
          {block.items.map((item, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{i + 1}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  aria-label={t.superadmin.deleteAlumniN.replace("{n}", String(i + 1))}
                  onClick={() =>
                    onPatch({ items: block.items.filter((_, j) => j !== i) } as Partial<LandingBlock>)
                  }
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field
                  label={t.superadmin.alumniName}
                  value={item.name}
                  disabled={disabled}
                  onChange={(name) => {
                    const items = [...block.items]
                    items[i] = { ...items[i], name }
                    onPatch({ items } as Partial<LandingBlock>)
                  }}
                />
                <Field
                  label={t.superadmin.alumniRole}
                  value={item.role}
                  disabled={disabled}
                  onChange={(role) => {
                    const items = [...block.items]
                    items[i] = { ...items[i], role }
                    onPatch({ items } as Partial<LandingBlock>)
                  }}
                />
                <Field
                  label={t.superadmin.alumniCompany}
                  value={item.company}
                  disabled={disabled}
                  onChange={(company) => {
                    const items = [...block.items]
                    items[i] = { ...items[i], company }
                    onPatch({ items } as Partial<LandingBlock>)
                  }}
                />
              </div>
              <Field
                label={t.superadmin.alumniQuote}
                value={item.quote}
                disabled={disabled}
                onChange={(quote) => {
                  const items = [...block.items]
                  items[i] = { ...items[i], quote }
                  onPatch({ items } as Partial<LandingBlock>)
                }}
              />
              <ImageDropzone
                value={item.photoUrl || null}
                label={t.superadmin.alumniPhoto}
                hint={t.editor.hintThumb}
                uploadFn={uploadLessonImage}
                onChange={(photoUrl) => {
                  const items = [...block.items]
                  items[i] = { ...items[i], photoUrl }
                  onPatch({ items } as Partial<LandingBlock>)
                }}
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() =>
              onPatch({
                items: [...block.items, { name: "", role: "", company: "", quote: "", photoUrl: "" }],
              } as Partial<LandingBlock>)
            }
          >
            <Plus className="size-4" aria-hidden />
            {t.superadmin.addAlumni}
          </Button>
        </div>
      )

    case "logos":
      return (
        <div className="space-y-4">
          <Field
            label={t.superadmin.fieldHeading}
            value={block.heading}
            disabled={disabled}
            onChange={(heading) => onPatch({ heading } as Partial<LandingBlock>)}
          />
          <p className="text-xs text-muted-foreground">{t.superadmin.logoNameRequired}</p>
          {block.items.map((item, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{i + 1}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  aria-label={t.superadmin.deleteLogoN.replace("{n}", String(i + 1))}
                  onClick={() =>
                    onPatch({ items: block.items.filter((_, j) => j !== i) } as Partial<LandingBlock>)
                  }
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              <Field
                label={t.superadmin.logoName}
                value={item.name}
                disabled={disabled}
                onChange={(name) => {
                  const items = [...block.items]
                  items[i] = { ...items[i], name }
                  onPatch({ items } as Partial<LandingBlock>)
                }}
              />
              <ImageDropzone
                value={item.logoUrl || null}
                label={t.superadmin.logoImage}
                hint={t.editor.hintThumb}
                uploadFn={uploadLessonImage}
                onChange={(logoUrl) => {
                  const items = [...block.items]
                  items[i] = { ...items[i], logoUrl }
                  onPatch({ items } as Partial<LandingBlock>)
                }}
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() =>
              onPatch({ items: [...block.items, { name: "", logoUrl: "" }] } as Partial<LandingBlock>)
            }
          >
            <Plus className="size-4" aria-hidden />
            {t.superadmin.addLogo}
          </Button>
        </div>
      )

    case "stats":
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
          <p className="text-xs text-muted-foreground sm:col-span-2">
            {t.superadmin.statsHiddenNote}
          </p>
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
            <div className="sm:col-span-2">
              {/*
                Pemilih kursusnya ada DI SINI, bukan di formulir terpisah:
                yang dirender halaman depan adalah `block.courseIds`, dan
                sebelumnya satu-satunya pemilih kursus di layar ini menulis ke
                kolom lain yang tidak pernah dibaca -- kontrol yang terlihat
                bekerja tetapi tidak mengubah apa pun.
              */}
              <p className="mb-2 text-xs text-muted-foreground">{t.superadmin.coursesEmptyNote}</p>
              <FeaturedCoursesPicker
                value={block.courseIds}
                onChange={(courseIds) => onPatch({ courseIds } as Partial<LandingBlock>)}
                availableCourses={availableCourses}
              />
            </div>
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
          {/*
            Dulu hanya catatan "isinya disunting di bagian Keunggulan" -- yang
            menunjuk formulir lama yang menulis ke kolom berbeda dari yang
            dirender. Begitu halaman depan punya versi Inggris, keunggulan
            versi itu harus bisa disunting DI SINI, pada blok yang memang
            menjadi sumber tampilannya.
          */}
          {block.features.map((feature, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {t.superadmin.featureN.replace("{n}", String(i + 1))}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={disabled || block.features.length <= 1}
                  aria-label={t.superadmin.deleteFeatureN.replace("{n}", String(i + 1))}
                  onClick={() =>
                    onPatch({ features: block.features.filter((_, j) => j !== i) } as Partial<LandingBlock>)
                  }
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`feature-icon-${block.id}-${i}`}>{t.superadmin.iconLabel}</Label>
                <select
                  id={`feature-icon-${block.id}-${i}`}
                  value={feature.icon}
                  disabled={disabled}
                  onChange={(e) => {
                    const features = [...block.features]
                    features[i] = { ...features[i], icon: e.target.value as LandingIcon }
                    onPatch({ features } as Partial<LandingBlock>)
                  }}
                  className="flex h-8 w-fit items-center rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring"
                >
                  {LANDING_ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {{ "graduation-cap": t.superadmin.iconGradCap, layers: t.superadmin.iconLayers, award: t.superadmin.iconAward }[icon] ?? icon}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label={t.superadmin.fieldHeading}
                value={feature.title}
                disabled={disabled}
                onChange={(title) => {
                  const features = [...block.features]
                  features[i] = { ...features[i], title }
                  onPatch({ features } as Partial<LandingBlock>)
                }}
              />
              <div className="space-y-1.5">
                <Label>{t.superadmin.descriptionLabel}</Label>
                <RichTextEditor
                  ariaLabel={t.superadmin.featureDescAria.replace("{n}", String(i + 1))}
                  value={feature.description}
                  onChange={(description) => {
                    const features = [...block.features]
                    features[i] = { ...features[i], description }
                    onPatch({ features } as Partial<LandingBlock>)
                  }}
                />
              </div>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() =>
              onPatch({
                features: [...block.features, { icon: "graduation-cap", title: "", description: "" }],
              } as Partial<LandingBlock>)
            }
          >
            <Plus className="size-4" aria-hidden />
            {t.superadmin.addFeature}
          </Button>
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
