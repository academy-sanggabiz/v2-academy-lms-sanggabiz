import "server-only"

import { createClient } from "@/lib/supabase/server"
import { hitungRekomendasi, type KursusKandidat, type Rekomendasi } from "@/lib/rekomendasi"

/**
 * Rekomendasi untuk peserta yang sedang masuk.
 *
 * Dibaca dengan klien PEMANGGIL, bukan service role: seluruhnya data yang
 * memang sudah boleh dilihat peserta itu -- pendaftarannya sendiri (policy
 * own-row) dan kursus terbit yang bukan privat (`can_read_course()`).
 * Rekomendasi tidak perlu kewenangan baru.
 */
export async function getRekomendasi(): Promise<Rekomendasi[]> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return []

  const { data: pendaftaran } = await supabase
    .from("enrollments")
    .select("course_id, status, course:courses(id, title, category_id, level)")
    .eq("learner_id", userId)

  type Baris = {
    course_id: string
    status: string
    course: { id: string; title: string; category_id: string | null; level: string | null } | null
  }

  const baris = ((pendaftaran ?? []) as unknown as Baris[]).map((e) => ({
    ...e,
    course: Array.isArray(e.course) ? e.course[0] : e.course,
  }))

  const selesai = baris
    .filter((e) => e.status === "completed" && e.course)
    .map((e) => ({
      id: e.course!.id,
      title: e.course!.title,
      categoryId: e.course!.category_id,
      level: e.course!.level,
    }))

  // Tidak ada yang selesai berarti belum ada yang bisa dijadikan dasar.
  // Kartunya tidak dirender sama sekali, bukan diisi tebakan.
  if (selesai.length === 0) return []

  const sudahDiikuti = new Set(baris.map((e) => e.course_id))

  const { data: kursus } = await supabase
    .from("courses")
    .select("id, title, thumbnail_url, category_id, level, category:categories(name)")
    .eq("status", "published")
    .eq("is_private", false)
    .limit(200)

  type BarisKursus = {
    id: string
    title: string
    thumbnail_url: string | null
    category_id: string | null
    level: string | null
    category: { name: string } | { name: string }[] | null
  }

  const daftar = ((kursus ?? []) as unknown as BarisKursus[]).filter((c) => !sudahDiikuti.has(c.id))
  if (daftar.length === 0) return []

  /*
   * Jumlah peserta dan pelajaran diambil dari view publik yang memang sudah
   * ada untuk keperluan ini (`public_course_stats`), bukan dengan menghitung
   * `enrollments` -- tabel itu own-row bagi peserta, jadi hitungannya akan
   * selalu nol atau satu dan rekomendasinya ikut salah.
   *
   * `learner_count` dari view itu NULL di bawah lima peserta (ambang
   * anonimitas, lihat /api/public/stats). Diperlakukan sebagai nol di sini,
   * dan itu benar: angka yang ditahan memang tidak boleh ikut mengangkat
   * peringkat, dan jumlahnya pun tidak pernah ditampilkan.
   */
  const { data: statistik } = await supabase
    .from("public_course_stats")
    .select("id, learner_count, lesson_count")
    .in("id", daftar.map((c) => c.id))

  const peta = new Map(
    ((statistik ?? []) as { id: string; learner_count: number | null; lesson_count: number | null }[]).map(
      (s) => [s.id, s]
    )
  )

  const kandidat: KursusKandidat[] = daftar.map((c) => {
    const kat = Array.isArray(c.category) ? c.category[0] : c.category
    const s = peta.get(c.id)
    return {
      id: c.id,
      title: c.title,
      thumbnailUrl: c.thumbnail_url,
      categoryId: c.category_id,
      categoryName: kat?.name ?? null,
      level: c.level,
      lessonCount: s?.lesson_count ?? 0,
      learnerCount: s?.learner_count ?? 0,
    }
  })

  return hitungRekomendasi(kandidat, { selesai, sudahDiikuti })
}
