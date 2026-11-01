import type { SupabaseClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { dbErrorMessage } from "@/lib/db-error-message"
import { BUILT_IN_CERTIFICATE_DEFAULTS, type CertificateDefaults } from "@/lib/certificate-settings"

const COLUMNS =
  "certificate_type, custom_title, description, signature_url, signer_name, signer_title, additional_text, template_url, layout"

/**
 * Membaca satu-satunya baris pengaturan sertifikat perusahaan.
 *
 * Mengembalikan bawaan bawaan-kode bila barisnya tidak ada **atau tabelnya
 * belum ada**. Yang kedua bukan kehati-hatian berlebihan: migrasi proyek ini
 * dijalankan tangan lewat SQL Editor, jadi selalu ada jeda antara kode
 * ter-deploy dan SQL-nya dijalankan. Selama jeda itu sertifikat harus tetap
 * terbit dengan bentuk lama, bukan gagal.
 */
export async function getCertificateDefaults(client?: SupabaseClient): Promise<CertificateDefaults> {
  const supabase = client ?? (await createClient())
  const { data, error } = await supabase
    .from("certificate_defaults")
    .select(COLUMNS)
    .eq("id", true)
    .maybeSingle<CertificateDefaults>()

  if (error || !data) return BUILT_IN_CERTIFICATE_DEFAULTS
  return data
}

/** True bila tabelnya sudah ada -- dipakai layar pengelola untuk menjelaskan
 *  kenapa pengaturannya belum bisa disimpan, alih-alih gagal diam-diam. */
export async function certificateDefaultsReady(): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("certificate_defaults").select("id").limit(1)
  return !error
}

/**
 * Menyimpan pengaturan utama. Kewenangannya dijaga RLS (`is_superadmin()`),
 * jadi klien yang dipakai di sini harus klien sesi pemanggil -- bukan service
 * role, yang akan menembus penjagaan itu.
 */
export async function saveCertificateDefaults(
  input: CertificateDefaults
): Promise<{ error: string } | { error: null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("certificate_defaults")
    .upsert({ id: true, ...input, updated_at: new Date().toISOString() })

  if (error) {
    console.error("saveCertificateDefaults failed:", error.message)
    return { error: dbErrorMessage(error.message) }
  }
  return { error: null }
}
