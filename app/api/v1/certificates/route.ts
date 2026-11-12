import { createAdminClient } from "@/lib/supabase/admin"
import { halaman, jagaApi, jawab } from "@/lib/api-v1"

/** GET /api/v1/certificates — sertifikat yang sudah terbit. */
export async function GET(request: Request) {
  const jaga = await jagaApi(request, "read")
  if ("tolak" in jaga) return jaga.tolak

  const h = halaman(request)
  const admin = createAdminClient()

  const { data, count } = await admin
    .from("certificates")
    .select(
      "id, serial, issued_at, pdf_url, enrollment:enrollments!inner(id, learner_id, course_id)",
      { count: "exact" }
    )
    .order("issued_at", { ascending: false })
    .range(h.offset, h.offset + h.limit - 1)

  type Baris = {
    id: string
    serial: string
    issued_at: string
    pdf_url: string | null
    enrollment: { id: string; learner_id: string; course_id: string } | { id: string; learner_id: string; course_id: string }[] | null
  }

  return jawab(
    ((data ?? []) as unknown as Baris[]).map((c) => {
      const e = Array.isArray(c.enrollment) ? c.enrollment[0] : c.enrollment
      return {
        id: c.id,
        serial: c.serial,
        issuedAt: c.issued_at,
        pdfUrl: c.pdf_url,
        enrollmentId: e?.id ?? null,
        learnerId: e?.learner_id ?? null,
        courseId: e?.course_id ?? null,
      }
    }),
    h,
    count ?? null
  )
}
