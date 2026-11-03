"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uploadCourseThumbnail } from "@/lib/storage"
import { ImageDropzone } from "../ImageDropzone"
import { useCourseDraft } from "../CourseDraftContext"
import { useI18n } from "@/components/i18n/LocaleProvider"

type BasicField = "title" | "description" | "requirementsText" | "audienceText" | "thumbnail_url"

export function BasicInfoTab({ errors = {} }: { errors?: Partial<Record<BasicField, string>> }) {
  const { draft, dispatch } = useCourseDraft()
  const { t } = useI18n()

  function setField(key: BasicField, value: string) {
    dispatch({ type: "setField", patch: { [key]: value } })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">{t.editor.labelTitle}</Label>
        <Input
          id="title"
          value={draft.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder={t.editor.phTitle}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        {errors.title && (
          <p id="title-error" className="text-xs text-destructive">
            {errors.title}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t.editor.labelDescription}</Label>
        <Textarea
          id="description"
          value={draft.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder={t.editor.phDescription}
          rows={4}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="requirementsText">{t.editor.labelRequirements}</Label>
        <Textarea
          id="requirementsText"
          value={draft.requirementsText}
          onChange={(e) => setField("requirementsText", e.target.value)}
          placeholder={t.editor.phRequirements}
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="audienceText">{t.editor.labelAudience}</Label>
        <Textarea
          id="audienceText"
          value={draft.audienceText}
          onChange={(e) => setField("audienceText", e.target.value)}
          placeholder={t.editor.phAudience}
          rows={3}
        />
      </div>

      <ImageDropzone
        value={draft.thumbnail_url || null}
        onChange={(url) => setField("thumbnail_url", url)}
        uploadFn={uploadCourseThumbnail}
        label={t.editor.labelThumb}
        hint={t.editor.hintThumb}
      />
      {errors.thumbnail_url && <p className="text-xs text-destructive">{errors.thumbnail_url}</p>}
    </div>
  )
}
