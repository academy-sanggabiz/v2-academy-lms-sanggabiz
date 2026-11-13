/** Kategori kursus; daftar bersama seperti `instructors`. */
export type Category = {
  id: string
  name: string
  slug: string
}

/**
 * Kursus beserta keterangan tambahan yang hanya dipakai untuk menampilkan
 * kartu: nama kategorinya dan jumlah peserta yang sudah disamarkan. Ruas
 * tambahannya opsional supaya `Course` biasa tetap bisa dioper apa adanya.
 */
export type CourseCardData = Course & {
  category?: Category | null
  learnerCount?: number | null
}

export type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  price: number
  level: string | null
  lesson_count: number
  duration_hours: number
  status: "draft" | "published"
  who_for: string[]
  requirements: string[]
  language: string
  /** Kategori kursus, null bila belum dipilih penyusunnya. */
  category_id: string | null
  /**
   * Invite-only: hidden from the catalog and from anon visitors, readable only
   * by the owning admin and learners an admin has explicitly enrolled.
   * Orthogonal to `status` -- a private course can still be draft or published.
   */
  is_private: boolean
  // Minimum weighted final course grade (see lib/course-grade.ts) a learner
  // must reach, on top of completing every lesson and passing every quiz
  // individually, before checkAndIssueCertificate() will issue one.
  passing_grade: number
  /** true = peserta harus menyelesaikan pelajaran berurutan (lib/lesson-access.ts). */
  sequential: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Instructor = {
  id: string
  name: string
  title: string | null
  bio: string | null
  avatar_url: string | null
}

/** Money only -- a zero amount is `Rp 0`, never a word. */
export function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString("id-ID")}`
}

/**
 * Course-facing access label: invite-only reads "Privat", an open zero-price
 * course reads "Publik", anything else shows the price.
 */
export function formatCourseAccess(
  course: Pick<Course, "price" | "is_private">,
  labels?: { accessPrivate: string; accessPublic: string }
): string {
  if (course.is_private) return labels?.accessPrivate ?? "Privat"
  if (course.price <= 0) return labels?.accessPublic ?? "Publik"
  return formatPrice(course.price)
}

export type LessonContentType = "video" | "text" | "quiz" | "mixed" | "ppt"

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "essay"
  | "matching"
  | "fill_in_blank"
  | "file_upload"

export type AuthorableQuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "essay"
  | "file_upload"

/**
 * Points are standardized by question type rather than authored per-question:
 * objective (auto-graded) questions are worth 1, manually-graded written work
 * is worth 20 so a single essay/study-case question meaningfully outweighs a
 * true/false inside a mixed quiz. A `Record` over the full union means adding
 * a question type forces a compile error here until it's given a weight.
 */
export const QUESTION_TYPE_POINTS: Record<AuthorableQuestionType, number> = {
  multiple_choice: 1,
  true_false: 1,
  short_answer: 1,
  essay: 20,
  file_upload: 20,
}

export type QuestionOption = {
  id: string
  text: string
  position: number
}

export type Question = {
  id: string
  type: QuestionType
  prompt: string
  points: number
  position: number
  allow_multiple: boolean
  case_sensitive: boolean
  options: QuestionOption[]
}

/**
 * Pretest dan posttest: kuis yang MENGUKUR, bukan menilai.
 *
 * `null` berarti kuis biasa, dan itu bukan sekadar nilai bawaan -- itu seluruh
 * kursus yang sudah berjalan hari ini. Setiap aturan baru di bawah bentuknya
 * sama: kalau `measure_kind` null, kodenya berjalan persis seperti sebelumnya.
 * Nilainya sama dengan enum `public.quiz_measure_kind`.
 */
export type QuizMeasureKind = "pretest" | "posttest"

export type Quiz = {
  id: string
  title: string
  pass_score: number
  max_attempts: number | null
  shuffle: boolean
  draw_count: number | null
  is_assessment: boolean
  /** null = kuis biasa. Lihat QuizMeasureKind. */
  measure_kind: QuizMeasureKind | null
  questions: Question[]
}

/**
 * Satu-satunya tempat "apakah ini kuis ukur" dijawab.
 *
 * Dibuat sebagai fungsi, bukan perbandingan `!== null` yang ditulis ulang di
 * sepuluh tempat, karena pertanyaannya muncul di sepuluh tempat: sertifikat,
 * nilai akhir, kunci berurutan, matriks penilaian, dan seterusnya. Satu fungsi
 * berarti satu kali salah, bukan sepuluh.
 *
 * Menerima bentuk longgar supaya baris hasil kueri yang hanya memilih kolom
 * ini pun bisa memakainya tanpa dipaksa menjadi `Quiz` utuh.
 */
export function isMeasureQuiz(
  quiz: { measure_kind?: QuizMeasureKind | string | null } | null | undefined
): boolean {
  return quiz?.measure_kind != null
}

export type Resource = {
  id: string
  lesson_id: string
  title: string
  file_url: string
  type: string | null
  position: number
}

export type Lesson = {
  id: string
  section_id: string
  title: string
  position: number
  content_type: LessonContentType
  video_url: string | null
  content: string | null
  /** Transkrip teks untuk pelajaran video/slide (WCAG 1.2.2). */
  transcript: string | null
  duration_seconds: number | null
  quiz: Quiz | null
  resources: Resource[]
}

export type CourseSection = {
  id: string
  course_id: string
  title: string
  position: number
  lessons: Lesson[]
}

export type CourseDetail = Course & {
  sections: CourseSection[]
  instructor: Instructor | null
  resource_count: number
  /**
   * null ketika jumlahnya tidak boleh diceritakan -- di bawah ambang
   * anonimitas, atau tidak terbaca. Layar menampilkannya hanya bila ada
   * angkanya; nol adalah pernyataan ("belum ada yang mengikuti") dan itu
   * justru pernyataan yang tidak boleh dibuat tentang kelompok sekecil itu.
   */
  enrolled_count: number | null
}

export function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null

  let videoId: string | null = null
  try {
    const parsed = new URL(url)
    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1)
    } else if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v")
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.replace("/embed/", "")
      }
    }
  } catch {
    return null
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

export function getGoogleSlidesEmbedUrl(url: string | null): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes("docs.google.com")) return null
    if (!parsed.pathname.startsWith("/presentation/")) return null

    const match = parsed.pathname.match(/^\/presentation\/d\/(e\/)?([^/]+)/)
    if (!match) return null

    const [, publishedPrefix, id] = match
    return `https://docs.google.com/presentation/d/${publishedPrefix ?? ""}${id}/embed`
  } catch {
    return null
  }
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return ""
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} menit`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`
}
