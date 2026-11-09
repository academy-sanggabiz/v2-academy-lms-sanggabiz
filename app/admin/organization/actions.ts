"use server"

import { revalidatePath } from "next/cache"

import { requireSuperAdmin } from "@/lib/auth/require-admin"
import {
  assignJobTitle,
  createDepartment,
  createJobTitle,
  removeJobCourse,
  setJobCourse,
} from "@/lib/org-server"
import type { Requirement } from "@/lib/org"

import type { ActionResult } from "@/app/admin/courses/actions"

/**
 * Struktur organisasi: hanya superadmin.
 *
 * Brief menyebut "pengelola", dan /admin/learners memang terlihat mentor juga.
 * Tetapi struktur perusahaan bukan milik satu kursus: satu mentor mengubah
 * jabatan seseorang akan mengubah kursus wajib orang itu di SELURUH kursus
 * milik mentor lain. Karena itu penjagaannya sama dengan RLS tabelnya --
 * superadmin saja (STANDAR-PERAN.md: HR untuk MVP = superadmin).
 *
 * Diperiksa dua kali: di sini, dan oleh RLS. Yang kedua tidak berlaku untuk
 * `assignJobTitle`, yang memakai service role karena grant kolom `profiles`
 * mengunci semua `authenticated` -- jadi di sanalah pemeriksaan di bawah ini
 * menjadi satu-satunya penjaga, dan tidak boleh dihapus.
 */
async function penjaga(): Promise<string | null> {
  try {
    await requireSuperAdmin()
    return null
  } catch {
    return "Anda tidak berwenang"
  }
}

function segarkan() {
  revalidatePath("/admin/organization", "page")
  // Kartu "Untuk jabatan Anda" dibaca dari data ini.
  revalidatePath("/learner/dashboard", "page")
}

export async function createDepartmentAction(name: string): Promise<ActionResult<undefined>> {
  const galat = await penjaga()
  if (galat) return { ok: false, error: galat }
  if (!name.trim()) return { ok: false, error: "Nama departemen belum diisi." }

  const hasil = await createDepartment(name)
  if ("error" in hasil) return { ok: false, error: hasil.error }
  segarkan()
  return { ok: true, data: undefined }
}

export async function createJobTitleAction(
  name: string,
  departmentId: string | null
): Promise<ActionResult<undefined>> {
  const galat = await penjaga()
  if (galat) return { ok: false, error: galat }
  if (!name.trim()) return { ok: false, error: "Nama jabatan belum diisi." }

  const hasil = await createJobTitle(name, departmentId || null)
  if ("error" in hasil) return { ok: false, error: hasil.error }
  segarkan()
  return { ok: true, data: undefined }
}

export async function setJobCourseAction(
  jobTitleId: string,
  courseId: string,
  requirement: Requirement,
  dueDays: number | null
): Promise<ActionResult<undefined>> {
  const galat = await penjaga()
  if (galat) return { ok: false, error: galat }

  const hasil = await setJobCourse(jobTitleId, courseId, requirement, dueDays)
  if ("error" in hasil) return { ok: false, error: hasil.error }
  segarkan()
  return { ok: true, data: undefined }
}

export async function removeJobCourseAction(
  jobTitleId: string,
  courseId: string
): Promise<ActionResult<undefined>> {
  const galat = await penjaga()
  if (galat) return { ok: false, error: galat }

  const hasil = await removeJobCourse(jobTitleId, courseId)
  if ("error" in hasil) return { ok: false, error: hasil.error }
  segarkan()
  return { ok: true, data: undefined }
}

export async function assignJobTitleAction(
  learnerId: string,
  jobTitleId: string | null,
  departmentId: string | null
): Promise<ActionResult<undefined>> {
  const galat = await penjaga()
  if (galat) return { ok: false, error: galat }

  const hasil = await assignJobTitle(learnerId, jobTitleId || null, departmentId || null)
  if ("error" in hasil) return { ok: false, error: hasil.error }
  segarkan()
  return { ok: true, data: undefined }
}
