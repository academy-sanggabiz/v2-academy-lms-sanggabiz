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
import type { CertificateDefaults } from "@/lib/certificate-settings"
import type { CertificateType } from "@/lib/courses-admin"
import { cn } from "@/lib/utils"

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
  const [value, setValue] = useState(initial)
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
      toast.success("Pengaturan sertifikat tersimpan")
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Sertifikat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dipakai setiap kursus yang tidak mengatur sertifikatnya sendiri. Kursus hasil kerja sama
          dengan perusahaan lain cukup mengisi ruas yang memang berbeda; sisanya tetap mengikuti
          pengaturan di halaman ini.
        </p>
      </div>

      {!ready && (
        <StatusMessage variant="error">
          Tabel <code>certificate_defaults</code> belum ada di basis data, jadi pengaturan di
          halaman ini belum bisa disimpan. Jalankan{" "}
          <code>supabase/migrations/20261101120000_certificate_defaults.sql</code> di SQL Editor
          Supabase lebih dulu. Sampai itu dijalankan, sertifikat tetap terbit memakai pengaturan
          masing-masing kursus seperti sebelumnya.
        </StatusMessage>
      )}

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="space-y-2.5">
          <div className="text-xs font-semibold">Jenis Sertifikat</div>
          {CERTIFICATE_TYPE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set("certificate_type", t.value as CertificateType)}
              className="flex w-full gap-2.5 text-left"
              aria-pressed={value.certificate_type === t.value}
            >
              <div
                className={cn(
                  "mt-0.5 size-4 shrink-0 rounded-full border-2",
                  value.certificate_type === t.value ? "border-primary bg-primary/20" : "border-border"
                )}
              />
              <div>
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.description}</div>
              </div>
            </button>
          ))}
        </div>

        {value.certificate_type === "custom" && (
          <div className="max-w-sm space-y-1.5">
            <Label htmlFor="def-custom-title">Judul Sertifikat Khusus</Label>
            <Input
              id="def-custom-title"
              placeholder="misal: Sertifikat Keahlian"
              value={value.custom_title ?? ""}
              onChange={(e) => set("custom_title", e.target.value || null)}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="def-description">Deskripsi Sertifikat</Label>
          <Textarea
            id="def-description"
            maxLength={150}
            rows={3}
            placeholder="misal: Dengan ini menyatakan bahwa [Nama Peserta] telah menyelesaikan [Nama Kursus]."
            value={value.description ?? ""}
            onChange={(e) => set("description", e.target.value || null)}
          />
          <p className="text-xs text-muted-foreground">
            Penanda yang didukung: [Nama Peserta], [Nama Kursus]
          </p>
        </div>

        <ImageDropzone
          value={value.signature_url}
          onChange={(url) => set("signature_url", url || null)}
          uploadFn={uploadSignatureImage}
          label="Gambar Tanda Tangan"
          hint="PNG atau JPEG, maks. 1MB"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="def-signer-name">Nama Penanda Tangan</Label>
            <Input
              id="def-signer-name"
              placeholder="misal: Budi Santoso"
              value={value.signer_name ?? ""}
              onChange={(e) => set("signer_name", e.target.value || null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="def-signer-title">Jabatan Penanda Tangan</Label>
            <Input
              id="def-signer-title"
              placeholder="misal: Direktur Pendidikan"
              value={value.signer_title ?? ""}
              onChange={(e) => set("signer_title", e.target.value || null)}
            />
          </div>
        </div>

        <ImageDropzone
          value={value.template_url}
          onChange={(url) => set("template_url", url || null)}
          uploadFn={uploadCertificateTemplate}
          label="Templat Sertifikat (Opsional)"
          hint="Orientasi lanskap, PNG/JPEG, maks. 5MB"
        />

        <div className="space-y-1.5">
          <Label htmlFor="def-additional">Teks Tambahan (Opsional)</Label>
          <Textarea
            id="def-additional"
            maxLength={150}
            rows={3}
            value={value.additional_text ?? ""}
            onChange={(e) => set("additional_text", e.target.value || null)}
          />
        </div>

        <Button type="button" onClick={save} disabled={pending || !ready}>
          {pending ? "Menyimpan…" : "Simpan Pengaturan"}
        </Button>
      </section>
    </div>
  )
}
