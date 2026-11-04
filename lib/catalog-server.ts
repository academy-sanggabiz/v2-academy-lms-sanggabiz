import "server-only"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Category, Course } from "@/lib/courses"
import { normalizeLevel, type CourseLevel } from "@/lib/course-level"

/**
 * Katalog kursus untuk pengunjung yang belum punya akun.
 *
 * Dibaca dengan klien biasa (kunci anon), bukan service role: RLS sudah
 * mengizinkan siapa pun membaca kursus `published` yang bukan privat lewat
 * `can_read_course()`, jadi memakai service role di sini hanya akan
 * memindahkan penjagaan dari basis data ke kode -- tempat yang lebih mudah
 * salah. Satu-satunya yang butuh service role adalah ringkasan ulasan, yang
 * memang tertutup bagi anon, dan itu dipisah ke fungsi tersendiri di bawah.
 */

/** Berapa data minimum sebelum sebuah angka boleh ditampilkan di halaman publik. */
const AMBANG_ANONIMITAS = 5

export type CatalogSort = "terbaru" | "judul" | "tersingkat" | "terpanjang"

export type CatalogFilters = {
  q?: string
  level?: CourseLevel | null
  /** `gratis` = harga 0 (kursus publik), `berbayar` = harga di atas 0. */
  akses?: "gratis" | "berbayar" | null
  /** `pendek` < 1 jam, `sedang` 1-5 jam, `panjang` > 5 jam. */
  durasi?: "pendek" | "sedang" | "panjang" | null
  /** Slug kategori; dipakai di URL supaya tautannya tetap terbaca orang. */
  kategori?: string | null
  sort?: CatalogSort
}

export type CatalogCourse = Course & {
  /**
   * Jumlah peserta, `null` bila di bawah ambang anonimitas. Aturannya sama
   * dengan yang sudah dipakai `/api/public/stats`: di platform sekecil ini,
   * "1 peserta di kursus ini" menyebut satu orang tertentu.
   */
  learnerCount: number | null
  /** Rata-rata ulasan, `null` selama ulasannya belum cukup untuk anonim. */
  rating: { average: number; count: number } | null
  category: Category | null
}

/** Pilihan saringan beserta jumlah hasilnya, dihitung dari katalog penuh. */
export type CatalogFacets = {
  total: number
  perLevel: Record<CourseLevel, number>
  tanpaLevel: number
  gratis: number
  berbayar: number
  /** Kategori yang benar-benar punya kursus terbit, beserta jumlahnya. */
  categories: { category: Category; count: number }[]
}

function cocokDurasi(jam: number, durasi: CatalogFilters["durasi"]): boolean {
  if (!durasi) return true
  if (durasi === "pendek") return jam < 1
  if (durasi === "sedang") return jam >= 1 && jam <= 5
  return jam > 5
}

/**
 * Seluruh kursus yang boleh dilihat publik, sudah disaring dan diurutkan.
 *
 * Penyaringan dilakukan di sini, bukan di query, karena katalognya kecil
 * (puluhan baris) dan dua saringannya -- tingkat dan durasi -- perlu
 * normalisasi serta pengelompokan yang tidak bisa dinyatakan sebagai satu
 * klausa `eq`. Begitu katalognya ratusan baris, pindahkan ke query dengan
 * indeks; sampai saat itu, menyaring di memori lebih jujur daripada query
 * yang terlihat rumit tetapi tetap membaca seluruh tabel.
 */
export async function getCatalogCourses(
  filters: CatalogFilters = {}
): Promise<{ courses: CatalogCourse[]; facets: CatalogFacets }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("status", "published")
    .eq("is_private", false)
    .order("created_at", { ascending: false })

  const { data: kategoriRows } = await supabase.from("categories").select("id, name, slug").order("position")
  const kategoriById = new Map(((kategoriRows ?? []) as Category[]).map((k) => [k.id, k]))

  if (error) {
    console.error("getCatalogCourses failed:", error.message)
    return { courses: [], facets: facetKosong() }
  }

  const semua = (data ?? []) as Course[]

  const facets: CatalogFacets = {
    total: semua.length,
    perLevel: { beginner: 0, intermediate: 0, advanced: 0 },
    tanpaLevel: 0,
    gratis: semua.filter((c) => c.price <= 0).length,
    berbayar: semua.filter((c) => c.price > 0).length,
    categories: [],
  }
  // Hanya kategori yang punya isi yang ditawarkan sebagai saringan: pilihan
  // yang pasti menghasilkan nol hasil adalah jalan buntu yang baru terlihat
  // setelah ditekan.
  const hitungKategori = new Map<string, number>()
  for (const course of semua) {
    if (course.category_id) {
      hitungKategori.set(course.category_id, (hitungKategori.get(course.category_id) ?? 0) + 1)
    }
  }
  facets.categories = [...hitungKategori.entries()]
    .map(([id, count]) => ({ category: kategoriById.get(id), count }))
    .filter((x): x is { category: Category; count: number } => Boolean(x.category))
  for (const course of semua) {
    const level = normalizeLevel(course.level)
    if (level) facets.perLevel[level] += 1
    else facets.tanpaLevel += 1
  }

  const kata = (filters.q ?? "").trim().toLowerCase()
  let hasil = semua.filter((course) => {
    if (filters.level && normalizeLevel(course.level) !== filters.level) return false
    if (filters.kategori) {
      const k = course.category_id ? kategoriById.get(course.category_id) : null
      if (!k || k.slug !== filters.kategori) return false
    }
    if (filters.akses === "gratis" && course.price > 0) return false
    if (filters.akses === "berbayar" && course.price <= 0) return false
    if (!cocokDurasi(Number(course.duration_hours ?? 0), filters.durasi)) return false
    if (kata) {
      const tumpukan = `${course.title} ${course.description ?? ""}`.toLowerCase()
      if (!tumpukan.includes(kata)) return false
    }
    return true
  })

  const sort = filters.sort ?? "terbaru"
  if (sort === "judul") {
    hasil = [...hasil].sort((a, b) => a.title.localeCompare(b.title, "id"))
  } else if (sort === "tersingkat") {
    hasil = [...hasil].sort((a, b) => Number(a.duration_hours) - Number(b.duration_hours))
  } else if (sort === "terpanjang") {
    hasil = [...hasil].sort((a, b) => Number(b.duration_hours) - Number(a.duration_hours))
  }

  const [peserta, ulasan] = await Promise.all([
    hitungPeserta(hasil.map((c) => c.id)),
    ringkasUlasan(hasil.map((c) => c.id)),
  ])

  return {
    courses: hasil.map((course) => ({
      ...course,
      learnerCount: peserta.get(course.id) ?? null,
      rating: ulasan.get(course.id) ?? null,
      category: course.category_id ? (kategoriById.get(course.category_id) ?? null) : null,
    })),
    facets,
  }
}

function facetKosong(): CatalogFacets {
  return {
    total: 0,
    perLevel: { beginner: 0, intermediate: 0, advanced: 0 },
    tanpaLevel: 0,
    gratis: 0,
    berbayar: 0,
    categories: [],
  }
}

/**
 * Jumlah peserta per kursus, sudah disamarkan di bawah ambang.
 *
 * Memakai view `public_course_stats` yang memang disiapkan untuk konsumsi
 * publik (migrasi 20261030000000) -- bukan membaca `enrollments` langsung,
 * yang tertutup bagi anon dan memang seharusnya begitu.
 */
async function hitungPeserta(ids: string[]): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>()
  if (ids.length === 0) return out

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("public_course_stats")
    .select("id, learner_count")
    .in("id", ids)

  if (error) {
    console.error("hitungPeserta failed:", error.message)
    return out
  }

  for (const row of data ?? []) {
    const n = Number((row as { learner_count: number }).learner_count ?? 0)
    out.set((row as { id: string }).id, n >= AMBANG_ANONIMITAS ? n : null)
  }
  return out
}

/**
 * Rata-rata ulasan per kursus.
 *
 * `course_feedback` hanya terbaca pemiliknya dan pengelola kursusnya, jadi
 * ringkasan ini memang perlu service role -- pola yang sama sudah dipakai
 * `getLandingTestimonials()`. Yang dikembalikan hanya angka: rata-rata dan
 * jumlah, tanpa nama, tanpa komentar, tanpa id peserta. Dan hanya kalau
 * ulasannya sudah cukup banyak untuk tidak menunjuk satu orang.
 */
async function ringkasUlasan(
  ids: string[]
): Promise<Map<string, { average: number; count: number } | null>> {
  const out = new Map<string, { average: number; count: number } | null>()
  if (ids.length === 0) return out

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("course_feedback")
    .select("course_id, rating")
    .in("course_id", ids)

  if (error) {
    console.error("ringkasUlasan failed:", error.message)
    return out
  }

  const kumpul = new Map<string, number[]>()
  for (const row of data ?? []) {
    const id = (row as { course_id: string }).course_id
    const nilai = Number((row as { rating: number }).rating)
    if (!Number.isFinite(nilai)) continue
    kumpul.set(id, [...(kumpul.get(id) ?? []), nilai])
  }

  for (const [id, nilai] of kumpul) {
    if (nilai.length < AMBANG_ANONIMITAS) {
      out.set(id, null)
      continue
    }
    const jumlah = nilai.reduce((a, b) => a + b, 0)
    out.set(id, { average: Math.round((jumlah / nilai.length) * 10) / 10, count: nilai.length })
  }
  return out
}

/** Satu kursus untuk halaman pratinjau publik, atau null bila tidak boleh dilihat. */
export async function getCatalogCourse(id: string): Promise<CatalogCourse | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .eq("is_private", false)
    .maybeSingle<Course>()

  if (error || !data) return null

  const [peserta, ulasan] = await Promise.all([hitungPeserta([id]), ringkasUlasan([id])])

  let category: Category | null = null
  if (data.category_id) {
    const { data: k } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("id", data.category_id)
      .maybeSingle<Category>()
    category = k ?? null
  }

  return {
    ...data,
    learnerCount: peserta.get(id) ?? null,
    rating: ulasan.get(id) ?? null,
    category,
  }
}

/**
 * Apakah kelas ini menerbitkan sertifikat setelah lulus.
 *
 * `course_certificate_settings` hanya terbaca pemilik kursusnya, jadi
 * pembacaan ini memakai service role -- pola yang sama dengan ringkasan
 * ulasan di atas. Yang dikembalikan satu boolean, bukan barisnya: templat,
 * nama penanda tangan, dan teks sertifikat tidak ada urusannya dengan
 * halaman katalog dan karena itu tidak ikut keluar.
 */
export async function isCertificateEnabled(courseId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("course_certificate_settings")
    .select("enabled")
    .eq("course_id", courseId)
    .maybeSingle<{ enabled: boolean }>()

  if (error) {
    console.error("isCertificateEnabled failed:", error.message)
    return false
  }
  return data?.enabled === true
}

/**
 * Apakah ada sesi yang sedang masuk.
 *
 * Dipakai halaman pratinjau kelas untuk membedakan "belum masuk" dari "sudah
 * masuk tetapi belum terdaftar". Tanpa pembedaan itu, pengunjung anonim
 * melihat tombol "Daftar" yang pasti gagal -- `enroll` menolaknya karena
 * tidak ada `auth.uid()` -- dan itu persis jalan buntu yang ingin dihindari
 * halaman ini.
 */
export async function isSignedIn(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return Boolean(data?.claims?.sub)
}
