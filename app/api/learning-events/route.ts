import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

/**
 * Menerima satu pengamatan pelajaran.
 *
 * Rute HTTP, bukan server action, karena pengirimnya `navigator.sendBeacon()`.
 * Pencatatan ini terjadi tepat saat halaman ditinggalkan, dan permintaan biasa
 * pada saat itu sering dibatalkan peramban di tengah jalan -- yang membuat
 * justru pengamatan paling bermakna (peserta selesai membaca lalu pindah)
 * paling sering hilang. `sendBeacon` dijamin terkirim dan hanya bisa menuju
 * URL, bukan server action.
 *
 * Persetujuan sengaja TIDAK diperiksa di sini: policy `learning_events` di
 * basis data sudah mensyaratkannya lewat `has_tracking_consent()`. Memeriksa
 * dua kali membuat seolah-olah pemeriksaan di rute inilah penjaganya.
 */
export async function POST(request: Request) {
  let body: { courseId?: string; lessonId?: string; durationSeconds?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const detik = Number(body.durationSeconds)
  if (!body.courseId || !body.lessonId || !Number.isFinite(detik) || detik < 5) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub as string | undefined
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 })

  const { error } = await supabase.from("learning_events").insert({
    user_id: userId,
    course_id: body.courseId,
    lesson_id: body.lessonId,
    event_type: "lesson_view",
    duration_seconds: Math.min(Math.round(detik), 3600),
  })

  // 42501 = ditolak policy, yang di sini berarti peserta belum menyetujui.
  // Keadaan normal, bukan galat.
  if (error && error.code !== "42501") {
    console.error("learning-events insert failed:", error.message)
  }

  return NextResponse.json({ ok: true })
}
