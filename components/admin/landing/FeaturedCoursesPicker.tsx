"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/components/i18n/LocaleProvider"

export type PickableCourse = { id: string; title: string }

export function FeaturedCoursesPicker({
  value,
  onChange,
  availableCourses,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  availableCourses: PickableCourse[]
}) {
  const { t } = useI18n()
  const [pickerValue, setPickerValue] = useState<string>("")

  const selected = value
    .map((id) => availableCourses.find((c) => c.id === id))
    .filter((c): c is PickableCourse => !!c)
  const pickableCourses = availableCourses.filter((c) => !value.includes(c.id))

  function handleAdd() {
    if (!pickerValue) return
    onChange([...value, pickerValue])
    setPickerValue("")
  }

  function handleRemove(id: string) {
    onChange(value.filter((v) => v !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2.5">
        <Select
          items={pickableCourses.map((c) => ({ value: c.id, label: c.title }))}
          value={pickerValue}
          onValueChange={(v) => v && setPickerValue(v)}
        >
          <SelectTrigger aria-label={t.superadmin.featuredCoursesAria} className="flex-1">
            <SelectValue placeholder={t.editor.pickCourse} />
          </SelectTrigger>
          <SelectContent>
            {pickableCourses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={handleAdd} disabled={!pickerValue}>
          {t.editor.add}
        </Button>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-col gap-2">
          {selected.map((course) => (
            <div
              key={course.id}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{course.title}</span>
              {/*
               * Memakai Button, bukan elemen button biasa: hanya Button yang membaca
               * BusyGuard, sehingga daftar ini ikut terkunci saat halaman depan
               * sedang disimpan -- menghapus entri di tengah penyimpanan
               * menggeser indeks array yang sedang dikirim (R14, R17).
               */}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemove(course.id)}
                className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label={t.editor.deleteNamed.replace("{nama}", course.title)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
