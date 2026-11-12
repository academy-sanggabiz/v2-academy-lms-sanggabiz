import { createAdminClient } from "@/lib/supabase/admin"
import { halaman, jagaApi, jawab } from "@/lib/api-v1"

/**
 * GET /api/v1/courses — daftar kursus terbit.
 *
 * Hanya kursus `published`. Draf adalah pekerjaan yang belum selesai; sistem
 * luar yang menampilkannya akan menawarkan kelas yang belum ada isinya.
 */
export async function GET(request: Request) {
  const jaga = await jagaApi(request, "read")
  if ("tolak" in jaga) return jaga.tolak

  const h = halaman(request)
  const admin = createAdminClient()

  const { data, count } = await admin
    .from("courses")
    .select("id, title, description, level, language, price, is_private, created_at", { count: "exact" })
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(h.offset, h.offset + h.limit - 1)

  return jawab(
    (data ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      level: c.level,
      language: c.language,
      price: c.price,
      private: c.is_private,
      createdAt: c.created_at,
    })),
    h,
    count ?? null
  )
}
