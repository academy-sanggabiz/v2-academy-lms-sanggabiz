import type { $ZodIssue } from "zod/v4/core"
import type { ZodError } from "zod"

/**
 * Menerjemahkan kegagalan validasi draf kursus menjadi sesuatu yang bisa
 * ditindaklanjuti: tab mana yang harus dibuka, ruas apa namanya dalam bahasa
 * manusia, dan apa yang salah.
 *
 * Dibuat karena bug nyata: setiap kegagalan validasi diperlakukan seolah-olah
 * berasal dari tab Info Dasar. Penyusun yang salah mengisi pengaturan
 * sertifikat dilempar ke tab Info Dasar, melihat pesan "Perbaiki isian yang
 * ditandai", dan tidak ada satu pun isian yang ditandai di sana. Pesan galat
 * yang tidak menunjuk tempatnya sama tidak bergunanya dengan tidak ada pesan.
 */

export type DraftIssueTab = "basic" | "lessons" | "settings"

export type DraftIssue = {
  tab: DraftIssueTab
  /** Kunci ruas di tab Info Dasar, untuk ditandai merah. Null untuk ruas di
   *  tab lain, yang tidak punya mekanisme penanda per ruas. */
  basicFieldKey: string | null
  label: string
  message: string
}

const TAB_OF: Record<string, DraftIssueTab> = {
  title: "basic",
  description: "basic",
  requirementsText: "basic",
  audienceText: "basic",
  thumbnail_url: "basic",
  level: "basic",
  enrollmentMode: "basic",
  price: "basic",
  isPrivate: "basic",
  passingGrade: "settings",
  requirePrerequisites: "settings",
  prerequisiteIds: "settings",
  sequential: "settings",
  certificate: "settings",
  instructorId: "settings",
  sections: "lessons",
}

const LABEL_OF: Record<string, string> = {
  title: "Judul kursus",
  description: "Deskripsi kursus",
  requirementsText: "Persyaratan",
  audienceText: "Untuk siapa kursus ini",
  thumbnail_url: "Gambar sampul",
  level: "Tingkat",
  enrollmentMode: "Jenis pendaftaran",
  price: "Harga",
  isPrivate: "Kursus privat",
  passingGrade: "Nilai kelulusan",
  requirePrerequisites: "Wajib memenuhi prasyarat",
  prerequisiteIds: "Prasyarat",
  sequential: "Urutan pelajaran",
  instructorId: "Instruktur",
  sections: "Pelajaran",
}

const CERTIFICATE_LABEL_OF: Record<string, string> = {
  enabled: "Aktifkan sertifikat",
  template_url: "Templat sertifikat",
  certificate_type: "Jenis sertifikat",
  custom_title: "Judul sertifikat khusus",
  description: "Deskripsi sertifikat",
  signature_url: "Gambar tanda tangan",
  signer_name: "Nama penanda tangan",
  signer_title: "Jabatan penanda tangan",
  additional_text: "Teks tambahan sertifikat",
}

/** Nama ruas untuk satu jalur zod, sedetail yang bisa didapat. */
function labelFor(path: PropertyKey[]): string {
  const root = String(path[0] ?? "")
  if (root === "certificate") {
    const field = String(path[1] ?? "")
    return CERTIFICATE_LABEL_OF[field] ?? "Pengaturan sertifikat"
  }
  if (root === "sections") {
    // Nomor modul/pelajaran jauh lebih berguna daripada "sections.2.lessons.0".
    const sectionNo = typeof path[1] === "number" ? path[1] + 1 : null
    const lessonNo = path[2] === "lessons" && typeof path[3] === "number" ? path[3] + 1 : null
    if (sectionNo && lessonNo) return `Modul ${sectionNo}, pelajaran ${lessonNo}`
    if (sectionNo) return `Modul ${sectionNo}`
    return "Pelajaran"
  }
  return LABEL_OF[root] ?? root
}

/**
 * Pesan bawaan zod berbahasa Inggris dan berbunyi teknis
 * ("Too big: expected string to have <=500 characters"). Antarmukanya bahasa
 * Indonesia, jadi pesan bawaan diterjemahkan -- sementara pesan khusus yang
 * ditulis sendiri di skema (misalnya "Judul wajib diisi") dibiarkan apa
 * adanya, karena pesan itu sudah ditulis untuk dibaca manusia.
 *
 * Pembedanya pola awalan pesan bawaan zod. Agak kasar, tetapi satu-satunya
 * penanda yang tersedia: zod tidak menyimpan apakah sebuah pesan ditimpa.
 */
const ZOD_DEFAULT_PREFIX =
  /^(Too big|Too small|Invalid\b|Unrecognized)/

function indonesianMessage(issue: $ZodIssue): string {
  if (!ZOD_DEFAULT_PREFIX.test(issue.message)) return issue.message

  const i = issue as $ZodIssue & { maximum?: number; minimum?: number; origin?: string }
  const satuan = i.origin === "string" ? "karakter" : i.origin === "array" ? "entri" : null

  switch (issue.code) {
    case "too_big":
      return satuan
        ? `Maksimal ${i.maximum} ${satuan}`
        : `Nilainya tidak boleh lebih dari ${i.maximum}`
    case "too_small":
      if (i.minimum === 1 && satuan === "karakter") return "Wajib diisi"
      return satuan
        ? `Minimal ${i.minimum} ${satuan}`
        : `Nilainya tidak boleh kurang dari ${i.minimum}`
    case "invalid_value":
      return "Pilihannya tidak dikenali"
    case "invalid_format":
      return "Formatnya tidak sesuai"
    case "invalid_type":
      return "Jenis datanya tidak sesuai"
    default:
      return "Isiannya tidak valid"
  }
}

export function describeDraftIssues(error: ZodError): DraftIssue[] {
  const seen = new Set<string>()
  const issues: DraftIssue[] = []

  for (const issue of error.issues) {
    const root = String(issue.path[0] ?? "")
    const key = issue.path.join(".")
    if (seen.has(key)) continue
    seen.add(key)

    issues.push({
      tab: TAB_OF[root] ?? "basic",
      basicFieldKey: TAB_OF[root] === "basic" ? root : null,
      label: labelFor(issue.path as PropertyKey[]),
      message: indonesianMessage(issue as $ZodIssue),
    })
  }

  return issues
}

/** Satu kalimat yang menyebut tempatnya, untuk toast. */
export function describeDraftIssue(issue: DraftIssue): string {
  return `${issue.label}: ${issue.message}`
}
