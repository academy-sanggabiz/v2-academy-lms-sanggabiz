import { createClient } from "@/lib/supabase/server"

import {
  hitungLaporanDepartemen,
  totalLaporan,
  type BarisDepartemen,
  type MasukanPendaftaran,
  type MasukanPeserta,
  type MasukanWajib,
  type TotalLaporan,
} from "@/lib/laporan-departemen"

/**
 * Pembaca laporan per departemen (F3).
 *
 * Memakai klien PEMANGGIL, bukan service role -- pola yang sama dengan
 * `lib/behavior-server.ts`. Seorang superadmin sudah boleh membaca seluruh
 * `enrollments` dan `certificates` lewat `owns_course()`, yang memang
 * superset untuk peran itu. Artinya pagarnya tetap RLS: kalau suatu hari
 * halamannya lupa memanggil `resolveSuperAdminProfile()`, kueri ini
 * mengembalikan sedikit baris atau nol, bukan seluruh organisasi.
 */

export type LaporanDepartemen = {
  baris: BarisDepartemen[]
  total: TotalLaporan
  /** Dibuat di server supaya angka dan jamnya berasal dari satu sumber. */
  dibuatPada: string
}

/**
 * Membaca seluruh baris sebuah tabel, bukan hanya seribu pertama.
 *
 * PostgREST membatasi jawaban secara diam-diam. Pada laporan, batas diam-diam
 * bukan sekadar data hilang -- ia menghasilkan persentase yang terlihat masuk
 * akal dan salah, yang justru lebih berbahaya daripada layar kosong.
 */
async function semua<T>(
  jalankan: (dari: number, sampai: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const UKURAN = 1000
  const keluar: T[] = []
  for (let dari = 0; ; dari += UKURAN) {
    const { data, error } = await jalankan(dari, dari + UKURAN - 1)
    if (error) {
      console.error("laporan departemen: gagal membaca halaman", dari, error)
      break
    }
    const batch = data ?? []
    keluar.push(...batch)
    if (batch.length < UKURAN) break
  }
  return keluar
}

export async function getLaporanDepartemen(): Promise<LaporanDepartemen> {
  const supabase = await createClient()

  const [departemen, peserta, pendaftaran, wajib] = await Promise.all([
    semua<{ id: string; name: string }>((d, s) =>
      supabase.from("departments").select("id, name").order("name").range(d, s)
    ),
    semua<{ id: string; department_id: string | null; job_title_id: string | null }>((d, s) =>
      supabase
        .from("profiles")
        .select("id, department_id, job_title_id")
        .eq("role", "learner")
        .range(d, s)
    ),
    semua<{
      id: string
      learner_id: string
      course_id: string
      status: string
      due_at: string | null
    }>((d, s) =>
      supabase
        .from("enrollments")
        .select("id, learner_id, course_id, status, due_at")
        .range(d, s)
    ),
    semua<{ job_title_id: string; course_id: string }>((d, s) =>
      supabase
        .from("job_title_courses")
        .select("job_title_id, course_id")
        .eq("requirement", "wajib")
        .range(d, s)
    ),
  ])

  /*
   * Sertifikat dibaca dengan `enrollment_id` saja, lalu dipasangkan di sini.
   * Tabelnya memang tidak punya kolom peserta -- satu sertifikat melekat pada
   * satu pendaftaran -- jadi tidak ada cara menanyakannya per departemen
   * tanpa gabungan ini.
   */
  const idPendaftaran = new Set(pendaftaran.map((e) => e.id))
  const sertifikat = await semua<{ enrollment_id: string }>((d, s) =>
    supabase.from("certificates").select("enrollment_id").range(d, s)
  )
  const bersertifikat = new Set(
    sertifikat.map((c) => c.enrollment_id).filter((id) => idPendaftaran.has(id))
  )

  const masukanPeserta: MasukanPeserta[] = peserta.map((p) => ({
    learnerId: p.id,
    departmentId: p.department_id,
    jobTitleId: p.job_title_id,
  }))

  const masukanPendaftaran: MasukanPendaftaran[] = pendaftaran.map((e) => ({
    learnerId: e.learner_id,
    courseId: e.course_id,
    selesai: e.status === "completed",
    dueAt: e.due_at,
    bersertifikat: bersertifikat.has(e.id),
  }))

  const masukanWajib: MasukanWajib[] = wajib.map((w) => ({
    jobTitleId: w.job_title_id,
    courseId: w.course_id,
  }))

  const baris = hitungLaporanDepartemen(
    departemen.map((d) => ({ id: d.id, nama: d.name })),
    masukanPeserta,
    masukanPendaftaran,
    masukanWajib
  )

  return { baris, total: totalLaporan(baris), dibuatPada: new Date().toISOString() }
}

/** Ringkasan AI terakhir untuk laporan ini, bila sudah pernah dibuat. */
export type RingkasanTersimpan = {
  teks: string
  dibuatPada: string
  model: string | null
  /** Angka saat ringkasan dibuat, untuk diperiksa apakah masih cocok. */
  angka: unknown
}

/**
 * Satu ringkasan tersimpan per BAHASA, bukan satu untuk semuanya.
 *
 * Awalnya `scope` cuma "departemen", dan akibatnya terlihat begitu layarnya
 * dibuka dalam bahasa Inggris: antarmukanya Inggris penuh sementara
 * ringkasannya masih Indonesia, karena penulis terakhirlah yang menang.
 * Ringkasan ini dibuat atas permintaan, jadi ia bisa dibuat dalam bahasa
 * pembacanya -- tidak seperti judul kursus, yang memang ditulis sekali.
 */
export function lingkupRingkasan(locale: "id" | "en"): string {
  return `departemen:${locale}`
}

export async function getRingkasanTerakhir(
  locale: "id" | "en"
): Promise<RingkasanTersimpan | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_report_summaries")
    .select("summary, created_at, model, figures")
    .eq("scope", lingkupRingkasan(locale))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      summary: string
      created_at: string
      model: string | null
      figures: unknown
    }>()

  if (error || !data) return null
  return {
    teks: data.summary,
    dibuatPada: data.created_at,
    model: data.model,
    angka: data.figures,
  }
}
