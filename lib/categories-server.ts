import "server-only"

import { createClient } from "@/lib/supabase/server"
import { dbErrorMessage } from "@/lib/db-error-message"
import type { Category } from "@/lib/courses"

/**
 * Daftar kategori kursus.
 *
 * Bentuknya meniru `instructors`: satu daftar bersama, bukan milik satu
 * admin. Kategori yang hanya terlihat oleh pembuatnya akan berakhir sebagai
 * lima ejaan berbeda untuk hal yang sama ("Pemrograman", "Programming",
 * "Coding"), dan katalog publik lalu menyaring ke tiga kelompok yang
 * seharusnya satu.
 */
export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, image_url, description")
    .order("position")
    .order("name")

  if (error) {
    console.error("listCategories failed:", error.message)
    return []
  }
  return (data ?? []) as Category[]
}

/** Slug yang bisa dibaca orang di alamat URL katalog. */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

export async function createCategory(
  name: string
): Promise<{ category: Category } | { error: string }> {
  const bersih = name.trim()
  if (!bersih) return { error: "Nama kategori tidak boleh kosong." }
  if (bersih.length > 60) return { error: "Nama kategori maksimal 60 karakter." }

  const slug = slugify(bersih)
  if (!slug) return { error: "Nama kategori harus memuat huruf atau angka." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: bersih, slug })
    .select("id, name, slug, image_url, description")
    .single<Category>()

  if (error) {
    // Indeks uniknya memakai lower(), jadi "Pemrograman" dan "pemrograman"
    // bertabrakan -- dan memang seharusnya: keduanya kategori yang sama.
    if (/duplicate key/i.test(error.message)) {
      return { error: "Kategori dengan nama itu sudah ada." }
    }
    return { error: dbErrorMessage(error.message, "Gagal membuat kategori. Coba lagi.") }
  }

  return { category: data }
}

/**
 * Menyimpan gambar dan keterangan satu kategori.
 *
 * Langsung berlaku, TIDAK lewat draf. Kategori bukan isi halaman depan: ia
 * juga dipakai saringan katalog `/kelas`, jadi menunda perubahannya sampai
 * halaman depan diterbitkan akan membuat dua layar menampilkan kategori yang
 * sama dengan wajah berbeda. Penyuntingnya menyebutkan ini di layar.
 */
export async function updateCategory(
  id: string,
  patch: { image_url?: string | null; description?: string | null }
): Promise<{ category: Category } | { error: string }> {
  const bersih: { image_url?: string | null; description?: string | null } = {}
  if ("image_url" in patch) bersih.image_url = patch.image_url?.trim() || null
  if ("description" in patch) {
    const d = patch.description?.trim() || null
    if (d && d.length > 160) return { error: "Keterangan maksimal 160 karakter." }
    bersih.description = d
  }
  if (Object.keys(bersih).length === 0) return { error: "Tidak ada yang diubah." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .update(bersih)
    .eq("id", id)
    .select("id, name, slug, image_url, description")
    .single<Category>()

  if (error) return { error: dbErrorMessage(error.message, "Gagal menyimpan kategori. Coba lagi.") }
  return { category: data }
}
