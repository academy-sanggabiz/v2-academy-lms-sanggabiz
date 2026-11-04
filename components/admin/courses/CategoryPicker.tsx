"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { createCategoryAction } from "@/app/admin/courses/actions"
import type { Category } from "@/lib/courses"

import { useCourseDraft } from "./CourseDraftContext"

/**
 * Pemilih kategori, dengan pembuatan kategori baru di tempat.
 *
 * Pola yang sama dengan `InstructorPicker`: kategorinya daftar bersama, jadi
 * pembuatannya menulis langsung ke server, sedangkan *pilihan* kursus ini
 * tetap bagian draf dan baru tersimpan saat penyusun menekan Simpan. Dua
 * hal yang berbeda umurnya memang pantas disimpan berbeda.
 *
 * Tanpa jalur "buat baru" di sini, kategori hanya bisa lahir lewat SQL --
 * dan saringan kategori di katalog publik akan selamanya kosong.
 */
export function CategoryPicker({ categories: initial }: { categories: Category[] }) {
  const { t } = useI18n()
  const { draft, dispatch } = useCourseDraft()
  const [categories, setCategories] = useState(initial)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [pending, startTransition] = useTransition()

  const items = [
    { value: "", label: t.editor.noCategory },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createCategoryAction(name)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      // Ditambahkan ke daftar lokal: aksinya tidak me-revalidate halaman
      // editor, jadi menunggu penyegaran server berarti kategori baru tidak
      // muncul sampai halamannya dimuat ulang.
      setCategories((prev) => [...prev, result.data])
      dispatch({ type: "setField", patch: { categoryId: result.data.id } })
      toast.success(t.editor.categoryCreated)
      setName("")
      setOpen(false)
    })
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="category">{t.editor.category}</Label>
      <div className="flex flex-wrap gap-2">
        <Select
          items={items}
          value={draft.categoryId || ""}
          onValueChange={(value) =>
            dispatch({ type: "setField", patch: { categoryId: value ?? "" } })
          }
        >
          <SelectTrigger id="category" className="min-w-[200px] flex-1">
            <SelectValue placeholder={t.editor.pickCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t.editor.noCategory}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button type="button" variant="outline" />}>
            <Plus className="size-3.5" aria-hidden />
            {t.editor.newCategory}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.editor.newCategory}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="new-category-name">{t.editor.newCategoryLabel}</Label>
              <Input
                id="new-category-name"
                value={name}
                maxLength={60}
                placeholder={t.editor.newCategoryPh}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!name.trim()}
                pending={pending}
                pendingLabel={t.editor.creating}
              >
                {t.editor.create}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
