"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { recordEnrollmentTransaction } from "@/lib/transactions-server"

export type EnrollResult = { ok: true } | { ok: false; error: string }

export async function enroll(courseId: string): Promise<EnrollResult> {
  if (!courseId) return { ok: false, error: "Kursus tidak ditemukan." }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return { ok: false, error: "Anda perlu masuk untuk mengikuti kursus." }

  /*
   * Kursus berbayar tidak boleh didaftar sendiri. Belum ada gerbang pembayaran
   * di aplikasi ini: tanpa pemeriksaan ini, menekan "Ikuti kursus" memberi
   * akses penuh ke kursus berharga Rp berapa pun, lalu
   * recordEnrollmentTransaction() mencatatnya sebagai transaksi `completed`
   * sebesar harga penuh -- jadi pembukuannya ikut menyatakan sesuatu yang tidak
   * pernah dibayar. Sampai ada pembayaran sungguhan, pendaftaran berbayar
   * hanya lewat admin (lib/learners-admin.ts), yang memang mengonfirmasi
   * pembayarannya di luar sistem.
   */
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("price")
    .eq("id", courseId)
    .single()

  if (courseError || !course) {
    console.error("enroll (course lookup) failed:", courseError?.message)
    return { ok: false, error: "Kursus tidak ditemukan." }
  }

  if (course.price > 0) {
    return {
      ok: false,
      error: "Kursus ini berbayar dan belum bisa didaftar sendiri. Hubungi pengelola untuk didaftarkan.",
    }
  }

  const { error } = await supabase
    .from("enrollments")
    .upsert(
      { learner_id: userId, course_id: courseId },
      { onConflict: "learner_id,course_id", ignoreDuplicates: true }
    )

  if (error) {
    console.error("enroll failed:", error.message)
    return { ok: false, error: "Gagal mendaftar ke kursus. Coba lagi." }
  }

  await recordEnrollmentTransaction(supabase, userId, courseId)

  revalidatePath("/learner/courses")
  revalidatePath("/learner/courses/[id]", "page")
  revalidatePath("/learner/dashboard")

  return { ok: true }
}
