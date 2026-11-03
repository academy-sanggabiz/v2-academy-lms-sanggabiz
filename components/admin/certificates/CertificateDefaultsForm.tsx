"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { saveCertificateDefaultsAction } from "@/app/admin/certificates/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusMessage } from "@/components/ui/status-message"
import { ImageDropzone } from "@/components/admin/courses/ImageDropzone"
import { uploadCertificateTemplate, uploadSignatureImage } from "@/lib/storage"
import { CERTIFICATE_TYPE_OPTIONS } from "@/lib/certificate-types"
import { CERTIFICATE_LAYOUT_OPTIONS } from "@/lib/certificate-layouts"
import { CertificatePreview } from "@/components/admin/certificates/CertificatePreview"
import type { CertificateLayout } from "@/components/certificates/CertificateDocument"
import type { CertificateDefaults } from "@/lib/certificate-settings"
import type { CertificateType } from "@/lib/courses-admin"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n/LocaleProvider"

/**
 * Pengaturan sertifikat untuk seluruh perusahaan.
 *
 * Tempatnya terpisah dari `/admin/settings` karena layar itu berisi
 * pengaturan pribadi akun -- notifikasi, kata sandi. Yang di sini adalah
 * wajah perusahaan pada dokumen resmi, dan hanya superadmin yang boleh
 * mengubahnya (docs/STANDAR-PERAN.md §2).
 */
export function CertificateDefaultsForm({
  initial,
  ready,
}: {
  initial: CertificateDefaults
  ready: boolean
}) {
  const { t } = useI18n()
  const [value, setValue] = useState(initial)
  const labelJenis: Record<string, { label: string; description: string }> = {
    completion: { label: t.editor.certTypeCompletion, description: t.editor.certTypeCompletionDesc },
    participation: { label: t.editor.certTypeParticipation, description: t.editor.certTypeParticipationDesc },
    achievement: { label: t.editor.certTypeAchievement, description: t.editor.certTypeAchievementDesc },
    custom: { label: t.editor.certTypeCustom, description: t.editor.certTypeCustomDesc },
  }
  const labelTataLetak: Record<string, { label: string; description: string }> = {
    klasik: { label: t.editor.certLayoutKlasik, description: t.editor.certLayoutKlasikDesc },
    modern: { label: t.editor.certLayoutModern, description: t.editor.certLayoutModernDesc },
    formal: { label: t.editor.certLayoutFormal, description: t.editor.certLayoutFormalDesc },
  }
  const [pending, startTransition] = useTransition()

  function set<K extends keyof CertificateDefaults>(key: K, next: CertificateDefaults[K]) {
    setValue((prev) => ({ ...prev, [key]: next }))
  }

  function save() {
    startTransition(async () => {
      const result = await saveCertificateDefaultsAction(value)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t.superadmin.certDefaultsSaved)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t.superadmin.certDefaultsTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.superadmin.certDefaultsSubtitle}
        </p>
      </div>

      {!ready && (
        <StatusMessage variant="error">
          {t.superadmin.certDefaultsNotReady1} <code>certificate_defaults</code>{" "}
          {t.superadmin.certDefaultsNotReady2}{" "}
          <code>supabase/migrations/20261101120000_certificate_defaults.sql</code>{" "}
          {t.superadmin.certDefaultsNotReady3}
        </StatusMessage>
      )}

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="space-y-2.5">
          <div className="text-xs font-semibold">{t.editor.layoutHead}</div>
          <div className="flex flex-wrap gap-2">
            {CERTIFICATE_LAYOUT_OPTIONS.map((o) => ({ ...o, ...labelTataLetak[o.value] })).map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => set("layout", l.value as CertificateLayout)}
                aria-pressed={value.layout === l.value}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left",
                  value.layout === l.value ? "border-primary bg-primary/10" : "border-border"
                )}
              >
                <div className="text-sm font-medium">{l.label}</div>
                <div className="text-xs text-muted-foreground">{l.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="text-xs font-semibold">{t.editor.certTypeHead}</div>
          {CERTIFICATE_TYPE_OPTIONS.map((o) => ({ ...o, ...labelJenis[o.value] })).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("certificate_type", opt.value as CertificateType)}
              className="flex w-full gap-2.5 text-left"
              aria-pressed={value.certificate_type === opt.value}
            >
              <div
                className={cn(
                  "mt-0.5 size-4 shrink-0 rounded-full border-2",
                  value.certificate_type === opt.value ? "border-primary bg-primary/20" : "border-border"
                )}
              />
              <div>
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.description}</div>
              </div>
            </button>
          ))}
        </div>

        {value.certificate_type === "custom" && (
          <div className="max-w-sm space-y-1.5">
            <Label htmlFor="def-custom-title">{t.editor.customTitleLabel}</Label>
            <Input
              id="def-custom-title"
              placeholder={t.editor.customTitlePh}
              value={value.custom_title ?? ""}
              onChange={(e) => set("custom_title", e.target.value || null)}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="def-description">{t.editor.certDescLabel}</Label>
          <Textarea
            id="def-description"
            maxLength={150}
            rows={3}
            placeholder={t.editor.certDescPh}
            value={value.description ?? ""}
            onChange={(e) => set("description", e.target.value || null)}
          />
          <p className="text-xs text-muted-foreground">
            {t.editor.tokensSupported}
          </p>
        </div>

        <ImageDropzone
          value={value.signature_url}
          onChange={(url) => set("signature_url", url || null)}
          uploadFn={uploadSignatureImage}
          label={t.superadmin.signatureImage}
          hint={t.editor.signatureHint}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="def-signer-name">{t.editor.signerNameLabel}</Label>
            <Input
              id="def-signer-name"
              placeholder={t.editor.signerNamePh}
              value={value.signer_name ?? ""}
              onChange={(e) => set("signer_name", e.target.value || null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="def-signer-title">{t.editor.signerTitleLabel}</Label>
            <Input
              id="def-signer-title"
              placeholder={t.editor.signerTitlePh}
              value={value.signer_title ?? ""}
              onChange={(e) => set("signer_title", e.target.value || null)}
            />
          </div>
        </div>

        <ImageDropzone
          value={value.template_url}
          onChange={(url) => set("template_url", url || null)}
          uploadFn={uploadCertificateTemplate}
          label={t.editor.certTemplate}
          hint={t.editor.certTemplateHint}
        />

        <div className="space-y-1.5">
          <Label htmlFor="def-additional">{t.editor.additionalTextLabel}</Label>
          <Textarea
            id="def-additional"
            maxLength={150}
            rows={3}
            value={value.additional_text ?? ""}
            onChange={(e) => set("additional_text", e.target.value || null)}
          />
        </div>

        <CertificatePreview defaults={value} />

        <Button type="button" onClick={save} disabled={pending || !ready}>
          {pending ? t.common.saving : t.superadmin.savePrefs}
        </Button>
      </section>
    </div>
  )
}
