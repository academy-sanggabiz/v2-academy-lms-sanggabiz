"use client"

import { useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { CertificateType, CourseCertificateSettings } from "@/lib/courses-admin"
import { CERTIFICATE_TYPE_OPTIONS } from "@/lib/certificate-types"
import { CERTIFICATE_LAYOUT_OPTIONS } from "@/lib/certificate-layouts"
import { CertificatePreview } from "@/components/admin/certificates/CertificatePreview"
import type { CertificateLayout } from "@/components/certificates/CertificateDocument"
import { resolveCertificateSettings, type CertificateDefaults } from "@/lib/certificate-settings"
import { uploadCertificateTemplate, uploadSignatureImage } from "@/lib/storage"
import { ImageDropzone } from "../ImageDropzone"
import { useCourseDraft } from "../CourseDraftContext"
import { useI18n } from "@/components/i18n/LocaleProvider"

const DEFAULT_SETTINGS: CourseCertificateSettings = {
  enabled: false,
  template_url: null,
  // NULL, bukan "completion": kursus baru mewarisi pengaturan utama sampai
  // penyusunnya memang memilih sesuatu yang lain.
  certificate_type: null,
  custom_title: null,
  description: null,
  signature_url: null,
  signer_name: null,
  signer_title: null,
  additional_text: null,
  layout: null,
}

export function CertificateSettings({
  defaults,
  ready,
}: {
  defaults: CertificateDefaults
  /** False bila migrasi `certificate_defaults` belum dijalankan. Saat false,
   *  pilihan "Ikut Pengaturan Utama" tidak ditawarkan sama sekali: kolom
   *  `certificate_type` masih `not null`, jadi menyimpannya akan ditolak basis
   *  data dan penyusun hanya melihat pesan galat umum. Lebih baik pilihannya
   *  belum ada daripada ada tapi gagal. */
  ready: boolean
}) {
  const { draft, dispatch } = useCourseDraft()
  const { t } = useI18n()
  // Label jenis/tata letak mengikuti bahasa antarmuka; nilai tersimpannya tetap.
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
  // Kursus yang belum punya baris pengaturan. `certificate_type` hanya boleh
  // NULL kalau basis datanya memang sudah menerimanya; kalau belum, kursus
  // baru harus berangkat dari nilai eksplisit, bukan dari nilai yang pasti
  // ditolak saat disimpan.
  const settings =
    draft.certificate ?? { ...DEFAULT_SETTINGS, certificate_type: ready ? null : "completion" }
  // Dipakai untuk memberi tahu penyusun apa yang AKAN tampil pada ruas yang
  // dibiarkan kosong. Tanpa ini ruas kosong terbaca sebagai "sertifikatnya
  // memang akan kosong", padahal justru sebaliknya.
  const effective = resolveCertificateSettings(settings, defaults)

  // Daftar jenis sertifikat. Opsi warisan hanya muncul kalau basis datanya
  // memang sudah bisa menyimpannya.
  const jenisDiterjemahkan = CERTIFICATE_TYPE_OPTIONS.map((o) => ({
    ...o,
    ...labelJenis[o.value],
  }))
  const typeOptions: { value: CertificateType | null; label: string; description: string }[] = ready
    ? [
        {
          value: null,
          label: t.editor.inheritMain,
          description:
            labelJenis[defaults.certificate_type ?? "completion"]?.label ?? t.editor.certTypeCompletion,
        },
        ...jenisDiterjemahkan,
      ]
    : jenisDiterjemahkan

  /** Keterangan di bawah ruas yang sedang mewarisi. Tidak ditampilkan saat
   *  penyusun sudah mengisi sendiri, supaya tidak jadi bising. */
  function inheritedHint(field: Parameters<typeof isInherited>[0]) {
    if (!effective.inherited[field]) return null
    const value = effective[field]
    return (
      <p className="text-xs text-muted-foreground">
        {t.editor.inheritedHintPrefix}
        {value ? `: ${String(value)}` : ` ${t.editor.inheritedEmpty}`}
      </p>
    )
  }
  function isInherited(field: keyof typeof effective.inherited) {
    return effective.inherited[field]
  }

  const [customTitle, setCustomTitle] = useState(settings.custom_title ?? "")
  const [description, setDescription] = useState(settings.description ?? "")
  const [signerName, setSignerName] = useState(settings.signer_name ?? "")
  const [signerTitle, setSignerTitle] = useState(settings.signer_title ?? "")
  const [additionalText, setAdditionalText] = useState(settings.additional_text ?? "")
  const [passingGrade, setPassingGrade] = useState(String(draft.passingGrade))

  function save(patch: Partial<CourseCertificateSettings>) {
    dispatch({ type: "setField", patch: { certificate: { ...settings, ...patch } } })
  }

  return (
    <section className="space-y-3">
      <h3 className="text-xl font-bold">{t.editor.certTitle}</h3>
      <div className="flex items-start justify-between gap-5">
        <div>
          <div className="text-sm font-medium">{t.editor.enableCert}</div>
          <div className="text-xs text-muted-foreground">
            {t.editor.enableCertDesc}
          </div>
        </div>
        <Switch aria-label={t.editor.enableCert} checked={settings.enabled} onCheckedChange={(checked) => save({ enabled: checked })} />
      </div>

      <div className="max-w-sm space-y-1.5">
        <Label htmlFor="cert-passing-grade">{t.editor.passingGradeLabel}</Label>
        <Input
          id="cert-passing-grade"
          type="number"
          min={0}
          max={100}
          value={passingGrade}
          onChange={(e) => setPassingGrade(e.target.value)}
          onBlur={() =>
            dispatch({
              type: "setField",
              patch: { passingGrade: Math.min(100, Math.max(0, Number(passingGrade) || 0)) },
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          {t.editor.passingGradeDesc}
        </p>
      </div>

      {settings.enabled && (
        <div className="space-y-4 border-t border-border pt-4">
          <ImageDropzone
            value={settings.template_url}
            onChange={(url) => save({ template_url: url || null })}
            uploadFn={uploadCertificateTemplate}
            label={t.editor.certTemplate}
            hint={t.editor.certTemplateHint}
          />

          {ready && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold">{t.editor.layoutHead}</div>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    value: null,
                    label: t.editor.inheritMain,
                    description:
                      labelTataLetak[defaults.layout ?? "klasik"]?.label ?? t.editor.certLayoutKlasik,
                  },
                  ...CERTIFICATE_LAYOUT_OPTIONS.map((o) => ({ ...o, ...labelTataLetak[o.value] })),
                ].map((l) => (
                  <button
                    key={l.value ?? "warisan"}
                    type="button"
                    onClick={() => save({ layout: l.value as CertificateLayout | null })}
                    aria-pressed={settings.layout === l.value}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left",
                      settings.layout === l.value ? "border-primary bg-primary/10" : "border-border"
                    )}
                  >
                    <div className="text-sm font-medium">{l.label}</div>
                    <div className="text-xs text-muted-foreground">{l.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <div className="text-xs font-semibold">{t.editor.certTypeHead}</div>
            {typeOptions.map((opt) => (
              <div
                key={opt.value ?? "warisan"}
                className="flex cursor-pointer gap-2.5"
                onClick={() => save({ certificate_type: opt.value as CertificateType | null })}
              >
                <div
                  className={cn(
                    "mt-0.5 size-4 shrink-0 rounded-full border-2",
                    settings.certificate_type === opt.value ? "border-primary bg-primary/20" : "border-border"
                  )}
                />
                <div>
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.description}</div>
                </div>
              </div>
            ))}
          </div>

          {settings.certificate_type === "custom" && (
            <div className="max-w-sm space-y-1.5">
              <Label htmlFor="cert-custom-title">{t.editor.customTitleLabel}</Label>
              <Input
                id="cert-custom-title"
                placeholder={t.editor.customTitlePh}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                onBlur={() => save({ custom_title: customTitle.trim() || null })}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="cert-description">{t.editor.certDescLabel}</Label>
              <span className="text-xs text-muted-foreground">{t.editor.charCount.replace("{n}", String(description.length))}</span>
            </div>
            <Textarea
              id="cert-description"
              maxLength={150}
              placeholder={t.editor.certDescPh}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => save({ description: description.trim() || null })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {t.editor.tokensSupported}
            </p>
            {inheritedHint("description")}
          </div>

          <ImageDropzone
            value={settings.signature_url}
            onChange={(url) => save({ signature_url: url || null })}
            uploadFn={uploadSignatureImage}
            label={t.editor.signatureLabel}
            hint={t.editor.signatureHint}
          />
          {isInherited("signature_url") && (
            <p className="-mt-2 text-xs text-muted-foreground">
              {defaults.signature_url ? t.editor.signatureInheritHas : t.editor.signatureInheritNone}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="cert-signer-name">{t.editor.signerNameLabel}</Label>
            <Input
              id="cert-signer-name"
              placeholder={t.editor.signerNamePh}
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              onBlur={() => save({ signer_name: signerName.trim() || null })}
            />
            {inheritedHint("signer_name")}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cert-signer-title">{t.editor.signerTitleLabel}</Label>
            <Input
              id="cert-signer-title"
              placeholder={t.editor.signerTitlePh}
              value={signerTitle}
              onChange={(e) => setSignerTitle(e.target.value)}
              onBlur={() => save({ signer_title: signerTitle.trim() || null })}
            />
            {inheritedHint("signer_title")}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="cert-additional-text">{t.editor.additionalTextLabel}</Label>
              <span className="text-xs text-muted-foreground">{t.editor.charCount.replace("{n}", String(additionalText.length))}</span>
            </div>
            <Textarea
              id="cert-additional-text"
              maxLength={150}
              placeholder={t.editor.additionalTextPh}
              value={additionalText}
              onChange={(e) => setAdditionalText(e.target.value)}
              onBlur={() => save({ additional_text: additionalText.trim() || null })}
              rows={3}
            />
          </div>

          <CertificatePreview course={settings} defaults={defaults} />
        </div>
      )}
    </section>
  )
}
