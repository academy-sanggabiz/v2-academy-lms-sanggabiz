import { createAdminClient } from "@/lib/supabase/admin"
import { halaman, jagaApi, jawab } from "@/lib/api-v1"

/**
 * GET /api/v1/learners — daftar peserta.
 *
 * Memuat `externalId`, kolom yang memang dibuat untuk ini: sistem kepegawaian
 * pelanggan punya nomor induk sendiri, dan tanpa tempat menyimpannya setiap
 * integrasi terpaksa mencocokkan orang lewat alamat surel -- yang berubah
 * ketika orang pindah bagian.
 */
export async function GET(request: Request) {
  const jaga = await jagaApi(request, "read")
  if ("tolak" in jaga) return jaga.tolak

  const h = halaman(request)
  const url = new URL(request.url)
  const admin = createAdminClient()

  let q = admin
    .from("profiles")
    .select("id, full_name, email, role, external_id, department_id, job_title_id, created_at", { count: "exact" })
    .eq("role", "learner")
    .order("created_at", { ascending: false })

  // Satu penyaring yang memang dibutuhkan integrasi: mencari orang yang sudah
  // dikenal sistem sebelah tanpa menarik seluruh daftar lebih dulu.
  const externalId = url.searchParams.get("externalId")
  if (externalId) q = q.eq("external_id", externalId)
  const email = url.searchParams.get("email")
  if (email) q = q.eq("email", email)

  const { data, count } = await q.range(h.offset, h.offset + h.limit - 1)

  return jawab(
    (data ?? []).map((p) => ({
      id: p.id,
      name: p.full_name,
      email: p.email,
      externalId: p.external_id,
      departmentId: p.department_id,
      jobTitleId: p.job_title_id,
      createdAt: p.created_at,
    })),
    h,
    count ?? null
  )
}
