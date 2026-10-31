import { createClient } from "@/lib/supabase/server"

/**
 * Ringkasan kinerja tiap mentor, untuk layar evaluasi superadmin.
 *
 * Penyaringan peran ada di dalam `admin_mentor_overview()` (SECURITY DEFINER,
 * memeriksa `is_superadmin()`), bukan di sini: data ini menyilangkan seluruh
 * mentor, dan satu-satunya tempat yang aman untuk menegakkan batas itu adalah
 * basis data. Mentor yang memanggilnya tetap menerima daftar kosong.
 */
export type MentorOverviewRow = {
  mentorId: string
  fullName: string
  email: string
  avatarUrl: string | null
  joinedAt: string
  coursesTotal: number
  coursesPublished: number
  learners: number
  enrollments: number
  completed: number
  /** null = belum ada satu pun ulasan, bukan nilai nol. */
  avgRating: number | null
  ratingCount: number
  pendingReviews: number
}

type Raw = {
  mentor_id: string
  full_name: string
  email: string
  avatar_url: string | null
  joined_at: string
  courses_total: number
  courses_published: number
  learners: number
  enrollments: number
  completed: number
  avg_rating: number | null
  rating_count: number
  pending_reviews: number
}

export async function getMentorOverview(): Promise<MentorOverviewRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_mentor_overview")

  if (error) {
    console.error("getMentorOverview failed:", error.message)
    return []
  }

  return ((data ?? []) as Raw[]).map((r) => ({
    mentorId: r.mentor_id,
    fullName: r.full_name,
    email: r.email,
    avatarUrl: r.avatar_url,
    joinedAt: r.joined_at,
    coursesTotal: r.courses_total,
    coursesPublished: r.courses_published,
    learners: r.learners,
    enrollments: r.enrollments,
    completed: r.completed,
    avgRating: r.avg_rating === null ? null : Number(r.avg_rating),
    ratingCount: r.rating_count,
    pendingReviews: r.pending_reviews,
  }))
}

/** Persentase penyelesaian; null ketika belum ada pendaftaran sama sekali. */
export function completionPct(row: Pick<MentorOverviewRow, "completed" | "enrollments">): number | null {
  if (row.enrollments === 0) return null
  return Math.round((row.completed / row.enrollments) * 100)
}
