import { NextResponse } from "next/server"

/**
 * API publik tanpa data pribadi: ringkasan kursus dan jumlah peserta.
 *
 * Terbuka tanpa kunci, jadi isinya sengaja dibatasi pada angka agregat. Tidak
 * ada nama, email, atau id orang di sini, dan batas itu ditegakkan di database
 * lewat view `public_course_stats` / `public_platform_totals`
 * (supabase/migrations/20261030000000_public_stats_views.sql) -- bukan hanya
 * oleh kode berkas ini. Karena itu endpoint ini cukup memakai kunci anon:
 * service-role key tidak pernah menyentuh jalur publik.
 *
 * Kursus draf dan privat tidak pernah ikut, sama seperti di katalog peserta.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

// Dipanggil dari situs lain, jadi lintas-asal harus diizinkan. Aman dibuka ke
// semua asal justru karena responsnya tidak memuat data pribadi.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

const CACHE_SECONDS = 60

type TotalsRow = {
  learner_count: number
  demo_learner_count: number
  course_count: number
  enrollment_count: number
}

type CourseRow = {
  id: string
  title: string
  description: string | null
  level: string | null
  language: string | null
  lesson_count: number | null
  duration_hours: number | null
  learner_count: number
}

async function readView<T>(view: string, select: string): Promise<T[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${view}?select=${select}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    next: { revalidate: CACHE_SECONDS },
  })

  if (!response.ok) throw new Error(`${view} responded ${response.status}`)
  return (await response.json()) as T[]
}

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Layanan belum dikonfigurasi." },
      { status: 503, headers: CORS_HEADERS }
    )
  }

  try {
    const [totalsRows, courseRows] = await Promise.all([
      readView<TotalsRow>("public_platform_totals", "*"),
      readView<CourseRow>(
        "public_course_stats",
        "id,title,description,level,language,lesson_count,duration_hours,learner_count"
      ),
    ])

    const totals = totalsRows[0] ?? {
      learner_count: 0,
      demo_learner_count: 0,
      course_count: 0,
      enrollment_count: 0,
    }

    return NextResponse.json(
      {
        generated_at: new Date().toISOString(),
        totals: {
          learners: totals.learner_count,
          courses: totals.course_count,
          enrollments: totals.enrollment_count,
        },
        courses: courseRows
          .map((course) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            level: course.level,
            language: course.language,
            lessons: course.lesson_count ?? 0,
            duration_hours: course.duration_hours ?? 0,
            learners: course.learner_count,
          }))
          .sort((a, b) => b.learners - a.learners || a.title.localeCompare(b.title, "id")),
        // Endpoint ini menyatakan sendiri bila sebagian isinya masih data uji,
        // supaya angkanya tidak pernah dibaca sebagai capaian nyata.
        notice:
          totals.demo_learner_count > 0
            ? `Sebagian data masih data demo untuk uji coba (${totals.demo_learner_count} dari ${totals.learner_count} peserta).`
            : null,
      },
      {
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=300`,
        },
      }
    )
  } catch (error) {
    console.error("public stats failed:", error)
    return NextResponse.json(
      { error: "Gagal mengambil statistik. Coba lagi." },
      { status: 502, headers: CORS_HEADERS }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
