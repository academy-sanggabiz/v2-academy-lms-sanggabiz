import type { CertificateLayout } from "@/components/certificates/CertificateDocument"

/** Satu daftar untuk layar pengaturan utama dan layar per kursus. */
export const CERTIFICATE_LAYOUT_OPTIONS: {
  value: CertificateLayout
  label: string
  description: string
}[] = [
  { value: "klasik", label: "Klasik", description: "Bingkai ganda, semua rata tengah" },
  { value: "modern", label: "Modern", description: "Pita warna di tepi kiri, teks rata kiri" },
  { value: "formal", label: "Formal", description: "Garis tipis, penanda tangan di tengah bawah" },
]
