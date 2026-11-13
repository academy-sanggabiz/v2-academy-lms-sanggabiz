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

  /*
   * Pelajarannya benar-benar milik kursus ini, dan bukan pelajaran kuis.
   *
   * Temuan C-13 di docs/SECURITY-REVIEW.md. Sebelumnya aksi ini hanya
   * memeriksa bahwa penekannya terdaftar di `courseId`, lalu menulis
   * `lesson_progress` untuk `lessonId` apa pun yang dikirim. Dua akibatnya:
   *
   * 1. Peserta yang terdaftar di dua kursus bisa mencatat kemajuan pelajaran
   *    kursus A pada pendaftaran kursus B. Barisnya tidak menerbitkan
   *    sertifikat palsu -- syaratnya dihitung ulang di server -- tetapi
   *    persentase kemajuan dan kartu "Lanjutkan belajar" membaca baris itu,
   *    jadi angkanya berbohong.
   * 2. Pelajaran kuis bisa dicentang selesai TANPA dikerjakan, apalagi lulus.
   *
   * Kuis biasa diselesaikan dengan LULUS, dan kuis ukur (pretest/posttest)
   * ditandai selesai oleh `submitQuiz` saat dikirim -- keduanya jalur lain,
   * bukan kotak centang ini. Karena itu di sini ditolak, dan `LearnSidebar`
   * tidak lagi menawarkan kotak centang pada pelajaran kuis.
   */
  const { data: pelajaran } = await supabase
    .from("lessons")
    .select("id, content_type, section:course_sections!inner(course_id)")
    .eq("id", lessonId)
    .maybeSingle<{
      id: string
      content_type: string
      section: { course_id: string } | { course_id: string }[]
    }>()

  const bagian = Array.isArray(pelajaran?.section) ? pelajaran?.section[0] : pelajaran?.section
  if (!pelajaran || bagian?.course_id !== courseId) {
    return { ok: false, error: "Pelajaran itu bukan bagian dari kursus ini." }
  }
  if (pelajaran.content_type === "quiz") {
    return {
      ok: false,
      error: "Pelajaran kuis ditandai selesai setelah Anda mengerjakannya, bukan dengan mencentang.",
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
