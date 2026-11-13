"use server"

import { createCategory } from "@/lib/categories-server"
import type { Category } from "@/lib/courses"
import { revalidatePath } from "next/cache"

import {
  createDraftCourse,
  createInstructor,
  deleteCourse,
  deleteInstructor,
  saveCourseDraft,
  setCourseStatus,
} from "@/lib/courses-admin"
import { requireAdmin } from "@/lib/auth/require-admin"
import { courseDraftSchema, type CourseDraft } from "@/lib/course-draft"
import { describeDraftIssue, describeDraftIssues } from "@/lib/course-draft-issues"
import { parseCourseMarkdown, type ParsedCourse } from "@/lib/course-markdown"
import { createClient } from "@/lib/supabase/server"
import { BATAS_BERKAS, type HasilBersih } from "@/lib/interactive-lesson"
import { bersihkanMateriInteraktif } from "@/lib/sanitize-interactive"

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string }

function revalidateCoursePaths() {
  revalidatePath("/admin/courses")
  revalidatePath("/admin/courses/[id]/edit", "page")
  revalidatePath("/learner/courses")
  revalidatePath("/learner/courses/[id]", "page")
  revalidatePath("/learner/dashboard")
}

/**
 * Mengembalikan id, bukan `redirect` dari server. Dengan redirect server,
 * berpindah halaman di tengah aksi membatalkan perpindahannya sementara baris
 * kursusnya sudah terlanjur dibuat -- admin mengira gagal lalu menekan lagi,
 * dan draf "Kursus tanpa judul" menumpuk. Sekarang klien yang menavigasi, di
 * dalam transition yang sama, sehingga layar tetap terkunci sampai halaman
 * tujuan benar-benar tampil (STANDAR-UMPAN-BALIK-UI.md R16, R21).
 */
export async function createDraftCourseAction(): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Anda tidak berwenang" }
  }

  const result = await createDraftCourse()
  if ("error" in result) return { ok: false, error: result.error }

  revalidatePath("/admin/courses")
  return { ok: true, data: { id: result.id } }
}

export async function saveCourseDraftAction(
  courseId: string,
  draft: CourseDraft,
  status: "draft" | "published"
): Promise<ActionResult<undefined>> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const parsed = courseDraftSchema.safeParse(draft)
  if (!parsed.success) {
    // Seharusnya tidak pernah tercapai: layar sudah memvalidasi dengan skema
    // yang sama. Kalau sampai tercapai, berarti keduanya tidak sepakat -- dan
    // pesan umum akan menyembunyikan persis informasi yang dibutuhkan untuk
    // menemukan ketidaksepakatan itu.
    const issues = describeDraftIssues(parsed.error)
    const first = issues[0]
    return {
      ok: false,
      error: first
        ? `Data kursus tidak valid pada ${describeDraftIssue(first)}`
        : "Data kursus tidak valid. Muat ulang halaman lalu coba lagi.",
    }
  }

  const result = await saveCourseDraft(courseId, parsed.data, status)
  if ("error" in result) return { ok: false, error: result.error }

  revalidateCoursePaths()
  return { ok: true, data: undefined }
}

export async function deleteCourseAction(id: string): Promise<ActionResult<undefined>> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await deleteCourse(id)
  if ("error" in result) return { ok: false, error: result.error }

  revalidateCoursePaths()
  return { ok: true, data: undefined }
}

export async function toggleCourseStatusAction(
  id: string,
  status: "draft" | "published"
): Promise<ActionResult<undefined>> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await setCourseStatus(id, status)
  if ("error" in result) return { ok: false, error: result.error }

  revalidateCoursePaths()
  return { ok: true, data: undefined }
}

export async function createInstructorAction(input: {
  name: string
  title: string | null
  bio: string | null
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await createInstructor(input)
  if ("error" in result) return { ok: false, error: result.error }

  return { ok: true, data: result }
}

/**
 * Membuat kategori baru dari dalam editor kursus.
 *
 * Dibuat di tempat, bukan lewat layar pengelolaan tersendiri -- pola yang
 * sama dengan instruktur. Menambah satu entri menu lagi untuk daftar
 * sependek ini akan memperburuk menu pengelola yang sudah 11 entri, dan
 * orang membutuhkan kategori justru saat sedang menyusun kursus.
 */
export async function createCategoryAction(name: string): Promise<ActionResult<Category>> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await createCategory(name)
  if ("error" in result) return { ok: false, error: result.error }

  revalidatePath("/kelas")
  return { ok: true, data: result.category }
}

export async function deleteInstructorAction(id: string): Promise<ActionResult<undefined>> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await deleteInstructor(id)
  if ("error" in result) return { ok: false, error: result.error }

  revalidatePath("/admin/courses/[id]/edit", "page")
  return { ok: true, data: undefined }
}

/**
 * Membaca berkas `.md` menjadi draf kursus, tanpa menyimpan apa pun.
 *
 * Hasilnya dikembalikan ke editor supaya penyusun kursus melihatnya lebih dulu
 * dan menekan Simpan sendiri. Menulis langsung ke basis data akan membuat satu
 * berkas yang meleset menghapus pekerjaan yang sudah ada tanpa jejak.
 *
 * Penjagaan "belum ada peserta" ada di sini, bukan hanya pada tombol yang
 * disembunyikan di layar: server action dapat dipanggil langsung lewat
 * jaringan. Sifat penjagaan ini keselamatan, bukan kewenangan -- seorang
 * pengelola memang sudah boleh mengubah isi kursusnya lewat editor. Yang
 * dicegah adalah mengganti seluruh isi kursus yang sedang diikuti orang,
 * sehingga kemajuan belajar mereka menunjuk pelajaran yang sudah tidak ada.
 */
export async function importCourseMarkdownAction(
  courseId: string,
  markdown: string
): Promise<ActionResult<ParsedCourse>> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  if (typeof markdown !== "string" || markdown.trim().length === 0) {
    return { ok: false, error: "Berkasnya kosong." }
  }
  // Batas ukuran supaya satu berkas raksasa tidak menghabiskan memori server.
  if (markdown.length > 500_000) {
    return { ok: false, error: "Berkas terlalu besar. Susun per modul dalam beberapa berkas." }
  }

  const supabase = await createClient()

  // RLS sudah membatasi baris yang terbaca ke kursus milik pemanggil, jadi
  // baris yang tidak ditemukan berarti bukan miliknya.
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .maybeSingle()

  if (courseError || !course) {
    return { ok: false, error: "Kursus tidak ditemukan atau bukan milik Anda." }
  }

  const { count, error: countError } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)

  if (countError) {
    console.error("importCourseMarkdownAction enrollment count failed:", countError.message)
    return { ok: false, error: "Gagal memeriksa peserta kursus. Coba lagi." }
  }

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `Kursus ini sudah punya ${count} pendaftaran, jadi isinya tidak bisa diganti lewat impor. Buat kursus baru, lalu impor ke sana.`,
    }
  }

  return { ok: true, data: parseCourseMarkdown(markdown) }
}

/**
 * Membersihkan satu berkas materi interaktif dan melaporkan apa yang hilang.
 *
 * Aksi server, bukan fungsi di peramban, karena `lib/sanitize-interactive.ts`
 * mengimpor postcss -- menariknya ke klien berarti menyeret pengurai CSS ke
 * dalam bundel setiap orang yang membuka penyunting.
 *
 * Ini BUKAN penjagaan keamanannya. Penjagaannya ada di `saveCourseDraft`,
 * yang membersihkan ulang apa pun yang dikirim peramban. Fungsi ini ada
 * supaya penyusun melihat hasilnya sebelum menyimpan, bukan sesudahnya.
 */
export async function bersihkanMateriAction(
  berkas: string
): Promise<ActionResult<HasilBersih>> {
  try {
    await requireAdmin()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Anda tidak berwenang" }
  }

  if (berkas.length > BATAS_BERKAS) {
    return {
      ok: false,
      error: "Berkasnya lebih besar dari 512 KB. Perkecil dulu sebelum diunggah.",
    }
  }

  return { ok: true, data: bersihkanMateriInteraktif(berkas) }
}
