"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import type { EditorView } from "@tiptap/pm/view"
import { StarterKit } from "@tiptap/starter-kit"
import { TextAlign } from "@tiptap/extension-text-align"
import { TextStyle, Color, FontSize } from "@tiptap/extension-text-style"
import { Highlight } from "@tiptap/extension-highlight"
import { Image } from "@tiptap/extension-image"
import { TableKit } from "@tiptap/extension-table/kit"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Columns3,
  Highlighter,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Palette,
  Quote,
  Rows3,
  Strikethrough,
  TableIcon,
  Trash2,
  Underline,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { uploadLessonImage } from "@/lib/storage"
import { useI18n } from "@/components/i18n/LocaleProvider"
import type { Dictionary } from "@/lib/i18n/dictionaries"

const TEXT_COLORS = [
  "#14252a",
  "#1a7f91",
  "#2e7ca6",
  "#c24040",
  "#1f8a45",
  "#b45309",
  "#6d28d9",
]

const HIGHLIGHT_COLORS = ["#fef3c7", "#dcfce7", "#dbeafe", "#fce7f3", "#fee2e2"]

/**
 * Ukuran teks memakai satuan `em`, bukan piksel.
 *
 * `em` relatif terhadap ukuran dasar halaman, jadi teks yang penyusun kursus
 * besarkan tetap ikut membesar ketika peserta menaikkan ukuran teks lewat
 * panel Tampilan (lib/preferences/display.ts). Ukuran piksel akan mengunci
 * teks itu pada satu ukuran dan membatalkan pilihan peserta -- persis hal yang
 * kita hindari saat memutuskan tidak membuat widget aksesibilitas.
 *
 * Pilihannya sedikit dan sengaja: daftar ukuran yang panjang menghasilkan
 * halaman dengan delapan ukuran berbeda dan tidak ada yang lebih mudah dibaca.
 */
function sizeOptions(t: Dictionary) {
  return [
    { label: t.editor.rtSizeSmall, value: "0.875em" },
    { label: t.editor.rtSizeNormal, value: "" },
    { label: t.editor.rtSizeLarge, value: "1.25em" },
    { label: t.editor.rtSizeLarger, value: "1.5em" },
  ]
}

function headingOptions(t: Dictionary) {
  return [
    { label: t.editor.rtParagraph, level: 0 as const },
    { label: t.editor.rtHeadingN.replace("{n}", "1"), level: 1 as const },
    { label: t.editor.rtHeadingN.replace("{n}", "2"), level: 2 as const },
    { label: t.editor.rtHeadingN.replace("{n}", "3"), level: 3 as const },
  ]
}

// Google Docs pastes wrap most runs in `<span style="color:#000000">`, which our
// Color extension would otherwise apply literally, clashing with the editor's own
// muted text theme. Strip pasted color so only toolbar-applied color survives.
function stripPastedColor(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  doc.body.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    el.style.removeProperty("color")
    el.style.removeProperty("background-color")
    if (!el.getAttribute("style")) el.removeAttribute("style")
  })
  return doc.body.innerHTML
}

/**
 * Ask the author for an image's text alternative (WCAG 1.1.1). Empty means
 * decorative (alt=""), which screen readers skip; Cancel keeps `current`.
 */
function askAltText(promptText: string, current = ""): string | null {
  const answer = window.prompt(promptText, current)
  return answer === null ? null : answer.trim()
}

/**
 * Tempel dan seret-lepas memakai keadaan unggah yang sama dengan tombol gambar
 * di toolbar, bukan `toast.loading`: toast adalah penutup sebuah aksi, bukan
 * indikator proses (STANDAR-UMPAN-BALIK-UI.md §3).
 */
async function uploadAndInsert(
  view: EditorView,
  file: File,
  pos: number | undefined,
  setUploading: (uploading: boolean) => void,
  altPrompt: string
) {
  setUploading(true)
  try {
    await insertUploadedImage(view, file, pos, altPrompt)
  } finally {
    setUploading(false)
  }
}

async function insertUploadedImage(view: EditorView, file: File, pos: number | undefined, altPrompt: string) {
  const result = await uploadLessonImage(file)

  if ("error" in result) {
    toast.error(result.error)
    return
  }
  const alt = askAltText(altPrompt) ?? ""
  const node = view.state.schema.nodes.image.create({ src: result.url, alt })
  const tr = pos == null ? view.state.tr.replaceSelectionWith(node) : view.state.tr.insert(pos, node)
  view.dispatch(tr)
}

// Debounce window for onUpdate -- long enough that a fast typist doesn't
// spam dispatches, short enough that autosave/beforeunload always have a
// near-current draft. Blur (and unmount) flush immediately regardless.
const UPDATE_DEBOUNCE_MS = 400

export function RichTextEditor({
  value,
  onChange,
  ariaLabel,
}: {
  value: string
  onChange: (html: string) => void
  /** Accessible name of the editable area (WCAG 4.1.2). */
  ariaLabel?: string
}) {
  // Keadaan unggah hidup di sini, bukan di Toolbar: handler tempel dan
  // seret-lepas dipasang pada editor di komponen ini, dan keduanya harus
  // menyalakan penanda sibuk yang sama dengan tombol gambar di toolbar.
  const { t } = useI18n()
  const [isUploading, setIsUploading] = useState(false)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleUpdate(html: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      onChangeRef.current(html)
    }, UPDATE_DEBOUNCE_MS)
  }

  function flush(html: string) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    onChangeRef.current(html)
  }

  useEffect(() => {
    return () => {
      // Flush any pending debounced edit rather than dropping it on unmount
      // (e.g. collapsing the SubSection this editor lives in).
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      TableKit.configure({ table: { resizable: true } }),
    ],
    content: value,
    editorProps: {
      attributes: {
        "aria-label": ariaLabel ?? t.editor.rtEditorAria,
        "aria-multiline": "true",
        class: "lesson-prose min-h-[160px] rounded-b-lg border border-t-0 border-border bg-card px-3.5 py-3 focus:outline-none",
      },
      transformPastedHTML: stripPastedColor,
      handlePaste: (view, event) => {
        const image = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"))
        if (!image) return false
        event.preventDefault()
        void uploadAndInsert(view, image, undefined, setIsUploading, t.editor.rtAltPrompt)
        return true
      },
      handleDrop: (view, event) => {
        const image = Array.from(event.dataTransfer?.files ?? []).find((f) => f.type.startsWith("image/"))
        if (!image) return false
        event.preventDefault()
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
        void uploadAndInsert(view, image, coords?.pos, setIsUploading, t.editor.rtAltPrompt)
        return true
      },
    },
    onUpdate: ({ editor }) => scheduleUpdate(editor.getHTML()),
    onBlur: ({ editor }) => flush(editor.getHTML()),
  })

  // External value sync: needed for localStorage-restore and for the
  // post-save reseed (baseline := draft). Guarded so it never fights the
  // user's own typing/cursor position -- only fires when `value` changed
  // for a reason OTHER than this editor's own onUpdate.
  useEffect(() => {
    if (!editor) return
    if (value === editor.getHTML()) return
    editor.commands.setContent(value, { emitUpdate: false })
  }, [value, editor])

  if (!editor) return null

  return (
    <div>
      <Toolbar editor={editor} isUploading={isUploading} setIsUploading={setIsUploading} />
      <EditorContent editor={editor} />
    </div>
  )
}

function Toolbar({
  editor,
  isUploading,
  setIsUploading,
}: {
  editor: Editor
  isUploading: boolean
  setIsUploading: (uploading: boolean) => void
}) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setIsUploading(true)
    const result = await uploadLessonImage(file)
    setIsUploading(false)

    if ("error" in result) {
      toast.error(result.error)
      return
    }
    const alt = askAltText(t.editor.rtAltPrompt) ?? ""
    editor.chain().focus().setImage({ src: result.url, alt }).run()
  }

  function handleEditAlt() {
    const current = (editor.getAttributes("image").alt as string | undefined) ?? ""
    const next = askAltText(t.editor.rtAltPrompt, current)
    if (next !== null) editor.chain().focus().updateAttributes("image", { alt: next }).run()
  }

  const HEADING_OPTIONS = headingOptions(t)
  const SIZE_OPTIONS = sizeOptions(t)
  const activeHeading =
    HEADING_OPTIONS.find((h) => h.level > 0 && editor.isActive("heading", { level: h.level })) ??
    HEADING_OPTIONS[0]

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-border bg-muted/40 p-1.5">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button type="button" variant="ghost" size="sm" className="gap-1" />}
        >
          {activeHeading.label}
          <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {HEADING_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.label}
              onClick={() =>
                option.level === 0
                  ? editor.chain().focus().setParagraph().run()
                  : editor.chain().focus().toggleHeading({ level: option.level }).run()
              }
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button type="button" variant="ghost" size="sm" className="gap-1" title={t.editor.rtTextSize} aria-label={t.editor.rtTextSize} />}
        >
          {SIZE_OPTIONS.find((o) => o.value && editor.isActive("textStyle", { fontSize: o.value }))?.label ??
            t.editor.rtSizeNormal}
          <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {SIZE_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.label}
              onClick={() =>
                option.value
                  ? editor.chain().focus().setFontSize(option.value).run()
                  : editor.chain().focus().unsetFontSize().run()
              }
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarDivider />

      <Popover>
        <PopoverTrigger
          render={<Button type="button" variant="ghost" size="icon-sm" title={t.editor.rtTextColor} aria-label={t.editor.rtTextColor} />}
        >
          <Palette className="size-3.5" />
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <div className="flex gap-1.5">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => editor.chain().focus().setColor(color).run()}
                className="size-6 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger
          render={<Button type="button" variant="ghost" size="icon-sm" title={t.editor.rtHighlight} aria-label={t.editor.rtHighlight} />}
        >
          <Highlighter className="size-3.5" />
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <div className="flex gap-1.5">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                className="size-6 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <ToolbarDivider />

      <ToolbarToggle
        title={t.editor.rtBold}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" />
      </ToolbarToggle>
      <ToolbarToggle
        title={t.editor.rtItalic}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-3.5" />
      </ToolbarToggle>
      <ToolbarToggle
        title={t.editor.rtUnderline}
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="size-3.5" />
      </ToolbarToggle>
      <ToolbarToggle
        title={t.editor.rtStrike}
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-3.5" />
      </ToolbarToggle>

      <ToolbarDivider />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title={isUploading ? t.editor.rtUploadingImage : t.editor.rtInsertImage}
        aria-label={isUploading ? t.editor.rtUploadingImage : t.editor.rtInsertImage}
        aria-busy={isUploading || undefined}
        disabled={isUploading}
        focusableWhenDisabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? <Spinner className="size-3.5" /> : <ImageIcon className="size-3.5" />}
      </Button>

      {editor.isActive("image") && (
        <Button type="button" variant="ghost" size="sm" onClick={handleEditAlt} className="text-xs">
          Teks alternatif
        </Button>
      )}

      <ToolbarToggle
        title={t.editor.rtQuote}
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-3.5" />
      </ToolbarToggle>
      <ToolbarToggle
        title={t.editor.rtCodeBlock}
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code className="size-3.5" />
      </ToolbarToggle>

      <ToolbarDivider />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title={t.editor.rtInsertTable} aria-label={t.editor.rtInsertTable}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <TableIcon className="size-3.5" />
      </Button>

      {editor.isActive("table") && (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="sm" className="gap-1" />}>
            {t.editor.rtTable}
            <ChevronDown className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
              <Rows3 className="size-3.5" />
              {t.editor.rtAddRowBelow}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <Columns3 className="size-3.5" />
              {t.editor.rtAddColRight}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
              <Rows3 className="size-3.5" />
              {t.editor.rtDeleteRow}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
              <Columns3 className="size-3.5" />
              {t.editor.rtDeleteCol}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              <Trash2 className="size-3.5" />
              {t.editor.rtDeleteTable}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ToolbarDivider />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button type="button" variant="ghost" size="icon-sm" title={t.editor.rtAlign} aria-label={t.editor.rtAlign} />}
        >
          <AlignLeft className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignLeft className="size-3.5" />
            {t.editor.rtAlignLeft}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignCenter className="size-3.5" />
            {t.editor.rtAlignCenter}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignRight className="size-3.5" />
            {t.editor.rtAlignRight}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarToggle
        title={t.editor.rtBulletList}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-3.5" />
      </ToolbarToggle>
      <ToolbarToggle
        title={t.editor.rtOrderedList}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-3.5" />
      </ToolbarToggle>
    </div>
  )
}

function ToolbarDivider() {
  return <div className="mx-0.5 h-5 w-px bg-border" />
}

function ToolbarToggle({
  title,
  active,
  onClick,
  children,
}: {
  title: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={cn(active && "bg-muted text-foreground")}
    >
      {children}
    </Button>
  )
}
