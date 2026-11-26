import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { computeCourseGrade, quizGradeWeight, type CourseGrade } from "@/lib/course-grade"
import { pickRepresentativeAttempt } from "@/lib/quiz-attempt-selection"
import { diabaikanSaatMenilai } from "@/lib/courses"

/**
 * Nilai akhir untuk BANYAK pendaftaran sekaligus, dua kueri untuk semuanya.
 *
 * Ada versi satu-peserta (`getLearnerCourseGrade`) dan versi satu-kursus
 * (`getCourseGradingMatrix`), tetapi tidak ada yang cocok untuk API: satu
 * halaman `/api/v1/enrollments` bisa memuat dua ratus baris dari banyak
 * kursus dan banyak peserta sekaligus. Memanggil versi satu-peserta per baris
 * berarti empat ratus kueri untuk satu permintaan.
 *
 * Rumusnya TIDAK dihitung ulang di sini. Ia tetap `computeCourseGrade()`,
 * dengan aturan pemilihan percobaan dan bobot yang sama persis seperti
 * pemanggil lain -- yang berbeda hanya cara mengambil datanya. Rumus kedua
 * akan segera memberi angka berbeda dari yang dilihat peserta di layarnya
 * sendiri, dan angka berbeda untuk hal yang sama adalah cacat yang paling
 * sulit dipercaya ketika ditemukan klien.
 */
export type NilaiBorongan = CourseGrade & {
  /** Jumlah kuis yang ikut menentukan nilai di kursus ini. */
  kuisTotal: number
  /**
   * Berapa di antaranya yang sudah dikerjakan peserta.
   *
   * Ada karena `grade` saja menyesatkan: peserta yang BELUM MULAI dan peserta
   * yang mencoba lalu gagal sama-sama bernilai 0. Terukur pada data nyata --
   * tiga pendaftaran bernilai 0 ternyata nol percobaan, bukan nol jawaban
   * benar. Dasbor klien yang hanya membaca `grade` akan melaporkan orang yang
   * belum mulai sebagai orang yang gagal.
   */
  kuisDikerjakan: number
}

export async function hitungNilaiBorongan(
  supabase: SupabaseClient,
  pasangan: { learnerId: string; courseId: string }[]
): Promise<Map<string, NilaiBorongan | null>> {
  const hasil = new Map<string, NilaiBorongan | null>()
  if (pasangan.length === 0) return hasil

  const idKursus = [...new Set(pasangan.map((p) => p.courseId))]
  const idPeserta = [...new Set(pasangan.map((p) => p.learnerId))]

  type BarisKuis = {
    id: string
    is_assessment: boolean
    measure_kind: string | null
    lesson: { section: { course_id: string } }
  }

  const { data: kuis, error: galatKuis } = await supabase
    .from("quizzes")
    .select("id, is_assessment, measure_kind, lesson:lessons!inner(section:course_sections!inner(course_id))")
    .in("lesson.section.course_id", idKursus)

  if (galatKuis || !kuis) {
    console.error("hitungNilaiBorongan quizzes failed:", galatKuis?.message)
    return hasil
  }

  // Kuis ukur (pretest/posttest) tidak masuk nilai akhir; definisinya satu,
  // di `isMeasureQuiz`.
  const kuisPerKursus = new Map<string, BarisKuis[]>()
  for (const q of kuis as unknown as BarisKuis[]) {
    if (diabaikanSaatMenilai(q)) continue
    const courseId = q.lesson?.section?.course_id
    if (!courseId) continue
    const bucket = kuisPerKursus.get(courseId) ?? []
    bucket.push(q)
    kuisPerKursus.set(courseId, bucket)
  }

  const semuaIdKuis = [...kuisPerKursus.values()].flat().map((q) => q.id)
  if (semuaIdKuis.length === 0) return hasil

  type BarisPercobaan = {
    learner_id: string
    quiz_id: string
    attempt_number: number
    score: number | null
    status: string
  }

  const { data: percobaan, error: galatPercobaan } = await supabase
    .from("quiz_attempts")
    .select("learner_id, quiz_id, attempt_number, score, status")
    .in("learner_id", idPeserta)
    .in("quiz_id", semuaIdKuis)
    .neq("status", "in_progress")
    .order("attempt_number", { ascending: true })

  if (galatPercobaan) {
    console.error("hitungNilaiBorongan attempts failed:", galatPercobaan.message)
    return hasil
  }

  const perPesertaKuis = new Map<string, BarisPercobaan[]>()
  for (const a of (percobaan ?? []) as BarisPercobaan[]) {
    const kunci = `${a.learner_id}:${a.quiz_id}`
    const bucket = perPesertaKuis.get(kunci) ?? []
    bucket.push(a)
    perPesertaKuis.set(kunci, bucket)
  }

  for (const { learnerId, courseId } of pasangan) {
    const daftarKuis = kuisPerKursus.get(courseId) ?? []
    // null, bukan nol: kursus tanpa kuis tidak punya nilai, dan nol akan
    // terbaca sebagai "pesertanya gagal total".
    if (daftarKuis.length === 0) {
      hasil.set(`${learnerId}:${courseId}`, null)
      continue
    }
    let dikerjakan = 0
    const butir = daftarKuis.map((quiz) => {
      const wakil = pickRepresentativeAttempt(
        perPesertaKuis.get(`${learnerId}:${quiz.id}`) ?? [],
        quiz.is_assessment
      )
      if (wakil) dikerjakan += 1
      return {
        score: wakil?.score ?? null,
        weight: quizGradeWeight(quiz.is_assessment),
        pending: wakil?.status === "pending_review",
      }
    })
    hasil.set(`${learnerId}:${courseId}`, {
      ...computeCourseGrade(butir),
      kuisTotal: daftarKuis.length,
      kuisDikerjakan: dikerjakan,
    })
  }

  return hasil
}
