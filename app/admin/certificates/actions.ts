"use server"

import { revalidatePath } from "next/cache"

import { requireSuperAdmin } from "@/lib/auth/require-admin"
import { saveCertificateDefaults } from "@/lib/certificate-defaults-server"
import type { CertificateDefaults } from "@/lib/certificate-settings"

import type { ActionResult } from "@/app/admin/courses/actions"

/**
 * Menyimpan pengaturan sertifikat perusahaan.
 *
 * Diperiksa dua kali dengan sengaja: `requireSuperAdmin()` di sini dan RLS
 * `is_superadmin()` di basis data. Server action bisa dipanggil langsung
 * lewat jaringan, jadi penjaga di layar bukan penjaga.
 */
export async function saveCertificateDefaultsAction(
  input: CertificateDefaults
): Promise<ActionResult<undefined>> {
  try {
    await requireSuperAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await saveCertificateDefaults(input)
  if (result.error) return { ok: false, error: result.error }

  // Setiap kursus yang mewarisi ikut berubah, jadi layar penyusunnya harus
  // ikut disegarkan -- bukan hanya layar ini.
  revalidatePath("/admin/certificates", "page")
  revalidatePath("/admin/courses", "layout")
  return { ok: true, data: undefined }
}
