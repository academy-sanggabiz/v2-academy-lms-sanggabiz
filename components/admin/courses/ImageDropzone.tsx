"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/LocaleProvider";

export function ImageDropzone({
  value,
  onChange,
  uploadFn,
  label,
  hint,
}: {
  value: string | null;
  onChange: (url: string) => void;
  uploadFn: (file: File) => Promise<{ url: string } | { error: string }>;
  label: string;
  hint: string;
}) {
  const { t } = useI18n();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    const result = await uploadFn(file);
    setIsUploading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    onChange(result.url);
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {/*
        Tombol unggah dan tombol hapus BERSEBELAHAN, tidak bersarang.
        Sebelumnya tombol hapus berada di dalam sebuah `div role="button"`, dan
        kontrol di dalam kontrol membuat pembaca layar hanya mengumumkan yang
        luar -- tombol hapusnya tidak pernah terbacakan (axe:
        nested-interactive, 4 elemen di /admin/landing). Cacat ini hanya muncul
        ketika gambarnya sudah ada, jadi layar lain yang memakai komponen ini
        tidak pernah menampakkannya.

        `<button>` sungguhan, bukan `role="button"`: Enter DAN Spasi langsung
        bekerja tanpa onKeyDown buatan sendiri, dan keadaan nonaktif saat
        mengunggah dijaga `disabled`, bukan oleh pemeriksaan di tiap penangan.
      */}
      <div className="relative w-full max-w-xs">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          aria-busy={isUploading || undefined}
          className={cn(
            "flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 text-center",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
            !isUploading && "cursor-pointer hover:bg-muted/50",
          )}
        >
          {isUploading ? (
            <span
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-1.5 text-muted-foreground"
            >
              <Spinner className="size-5" />
              <span className="text-xs">{t.editor.uploading}</span>
            </span>
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="size-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <Upload className="size-4" />
              <span className="text-xs">{t.editor.clickToUpload}</span>
            </div>
          )}
        </button>

        {value && !isUploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
            aria-label={t.editor.removeImage.replace(
              "{label}",
              label.toLowerCase(),
            )}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
