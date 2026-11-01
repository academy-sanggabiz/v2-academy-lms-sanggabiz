import type { CertificateType } from "@/lib/courses-admin"

/**
 * Satu daftar jenis sertifikat untuk dua layar: pengaturan utama dan
 * pengaturan per kursus. Sempat disalin di dua tempat, dan salinan seperti
 * itu selalu berakhir berbeda setelah beberapa perubahan.
 */
export const CERTIFICATE_TYPE_OPTIONS: {
  value: CertificateType
  label: string
  description: string
}[] = [
  { value: "completion", label: "Kelulusan", description: '"Sertifikat Kelulusan" - "telah berhasil menyelesaikan"' },
  { value: "participation", label: "Partisipasi", description: '"Sertifikat Partisipasi" - "telah berpartisipasi dalam"' },
  { value: "achievement", label: "Prestasi", description: '"Sertifikat Prestasi" - "telah berhasil meraih"' },
  { value: "custom", label: "Judul Khusus (Opsional)", description: "Masukkan judul sertifikat sendiri" },
]
