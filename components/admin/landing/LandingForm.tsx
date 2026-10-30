"use client"

import { useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { BusyGuardProvider } from "@/components/ui/busy-guard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusMessage } from "@/components/ui/status-message"
import { useNavigationBlocker } from "@/components/admin/NavigationBlockerContext"
// Reused from the lesson-content editor -- generic Tiptap editor, no
// lesson-specific coupling other than its image button uploading into the
// `lesson-content` Storage bucket via uploadLessonImage (lib/storage.ts),
// which landing-page images share rather than needing their own bucket.
import { RichTextEditor } from "@/components/admin/courses/RichTextEditor"
import { LANDING_ICON_OPTIONS, type LandingContent } from "@/lib/landing"
import { saveLandingContentAction } from "@/app/admin/landing/actions"

import { FeaturedCoursesPicker, type PickableCourse } from "./FeaturedCoursesPicker"
import { landingFormSchema, type LandingFormValues } from "./schema"

/**
 * Apakah isi form masih sama dengan yang dikirim ke server? Dibandingkan
 * per kolom, bukan lewat JSON, karena `values` sudah melewati zod (string-nya
 * ter-`trim`) sementara `form.getValues()` masih mentah.
 */
function isSameValues(current: LandingFormValues, sent: LandingFormValues) {
  const sameText = (a: string, b: string) => a.trim() === b.trim()

  return (
    sameText(current.heading, sent.heading) &&
    sameText(current.highlightWord, sent.highlightWord) &&
    sameText(current.subheading, sent.subheading) &&
    sameText(current.primaryCtaText, sent.primaryCtaText) &&
    sameText(current.primaryCtaHref, sent.primaryCtaHref) &&
    current.featuredCourseIds.length === sent.featuredCourseIds.length &&
    current.featuredCourseIds.every((id, i) => id === sent.featuredCourseIds[i]) &&
    current.features.length === sent.features.length &&
    current.features.every((feature, i) => {
      const other = sent.features[i]
      return (
        feature.icon === other.icon &&
        sameText(feature.title, other.title) &&
        sameText(feature.description, other.description)
      )
    })
  )
}

export function LandingForm({
  content,
  availableCourses,
}: {
  content: LandingContent
  availableCourses: PickableCourse[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { setIsBlocked } = useNavigationBlocker()

  const form = useForm<LandingFormValues>({
    resolver: zodResolver(landingFormSchema),
    defaultValues: {
      heading: content.hero.heading,
      highlightWord: content.hero.highlightWord,
      subheading: content.hero.subheading,
      primaryCtaText: content.hero.primaryCtaText,
      primaryCtaHref: content.hero.primaryCtaHref,
      features: content.features,
      featuredCourseIds: content.featuredCourseIds,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features",
  })

  const errors = form.formState.errors
  const isDirty = form.formState.isDirty

  useEffect(() => {
    setIsBlocked(isDirty)
    return () => setIsBlocked(false)
  }, [isDirty, setIsBlocked])

  function onSubmit(values: LandingFormValues) {
    startTransition(async () => {
      const input: LandingContent = {
        hero: {
          heading: values.heading,
          highlightWord: values.highlightWord,
          subheading: values.subheading,
          primaryCtaText: values.primaryCtaText,
          primaryCtaHref: values.primaryCtaHref,
        },
        features: values.features,
        featuredCourseIds: values.featuredCourseIds,
      }

      const result = await saveLandingContentAction(input)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Halaman depan diperbarui")

      // `values` adalah potret saat tombol ditekan. Mengembalikan form ke
      // potret itu akan menghapus apa pun yang diketik selama penyimpanan
      // berjalan -- dan sekaligus mematikan penjaga navigasi, sehingga
      // pekerjaan yang hilang itu tidak lagi dilindungi. Jadi form hanya
      // ditandai bersih kalau isinya memang masih sama dengan yang terkirim;
      // kalau tidak, suntingan terbaru dibiarkan apa adanya dan form tetap
      // kotor supaya admin menyimpannya sekali lagi.
      if (isSameValues(form.getValues(), values)) form.reset(values)
      router.refresh()
    })
  }

  function onInvalid() {
    toast.error("Gagal menyimpan. Lengkapi isian yang ditandai, lalu coba lagi.")
  }

  return (
    /*
     * Isian tetap bisa diketik selama menyimpan (suntingannya tidak hilang --
     * lihat onSubmit), tetapi kontrol yang mengubah *susunan* data yang sedang
     * dikirim ikut terkunci: menambah atau menghapus Keunggulan di tengah
     * penyimpanan menggeser indeks baris yang saat itu sedang dalam perjalanan
     * ke server (STANDAR-UMPAN-BALIK-UI.md R14, R17).
     */
    <BusyGuardProvider busy={isPending} reason="Menyimpan…">
    <form
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      className="mx-auto max-w-[900px] space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Halaman Depan</h1>
        <Button
          type="submit"
          pending={isPending}
          pendingLabel="Menyimpan…"
          className="bg-brand-gradient text-white hover:brightness-105"
        >
          Simpan
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Bagian Utama</h2>

        <div className="space-y-1.5">
          <Label htmlFor="heading">Judul utama</Label>
          <Input
            id="heading"
            aria-invalid={!!errors.heading}
            aria-describedby="heading-error"
            {...form.register("heading")}
          />
          <StatusMessage id="heading-error" className="text-xs">
            {errors.heading?.message}
          </StatusMessage>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="highlightWord">Kata sorotan</Label>
          <Input
            id="highlightWord"
            aria-invalid={!!errors.highlightWord}
            aria-describedby="highlightWord-error"
            {...form.register("highlightWord")}
          />
          <StatusMessage id="highlightWord-error" className="text-xs">
            {errors.highlightWord?.message}
          </StatusMessage>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="subheading">Subjudul</Label>
          <Controller
            control={form.control}
            name="subheading"
            render={({ field }) => (
              <RichTextEditor ariaLabel="Subjudul" value={field.value} onChange={field.onChange} />
            )}
          />
          <StatusMessage className="text-xs">{errors.subheading?.message}</StatusMessage>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="primaryCtaText">Teks tombol ajakan</Label>
            <Input
              id="primaryCtaText"
              aria-invalid={!!errors.primaryCtaText}
              aria-describedby="primaryCtaText-error"
              {...form.register("primaryCtaText")}
            />
            <StatusMessage id="primaryCtaText-error" className="text-xs">
              {errors.primaryCtaText?.message}
            </StatusMessage>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="primaryCtaHref">Tautan tombol ajakan</Label>
            <Input
              id="primaryCtaHref"
              aria-invalid={!!errors.primaryCtaHref}
              aria-describedby="primaryCtaHref-error"
              {...form.register("primaryCtaHref")}
            />
            <StatusMessage id="primaryCtaHref-error" className="text-xs">
              {errors.primaryCtaHref?.message}
            </StatusMessage>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Keunggulan</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ icon: "graduation-cap", title: "", description: "" })}
          >
            <Plus className="size-4" />
            Tambah Keunggulan
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Keunggulan {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={fields.length <= 1}
                onClick={() => remove(index)}
                aria-label={`Hapus keunggulan ${index + 1}`}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`features.${index}.icon`}>Ikon</Label>
              <select
                id={`features.${index}.icon`}
                className="flex h-8 w-fit items-center rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring"
                {...form.register(`features.${index}.icon` as const)}
              >
                {LANDING_ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {{ "graduation-cap": "Topi wisuda", layers: "Lapisan", award: "Penghargaan" }[icon] ?? icon}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`features.${index}.title`}>Judul</Label>
              <Input
                id={`features.${index}.title`}
                aria-invalid={!!errors.features?.[index]?.title}
                aria-describedby={`features.${index}.title-error`}
                {...form.register(`features.${index}.title` as const)}
              />
              <StatusMessage id={`features.${index}.title-error`} className="text-xs">
                {errors.features?.[index]?.title?.message}
              </StatusMessage>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`features.${index}.description`}>Deskripsi</Label>
              <Controller
                control={form.control}
                name={`features.${index}.description` as const}
                render={({ field }) => (
                  <RichTextEditor
                    ariaLabel={`Deskripsi keunggulan ${index + 1}`}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <StatusMessage className="text-xs">
                {errors.features?.[index]?.description?.message}
              </StatusMessage>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Kursus Unggulan</h2>
        <p className="text-sm text-muted-foreground">
          Pilih kursus terbit yang tampil di carousel &quot;Kursus Unggulan&quot; pada halaman
          depan publik.
        </p>
        <Controller
          control={form.control}
          name="featuredCourseIds"
          render={({ field }) => (
            <FeaturedCoursesPicker
              value={field.value}
              onChange={field.onChange}
              availableCourses={availableCourses}
            />
          )}
        />
      </div>
    </form>
    </BusyGuardProvider>
  )
}
