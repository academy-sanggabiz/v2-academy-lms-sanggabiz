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
  BLOCK_LABELS,
  LANDING_BLOCK_TYPES,
  SINGLETON_BLOCKS,
  createBlock,
  type LandingBlock,
  type LandingBlockType,
} from "@/lib/landing-blocks"
import { cn } from "@/lib/utils"

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
export function BlockEditor({ initialBlocks }: { initialBlocks: LandingBlock[] }) {
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
      toast.success("Halaman depan tersimpan")
    })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Halaman Depan</h1>
          <p className="text-sm text-muted-foreground">
            Susun bagian halaman depan: tambah, sembunyikan, hapus, dan urutkan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" disabled={pending}>
                  <Plus className="size-4" aria-hidden />
                  Tambah Bagian
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {addableTypes.map((type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setBlocks((current) => [...current, createBlock(type)])}
                >
                  {BLOCK_LABELS[type]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={save}
            pending={pending}
            pendingLabel="Menyimpan…"
            className="bg-brand-gradient text-white hover:brightness-105"
          >
            Simpan
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
              <span className="text-sm font-bold">{BLOCK_LABELS[block.type]}</span>
              {block.hidden && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Disembunyikan
                </span>
              )}
              <div className="flex-1" />
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Pindahkan ${BLOCK_LABELS[block.type]} ke atas`}
                disabled={index === 0 || pending}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="size-4" aria-hidden />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Pindahkan ${BLOCK_LABELS[block.type]} ke bawah`}
                disabled={index === blocks.length - 1 || pending}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="size-4" aria-hidden />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={
                  block.hidden
                    ? `Tampilkan ${BLOCK_LABELS[block.type]}`
                    : `Sembunyikan ${BLOCK_LABELS[block.type]}`
                }
                aria-pressed={!!block.hidden}
                disabled={pending}
                onClick={() => patch(block.id, { hidden: !block.hidden } as Partial<LandingBlock>)}
              >
                {block.hidden ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Hapus ${BLOCK_LABELS[block.type]}`}
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
          Belum ada bagian. Tambahkan setidaknya satu sebelum menyimpan.
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
  switch (block.type) {
    case "hero":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Judul"
            value={block.hero.heading}
            disabled={disabled}
            onChange={(heading) => onPatch({ hero: { ...block.hero, heading } } as Partial<LandingBlock>)}
          />
          <Field
            label="Kata sorotan"
            value={block.hero.highlightWord}
            disabled={disabled}
            onChange={(highlightWord) =>
              onPatch({ hero: { ...block.hero, highlightWord } } as Partial<LandingBlock>)
            }
          />
          <Field
            label="Teks tombol"
            value={block.hero.primaryCtaText}
            disabled={disabled}
            onChange={(primaryCtaText) =>
              onPatch({ hero: { ...block.hero, primaryCtaText } } as Partial<LandingBlock>)
            }
          />
          <Field
            label="Tautan tombol"
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
            label="Judul"
            value={block.heading}
            disabled={disabled}
            onChange={(heading) => onPatch({ heading } as Partial<LandingBlock>)}
          />
          <Field
            label="Subjudul"
            value={block.subheading}
            disabled={disabled}
            onChange={(subheading) => onPatch({ subheading } as Partial<LandingBlock>)}
          />
          {block.type === "courses" ? (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Dikosongkan berarti menampilkan empat kursus terbit terbaru.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Menampilkan {block.limit} ulasan terbaru bernilai 4 ke atas. Hanya nama depan peserta
              yang ditampilkan.
            </p>
          )}
        </div>
      )

    case "features":
      return (
        <div className="space-y-4">
          <Field
            label="Judul"
            value={block.heading}
            disabled={disabled}
            onChange={(heading) => onPatch({ heading } as Partial<LandingBlock>)}
          />
          <p className="text-xs text-muted-foreground">
            {block.features.length} keunggulan. Isinya disunting di bagian Keunggulan pada halaman ini.
          </p>
        </div>
      )

    case "faq":
      return (
        <div className="space-y-4">
          <Field
            label="Judul"
            value={block.heading}
            disabled={disabled}
            onChange={(heading) => onPatch({ heading } as Partial<LandingBlock>)}
          />
          {block.items.map((item, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
              <Field
                label={`Pertanyaan ${i + 1}`}
                value={item.question}
                disabled={disabled}
                onChange={(question) => {
                  const items = [...block.items]
                  items[i] = { ...items[i], question }
                  onPatch({ items } as Partial<LandingBlock>)
                }}
              />
              <Field
                label={`Jawaban ${i + 1}`}
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
            Tambah pertanyaan
          </Button>
        </div>
      )

    case "cta":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Judul"
            value={block.heading}
            disabled={disabled}
            onChange={(heading) => onPatch({ heading } as Partial<LandingBlock>)}
          />
          <Field
            label="Subjudul"
            value={block.subheading}
            disabled={disabled}
            onChange={(subheading) => onPatch({ subheading } as Partial<LandingBlock>)}
          />
          <Field
            label="Tombol utama"
            value={block.primaryText}
            disabled={disabled}
            onChange={(primaryText) => onPatch({ primaryText } as Partial<LandingBlock>)}
          />
          <Field
            label="Tautan tombol utama"
            value={block.primaryHref}
            disabled={disabled}
            onChange={(primaryHref) => onPatch({ primaryHref } as Partial<LandingBlock>)}
          />
          <Field
            label="Tombol kedua"
            value={block.secondaryText}
            disabled={disabled}
            onChange={(secondaryText) => onPatch({ secondaryText } as Partial<LandingBlock>)}
          />
          <Field
            label="Tautan tombol kedua"
            value={block.secondaryHref}
            disabled={disabled}
            onChange={(secondaryHref) => onPatch({ secondaryHref } as Partial<LandingBlock>)}
          />
        </div>
      )
  }
}
