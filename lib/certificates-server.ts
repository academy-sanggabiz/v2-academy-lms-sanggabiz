import { createClient } from "@/lib/supabase/server"

export type LearnerCertificateSummary = {
  id: string
  courseId: string
  courseTitle: string
  serial: string
  issuedAt: string
  pdfUrl: string | null
  feedbackGiven: boolean
}

export async function getLearnerCertificates(): Promise<LearnerCertificateSummary[]> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return []

  const { data, error } = await supabase
    .from("certificates")
    .select(
      "id, serial, issued_at, pdf_url, enrollment:enrollments!inner(learner_id, course:courses(id, title), feedback:course_feedback(id))"
    )
    .eq("enrollment.learner_id", userId)
    .order("issued_at", { ascending: false })

  if (error) {
    console.error("getLearnerCertificates failed:", error.message)
    return []
  }

  return data
    .map((row) => {
      const enrollment = Array.isArray(row.enrollment) ? row.enrollment[0] : row.enrollment
      const course = enrollment ? (Array.isArray(enrollment.course) ? enrollment.course[0] : enrollment.course) : null
      if (!course) return null
      const feedback = enrollment ? (Array.isArray(enrollment.feedback) ? enrollment.feedback : [enrollment.feedback]) : []
      return {
        id: row.id,
        courseId: course.id,
        courseTitle: course.title,
        serial: row.serial,
        issuedAt: row.issued_at,
        pdfUrl: row.pdf_url,
        feedbackGiven: feedback.filter(Boolean).length > 0,
      }
    })
    .filter((c): c is LearnerCertificateSummary => c !== null)
}

/**
 * Sertifikat peserta untuk SATU kursus, atau null.
 *
 * Dipisah dari `getLearnerCertificates()` yang mengambil semuanya: halaman
 * kursus hanya perlu satu baris, dan menarik seluruh sertifikat seseorang
 * untuk memeriksa satu kursus akan tumbuh seiring jumlah kursus yang ia
 * selesaikan.
 */
export async function getLearnerCertificateForCourse(
  courseId: string
): Promise<LearnerCertificateSummary | null> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return null

  const { data, error } = await supabase
    .from("certificates")
    .select(
      "id, serial, issued_at, pdf_url, enrollment:enrollments!inner(learner_id, course_id, course:courses(id, title), feedback:course_feedback(id))"
    )
    .eq("enrollment.learner_id", userId)
    .eq("enrollment.course_id", courseId)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error("getLearnerCertificateForCourse failed:", error.message)
    return null
  }

  const enrollment = Array.isArray(data.enrollment) ? data.enrollment[0] : data.enrollment
  const course = enrollment ? (Array.isArray(enrollment.course) ? enrollment.course[0] : enrollment.course) : null
  if (!course) return null
  const feedback = enrollment ? (Array.isArray(enrollment.feedback) ? enrollment.feedback : [enrollment.feedback]) : []

  return {
    id: data.id,
    courseId: course.id,
    courseTitle: course.title,
    serial: data.serial,
    issuedAt: data.issued_at,
    pdfUrl: data.pdf_url,
    feedbackGiven: feedback.filter(Boolean).length > 0,
  }
}
