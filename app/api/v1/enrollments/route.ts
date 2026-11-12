import { createAdminClient } from "@/lib/supabase/admin"
import { after } from "next/server"

import { galat, halaman, jagaApi, jawab } from "@/lib/api-v1"
import { kirimAntrean } from "@/lib/webhook-kirim"

/**
 * Pendaftaran: dibaca dan dibuat dari sistem luar.
 *
 * `POST` di sini adalah satu-satunya jalan tulis di seluruh API v1, dan itu
 * disengaja. Yang benar-benar diminta integrasi kepegawaian cuma satu:
 * "orang ini baru masuk bagian itu, daftarkan ke kursus wajibnya". Menyediakan
 * tulis untuk kursus, pelajaran, atau nilai berarti membuka jalan kedua ke
 * data yang seluruh pagarnya -- validasi kuis, urutan pelajaran, syarat
 * sertifikat -- hidup di dalam aplikasi.
 */

type BarisPendaftaran = {
  id: string
  learner_id: string
  course_id: string
  status: string
  enrolled_at: string
  completed_at: string | null
}

export async function GET(request: Request) {
  const jaga = await jagaApi(request, "read")
  if ("tolak" in jaga) return jaga.tolak

  const h = halaman(request)
  const url = new URL(request.url)
  const admin = createAdminClient()

  let q = admin
    .from("enrollments")
    .select("id, learner_id, course_id, status, enrolled_at, completed_at", { count: "exact" })
    .order("enrolled_at", { ascending: false })

  const learnerId = url.searchParams.get("learnerId")
  if (learnerId) q = q.eq("learner_id", learnerId)
  const courseId = url.searchParams.get("courseId")
  if (courseId) q = q.eq("course_id", courseId)
  const status = url.searchParams.get("status")
  if (status === "active" || status === "completed") q = q.eq("status", status)

  const { data, count } = await q.range(h.offset, h.offset + h.limit - 1)
  const baris = (data ?? []) as BarisPendaftaran[]

  /*
   * Kemajuan dihitung sekali untuk seluruh halaman, bukan satu kueri per
   * baris. Daftar 50 pendaftaran yang masing-masing menanyakan kemajuannya
   * sendiri adalah 51 perjalanan ke basis data untuk satu jawaban.
   */
  const idPendaftaran = baris.map((e) => e.id)
  const idKursus = [...new Set(baris.map((e) => e.course_id))]

  const [{ data: progres }, { data: pelajaran }] = await Promise.all([
    idPendaftaran.length
      ? admin
          .from("lesson_progress")
          .select("enrollment_id")
          .in("enrollment_id", idPendaftaran)
          .eq("completed", true)
      : Promise.resolve({ data: [] as { enrollment_id: string }[] }),
    idKursus.length
      ? admin
          .from("lessons")
          .select("id, section:course_sections!inner(course_id)")
          .in("section.course_id", idKursus)
      : Promise.resolve({ data: [] as unknown[] }),
  ])

  const selesaiPer = new Map<string, number>()
  for (const p of (progres ?? []) as { enrollment_id: string }[]) {
    selesaiPer.set(p.enrollment_id, (selesaiPer.get(p.enrollment_id) ?? 0) + 1)
  }

  const totalPer = new Map<string, number>()
  for (const l of (pelajaran ?? []) as { section: { course_id: string } | { course_id: string }[] }[]) {
    const s = Array.isArray(l.section) ? l.section[0] : l.section
    if (!s) continue
    totalPer.set(s.course_id, (totalPer.get(s.course_id) ?? 0) + 1)
  }

  return jawab(
    baris.map((e) => {
      const total = totalPer.get(e.course_id) ?? 0
      const selesai = selesaiPer.get(e.id) ?? 0
      return {
        id: e.id,
        learnerId: e.learner_id,
        courseId: e.course_id,
        status: e.status,
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at,
        lessonsCompleted: selesai,
        lessonsTotal: total,
        progressPercent: total > 0 ? Math.round((selesai / total) * 100) : 0,
      }
    }),
    h,
    count ?? null
  )
}

export async function POST(request: Request) {
  const jaga = await jagaApi(request, "write")
  if ("tolak" in jaga) return jaga.tolak

  let body: { learnerId?: string; learnerEmail?: string; externalId?: string; courseId?: string }
  try {
    body = await request.json()
  } catch {
    return galat(400, "invalid_json", "The request body must be JSON.")
  }

  if (!body.courseId) {
    return galat(400, "missing_field", "`courseId` is required.")
  }

  const admin = createAdminClient()

  /*
   * Peserta boleh ditunjuk dengan tiga cara, dan ketiganya ada alasannya:
   * `learnerId` bila sistem sebelah sudah menyimpan id kami, `externalId`
   * bila ia memakai nomor induk sendiri, `learnerEmail` bila ia belum
   * menyimpan apa pun. Yang TIDAK dilakukan: membuat akun baru. Pendaftaran
   * diam-diam membuat akun berarti satu salah ketik surel melahirkan orang
   * yang tidak ada, lengkap dengan riwayat belajar yang tidak bisa diklaim
   * siapa pun.
   */
  let learnerId = body.learnerId ?? null
  if (!learnerId && (body.externalId || body.learnerEmail)) {
    const kolom = body.externalId ? "external_id" : "email"
    const nilai = body.externalId ?? body.learnerEmail!
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq(kolom, nilai)
      .eq("role", "learner")
      .maybeSingle<{ id: string }>()
    learnerId = data?.id ?? null
  }

  if (!learnerId) {
    return galat(
      404,
      "learner_not_found",
      "No learner matched. Provide `learnerId`, `externalId`, or `learnerEmail` of an existing learner. This endpoint never creates accounts."
    )
  }

  const { data: kursus } = await admin
    .from("courses")
    .select("id, status")
    .eq("id", body.courseId)
    .maybeSingle<{ id: string; status: string }>()

  if (!kursus) return galat(404, "course_not_found", "No course with that id.")
  if (kursus.status !== "published") {
    return galat(409, "course_not_published", "That course is still a draft, so nobody can study it yet.")
  }

  /*
   * `ignoreDuplicates` supaya memanggil ulang tidak menjadi galat. Sistem
   * kepegawaian mengirim ulang kejadian yang sama lebih sering daripada
   * dugaan siapa pun, dan "sudah terdaftar" bukan kegagalan yang perlu
   * ditangani penulis kode di sana.
   */
  const { error } = await admin
    .from("enrollments")
    .upsert({ learner_id: learnerId, course_id: body.courseId, status: "active" }, {
      onConflict: "learner_id,course_id",
      ignoreDuplicates: true,
    })

  if (error) {
    console.error("POST /api/v1/enrollments gagal:", error.message)
    return galat(500, "enrollment_failed", "Could not create the enrollment.")
  }

  /*
   * Pendaftaran baru mengantrekan `enrollment.created` lewat trigger. Dikirim
   * sekarang juga, bukan menunggu cron: paket Hobby hanya mengizinkan cron
   * harian, dan webhook yang tiba besok bukan webhook.
   *
   * `after()` dan bukan janji yang dilepas begitu saja -- fungsi tanpa server
   * bisa dimatikan begitu jawabannya terkirim, dan janji yang menggantung
   * ikut mati di tengah. Antreannya tetap jaminan: gagal di sini berarti
   * tertunda, bukan hilang.
   */
  after(async () => {
    try {
      await kirimAntrean()
    } catch (e) {
      console.error("kirim webhook setelah pendaftaran gagal:", e)
    }
  })

  const { data: hasil } = await admin
    .from("enrollments")
    .select("id, learner_id, course_id, status, enrolled_at, completed_at")
    .eq("learner_id", learnerId)
    .eq("course_id", body.courseId)
    .maybeSingle<BarisPendaftaran>()

  return Response.json(
    {
      data: {
        id: hasil?.id,
        learnerId,
        courseId: body.courseId,
        status: hasil?.status ?? "active",
        enrolledAt: hasil?.enrolled_at,
      },
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  )
}
