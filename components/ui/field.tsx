import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Satu ruas isian beserta namanya, keterangannya, dan pesan galatnya.
 *
 * Dibuat karena form di aplikasi ini memakai `placeholder` sebagai pengganti
 * label, dengan `aria-label` untuk pembaca layar. Pembaca layar aman --
 * **mata tidak**: begitu seseorang mengetik, nama ruasnya hilang dan ia tidak
 * bisa memeriksa ulang apa yang sedang diisi. Gerbang aksesibilitas otomatis
 * tidak menangkap ini karena ia memeriksa keberadaan nama yang terbaca mesin,
 * bukan apakah manusia masih bisa melihatnya.
 *
 * Komponen ini juga menyediakan tempat untuk **keterangan sebelum galat**.
 * Aturan seperti "minimal 8 karakter" yang hanya muncul setelah pengguna
 * gagal adalah aturan yang disembunyikan sampai terlambat.
 *
 * Penyambungan `id`, `aria-describedby`, dan `aria-invalid` dikerjakan di
 * sini, bukan diserahkan ke tiap pemanggil -- itulah bagian yang paling
 * sering terlupa ketika ditulis ulang di 14 tempat.
 */
export function Field({
  label,
  htmlFor,
  help,
  error,
  optional,
  className,
  children,
}: {
  label: React.ReactNode
  /** Id kontrol di dalamnya. Wajib: label tanpa tujuan bukan label. */
  htmlFor: string
  /** Keterangan yang tampil SEBELUM pengguna salah, bukan sesudah. */
  help?: React.ReactNode
  error?: React.ReactNode
  optional?: boolean
  className?: string
  children: React.ReactNode
}) {
  const helpId = help ? `${htmlFor}-help` : undefined
  const errorId = error ? `${htmlFor}-error` : undefined

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-medium">
        {label}
        {optional && <span className="font-normal text-muted-foreground">(opsional)</span>}
      </Label>

      {/* Kontrolnya dioper apa adanya supaya Field tidak perlu tahu apakah
          isinya Input, Textarea, Select, atau komponen lain. Yang disuntikkan
          hanya penyambung aksesibilitasnya. */}
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            id: htmlFor,
            "aria-describedby":
              [helpId, errorId].filter(Boolean).join(" ") || undefined,
            "aria-invalid": error ? true : undefined,
          })
        : children}

      {help && !error && (
        <p id={helpId} className="text-xs leading-relaxed text-muted-foreground">
          {help}
        </p>
      )}

      {/* Galat menggantikan keterangan, tidak menumpuknya: dua baris teks di
          bawah satu ruas membuat yang penting tenggelam. */}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-xs leading-relaxed font-medium text-destructive">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className="mt-0.5 shrink-0"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.8v3.6M8 11.1h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
