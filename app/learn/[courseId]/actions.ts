"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { checkAndIssueCertificate } from "@/lib/certificates"
import { dbErrorMessage } from "@/lib/db-error-message"

export type ToggleLessonResult = { ok: true } | { ok: false; error: string }

/**
 * Mengembalikan hasil, bukan `void`: progres pelajaran menentukan kelayakan
 * sertifikat, jadi kegagalan yang diam-diam membuat peserta mengira sudah
 * selesai padahal belum (STANDAR-UMPAN-BALIK-UI.md R7).
 */
export async function toggleLessonComplete({
  courseId,
  lessonId,
  completed,
  // "Selesai & lanjut" mengirim pelajaran berikutnya supaya peserta pindah
  // dalam satu langkah (standar DL: satu aksi berikutnya yang jelas).
  continueTo,
}: {
  courseId: string
  lessonId: string
  completed: boolean
  continueTo?: string | null
}): Promise<ToggleLessonResult> {
  if (!courseId || !lessonId) {
    return { ok: false, error: "Pelajaran tidak dikenali. Muat ulang halaman, lalu coba lagi." }
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) {
    return { ok: false, error: "Sesi Anda sudah berakhir. Masuk kembali untuk menyimpan progres." }
  }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("learner_id", userId)
    .eq("course_id", courseId)
    .maybeSingle()

  if (enrollmentError || !enrollment) {
    return {
      ok: false,
      error: enrollmentError
        ? dbErrorMessage(enrollmentError.message, "Gagal menyimpan progres. Coba lagi.")
        : "Anda belum terdaftar di kursus ini.",
    }
  }

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      enrollment_id: enrollment.id,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "enrollment_id,lesson_id" }
  )

  if (error) {
    return { ok: false, error: dbErrorMessage(error.message, "Gagal menyimpan progres. Coba lagi.") }
  }

  if (completed) {
    await checkAndIssueCertificate(supabase, { enrollmentId: enrollment.id, courseId, learnerId: userId })
  }

  revalidatePath("/learn/[courseId]", "page")

  if (continueTo) {
    redirect(`/learn/${encodeURIComponent(courseId)}?lesson=${encodeURIComponent(continueTo)}`)
  }

  return { ok: true }
}
