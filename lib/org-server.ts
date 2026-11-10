import "server-only"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { dbErrorMessage } from "@/lib/db-error-message"
import type { Department, JobCourse, JobCourseRow, JobTitle, Requirement } from "@/lib/org"

/**
 * Pembaca struktur organisasi dan jalur kursus per jabatan.
 *
 * Semuanya lewat klien sesi biasa, bukan service role: RLS sudah mengizinkan
 * setiap orang yang masuk membaca nama departemen dan jabatan (dasbor
 * membutuhkannya), dan hanya superadmin yang bisa menulis. Memakai service
 * role di sini berarti memindahkan penjagaan dari basis data ke kode, dan
 * kodelah yang lebih sering lupa.
 */

type BarisJabatan = { id: string; name: string; department_id: string | null }

export async function listDepartments(): Promise<Department[]> {
  const supabase = await createClient()
  // `job_titles(count)` dalam satu kueri, bukan satu kueri per departemen:
  // layar penghapusan harus tahu akibatnya SEBELUM tombolnya ditekan, dan
  // menghitungnya satu per satu membuat daftar sepuluh departemen jadi
  // sebelas kueri.
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, job_titles(count)")
    .order("name")
  if (error) {
    console.error("listDepartments gagal:", error.message)
    return []
  }
  return ((data ?? []) as { id: string; name: string; job_titles: { count: number }[] }[]).map(
    (r) => ({ id: r.id, name: r.name, jobTitleCount: r.job_titles?.[0]?.count ?? 0 })
  )
}

export async function listJobTitles(): Promise<JobTitle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("job_titles")
    .select("id, name, department_id, profiles(count)")
    .order("name")
  if (error) {
    console.error("listJobTitles gagal:", error.message)
    return []
  }
  return ((data ?? []) as (BarisJabatan & { profiles: { count: number }[] })[]).map((r) => ({
    id: r.id,
    name: r.name,
    departmentId: r.department_id,
    peopleCount: r.profiles?.[0]?.count ?? 0,
  }))
}

/** Jalur kursus satu jabatan, berurutan. */
export async function listJobCourses(jobTitleId: string): Promise<JobCourse[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("job_title_courses")
    .select("course_id, requirement, due_days, auto_enroll, position")
    .eq("job_title_id", jobTitleId)
    .order("position")
  if (error) {
    console.error("listJobCourses gagal:", error.message)
    return []
  }
  return ((data ?? []) as {
    course_id: string
    requirement: Requirement
    due_days: number | null
    auto_enroll: boolean
    position: number
  }[]).map((r) => ({
    courseId: r.course_id,
    requirement: r.requirement,
    dueDays: r.due_days,
    autoEnroll: r.auto_enroll,
    position: r.position,
  }))
}

export type JabatanSaya = {
  jobTitle: JobTitle | null
  department: Department | null
}

/** Jabatan dan departemen orang yang sedang masuk. */
export async function getMyJobTitle(): Promise<JabatanSaya> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return { jobTitle: null, department: null }

  const { data } = await supabase
    .from("profiles")
    .select("job_title_id, department_id, job_titles(id, name, department_id), departments(id, name)")
    .eq("id", userId)
    .maybeSingle<{
      job_title_id: string | null
      department_id: string | null
      job_titles: BarisJabatan | null
      departments: { id: string; name: string } | null
    }>()

  return {
    jobTitle: data?.job_titles
      ? {
          id: data.job_titles.id,
          name: data.job_titles.name,
          departmentId: data.job_titles.department_id,
          // Tidak relevan di sini: ini jabatan SATU orang, bukan daftar untuk
          // dikelola. Yang memakainya hanya layar pengaturan.
          peopleCount: 0,
        }
      : null,
    department: data?.departments ? { ...data.departments, jobTitleCount: 0 } : null,
  }
}

/**
 * Kursus untuk jabatan orang yang sedang masuk, lengkap dengan alasannya.
 *
 * Mengembalikan daftar kosong untuk orang tanpa jabatan, dan itu yang membuat
 * dasbor peserta lama tidak berubah sedikit pun: pemanggilnya memilih kartu
 * mana yang dirender berdasarkan panjang daftar ini.
 *
 * **Kursus privat yang belum diikuti tidak pernah masuk.** Jalur jabatan bisa
 * saja menunjuk kursus privat (superadmin yang menyusunnya), tetapi kartu di
 * dasbor adalah ajakan mendaftar -- dan mengajak orang ke kursus yang
 * pendaftarannya memang tertutup adalah jalan buntu. Kursus privat yang SUDAH
 * diikuti tetap muncul, karena di situ ia bukan ajakan melainkan pengingat.
 */
export async function getMyJobCourses(): Promise<JobCourseRow[]> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return []

  const { data: profil } = await supabase
    .from("profiles")
    .select("job_title_id")
    .eq("id", userId)
    .maybeSingle<{ job_title_id: string | null }>()

  const jobTitleId = profil?.job_title_id
  if (!jobTitleId) return []

  const { data: jalur } = await supabase
    .from("job_title_courses")
    .select("course_id, requirement, due_days, position")
    .eq("job_title_id", jobTitleId)
    .order("position")

  const baris = (jalur ?? []) as {
    course_id: string
    requirement: Requirement
    due_days: number | null
    position: number
  }[]
  if (baris.length === 0) return []

  const ids = baris.map((r) => r.course_id)

  // Dua kueri terpisah, dan keduanya tersaring RLS: kursus yang tidak boleh
  // dilihat orang ini tidak kembali sama sekali, jadi tidak perlu disaring
  // lagi di sini.
  const [{ data: kursus }, { data: pendaftaran }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, thumbnail_url, lesson_count, is_private")
      .in("id", ids),
    supabase
      .from("enrollments")
      .select("course_id, due_at")
      .eq("learner_id", userId)
      .in("course_id", ids),
  ])

  const petaKursus = new Map(
    ((kursus ?? []) as {
      id: string
      title: string
      thumbnail_url: string | null
      lesson_count: number
      is_private: boolean
    }[]).map((c) => [c.id, c])
  )
  const petaDaftar = new Map(
    ((pendaftaran ?? []) as { course_id: string; due_at: string | null }[]).map((e) => [
      e.course_id,
      e,
    ])
  )

  const hasil: JobCourseRow[] = []
  for (const r of baris) {
    const c = petaKursus.get(r.course_id)
    if (!c) continue
    const daftar = petaDaftar.get(r.course_id)
    if (c.is_private && !daftar) continue

    hasil.push({
      courseId: c.id,
      title: c.title,
      thumbnailUrl: c.thumbnail_url,
      lessonCount: c.lesson_count,
      requirement: r.requirement,
      dueAt: daftar?.due_at ?? null,
      enrolled: !!daftar,
      progress: null,
    })
  }

  // Wajib lebih dulu, lalu urutan yang disusun superadmin. Yang wajib dan yang
  // disarankan bercampur membuat kartu ini kehilangan gunanya.
  hasil.sort((a, b) => {
    if (a.requirement !== b.requirement) return a.requirement === "wajib" ? -1 : 1
    return 0
  })
  return hasil
}

/* ---------------- Tulis (superadmin) ---------------- */

export async function createDepartment(name: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("departments").insert({ name: name.trim() })
  if (error) return { error: dbErrorMessage(error.message) }
  return { ok: true }
}

export async function createJobTitle(
  name: string,
  departmentId: string | null
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("job_titles")
    .insert({ name: name.trim(), department_id: departmentId })
  if (error) return { error: dbErrorMessage(error.message) }
  return { ok: true }
}

export async function setJobCourse(
  jobTitleId: string,
  courseId: string,
  requirement: Requirement,
  dueDays: number | null
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("job_title_courses")
    .upsert(
      { job_title_id: jobTitleId, course_id: courseId, requirement, due_days: dueDays },
      { onConflict: "job_title_id,course_id" }
    )
  if (error) return { error: dbErrorMessage(error.message) }
  return { ok: true }
}

export async function removeJobCourse(
  jobTitleId: string,
  courseId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("job_title_courses")
    .delete()
    .eq("job_title_id", jobTitleId)
    .eq("course_id", courseId)
  if (error) return { error: dbErrorMessage(error.message) }
  return { ok: true }
}

/**
 * Memberi jabatan kepada seorang peserta.
 *
 * **Service role, bukan klien sesi, dan itu disengaja.** `profiles` punya
 * tepat satu policy UPDATE: `auth.uid() = id`, baris sendiri. Grant kolomnya
 * juga menyebut tujuh kolom satu per satu. Artinya:
 *
 * - Tanpa service role, superadmin pun tidak bisa menulis kolom ini.
 * - Menambah `job_title_id` ke grant kolom akan memberikannya kepada SEMUA
 *   `authenticated` -- dan policy baris-sendiri lalu membuat setiap peserta
 *   bisa mengangkat jabatannya sendiri. Persis yang dilarang brief.
 *
 * Jadi penjagaannya pindah ke pemanggil: `requireSuperAdmin()` di server
 * action, diperiksa SEBELUM fungsi ini dipanggil. Satu-satunya jalan lain
 * adalah fungsi `security definer` di basis data, yang menukar satu risiko
 * dengan risiko lain tanpa mengurangi jumlah tempat yang harus benar.
 */
export async function assignJobTitle(
  learnerId: string,
  jobTitleId: string | null,
  departmentId: string | null
): Promise<{ ok: true } | { error: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("profiles")
    .update({ job_title_id: jobTitleId, department_id: departmentId })
    .eq("id", learnerId)
  if (error) return { error: dbErrorMessage(error.message) }
  return { ok: true }
}

export type PesertaJabatan = {
  id: string
  name: string
  email: string
  jobTitleId: string | null
  departmentId: string | null
}

/**
 * Seluruh peserta beserta jabatannya, untuk layar pengaturan organisasi.
 *
 * Dibaca dari `profiles` langsung, bukan diturunkan dari `enrollments` seperti
 * `getAdminLearnerList()`. Alasannya sama dengan `searchLearners()`: yang
 * dicari di sini justru orang yang BELUM punya pendaftaran apa pun -- karyawan
 * baru dari HRIS yang jabatannya harus diisi lebih dulu supaya kursus
 * wajibnya bisa menyusul.
 */
export async function listLearnersWithJobTitle(limit = 200): Promise<PesertaJabatan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, job_title_id, department_id")
    .eq("role", "learner")
    .order("full_name")
    .limit(limit)

  if (error) {
    console.error("listLearnersWithJobTitle gagal:", error.message)
    return []
  }
  return ((data ?? []) as {
    id: string
    full_name: string | null
    email: string
    job_title_id: string | null
    department_id: string | null
  }[]).map((r) => ({
    id: r.id,
    name: r.full_name || r.email,
    email: r.email,
    jobTitleId: r.job_title_id,
    departmentId: r.department_id,
  }))
}

/** Jalur kursus semua jabatan sekaligus, untuk layar pengaturan. */
export async function listAllJobCourses(): Promise<Record<string, JobCourse[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("job_title_courses")
    .select("job_title_id, course_id, requirement, due_days, auto_enroll, position")
    .order("position")

  if (error) {
    console.error("listAllJobCourses gagal:", error.message)
    return {}
  }
  const peta: Record<string, JobCourse[]> = {}
  for (const r of (data ?? []) as {
    job_title_id: string
    course_id: string
    requirement: Requirement
    due_days: number | null
    auto_enroll: boolean
    position: number
  }[]) {
    ;(peta[r.job_title_id] ??= []).push({
      courseId: r.course_id,
      requirement: r.requirement,
      dueDays: r.due_days,
      autoEnroll: r.auto_enroll,
      position: r.position,
    })
  }
  return peta
}

/**
 * Menghapus departemen.
 *
 * Jabatan di dalamnya TIDAK ikut terhapus -- `job_titles.department_id` dan
 * `profiles.department_id` keduanya `on delete set null`, jadi jabatannya
 * berpindah ke "Tanpa departemen" dan orangnya kehilangan departemennya.
 * Itu sebabnya penghapusan ini aman dan tidak perlu ditahan.
 */
export async function deleteDepartment(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("departments").delete().eq("id", id)
  if (error) return { error: dbErrorMessage(error.message) }
  return { ok: true }
}

/**
 * Menghapus jabatan.
 *
 * Lebih berat daripada menghapus departemen, dan pemanggilnya harus tahu:
 * `job_title_courses` ikut terhapus (`on delete cascade`), jadi seluruh jalur
 * kursusnya hilang; dan setiap orang yang memegangnya kehilangan jabatan
 * (`on delete set null`), jadi kartu "Untuk jabatan Anda" di dasbor mereka
 * berganti kembali ke kartu rekomendasi lama.
 *
 * Tidak ditahan di sini -- superadmin memang berhak -- tetapi layarnya
 * menyebutkan kedua angka itu sebelum tombolnya ditekan.
 */
export async function deleteJobTitle(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("job_titles").delete().eq("id", id)
  if (error) return { error: dbErrorMessage(error.message) }
  return { ok: true }
}
