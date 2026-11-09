"use server"

import { createClient } from "@/lib/supabase/server"
import { getLearnData } from "@/lib/learn-server"
import { createAdminClient } from "@/lib/supabase/admin"
import { aiAktif } from "@/lib/ai/client"
import { jawabPertanyaan, keTeks, type KonteksPelajaran } from "@/lib/ai/lesson-assistant"
import { computeUnlockedLessons } from "@/lib/lesson-access"
import { getTranslations } from "@/lib/i18n/server"

/**
 * Asisten AI pelajaran (F4).
 *
 * **Setiap pagar diperiksa di sini, bukan di komponen.** Tab asisten memang
 * tidak dirender untuk pelajaran kuis atau saat AI mati, tetapi aksi ini bisa
 * dipanggil langsung lewat jaringan -- jadi di sinilah pendaftaran, akses
 * pelajaran (kursus berurutan), dan jenis pelajaran diperiksa ulang.
 */

const BATAS_HARIAN = 30

export type JawabanAsisten =
  | { ok: true; jawaban: string; sisaHariIni: number }
  | { ok: false; error: string }

export async function tanyaAsisten(
  courseId: string,
  lessonId: string,
  pertanyaan: string,
  riwayat: { role: "user" | "assistant"; content: string }[]
): Promise<JawabanAsisten> {
  if (!aiAktif()) return { ok: false, error: "Fitur AI belum diaktifkan." }

  const teksPertanyaan = pertanyaan.trim()
  if (!teksPertanyaan) return { ok: false, error: "Pertanyaannya belum diisi." }
  if (teksPertanyaan.length > 1000) return { ok: false, error: "Pertanyaannya terlalu panjang." }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return { ok: false, error: "Anda belum masuk." }

  /*
    `getLearnData()` adalah pembaca yang sama dengan yang dipakai halaman
    pemutar, dan itu disengaja: ia sudah menegakkan pendaftaran (tanpa
    pendaftaran, `enrollmentId` null) dan sudah mengembalikan bentuk yang
    dibutuhkan `computeUnlockedLessons()`. Merakit kueri sendiri di sini
    berarti dua definisi "boleh dibaca" yang harus dijaga tetap sama.
  */
  const { course, enrollmentId, completedLessonIds, passedQuizIds, courseCompleted } =
    await getLearnData(courseId)
  if (!course) return { ok: false, error: "Kursus tidak ditemukan." }
  if (!enrollmentId) return { ok: false, error: "Anda belum terdaftar di kursus ini." }

  const allLessons = course.sections.flatMap((s) => s.lessons)
  const lesson = allLessons.find((l) => l.id === lessonId)
  if (!lesson) return { ok: false, error: "Pelajaran tidak ditemukan." }

  // Kuis dan studi kasus tidak punya asisten: membantu memahami bacaan adalah
  // hal lain dari membantu menjawab penilaian.
  if (lesson.content_type === "quiz") {
    return { ok: false, error: "Asisten tidak tersedia di pelajaran kuis." }
  }

  /*
    Pelajaran yang masih TERKUNCI pada kursus berurutan tidak dipakai sebagai
    konteks. Judulnya tetap boleh disebut -- daftar isi memang sudah terlihat
    di sidebar -- tetapi isinya tidak, karena itu persis yang ditahan
    lib/lesson-access.ts.
  */
  const terbuka = computeUnlockedLessons({
    lessons: allLessons.map((l) => ({
      id: l.id,
      content_type: l.content_type,
      quizId: l.quiz?.id ?? null,
    })),
    completedLessonIds,
    passedQuizIds,
    sequential: course.sequential,
    courseCompleted,
  })
  if (!terbuka.has(lessonId)) return { ok: false, error: "Pelajaran ini belum terbuka." }

  const admin = createAdminClient()

  // Batas harian: menghitung baris pemakaian, bukan menebak dari percakapan.
  const awalHari = new Date()
  awalHari.setHours(0, 0, 0, 0)
  const { count } = await admin
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", "lesson-assistant")
    .gte("created_at", awalHari.toISOString())

  const terpakai = count ?? 0
  if (terpakai >= BATAS_HARIAN) {
    return { ok: false, error: "Jatah tanya hari ini sudah habis. Coba lagi besok." }
  }

  const konteks: KonteksPelajaran = {
    courseTitle: course.title,
    lessonTitle: lesson.title,
    content: keTeks(lesson.content),
    transcript: (lesson.transcript ?? "").trim(),
    outline: course.sections.flatMap((s) => [
      s.title,
      ...s.lessons.map((l) => `  ${l.title}`),
    ]),
  }

  const { locale } = await getTranslations()
  const hasil = await jawabPertanyaan(konteks, riwayat, teksPertanyaan, locale)
  if (!hasil.ok) return { ok: false, error: hasil.error }

  // Percakapan disimpan dengan service role: tabelnya sengaja tidak punya
  // policy INSERT, seperti `notifications`. Hanya pemiliknya yang bisa
  // membacanya -- tidak ada policy baca untuk pengelola maupun superadmin.
  await admin.from("ai_chat_messages").insert([
    { learner_id: userId, lesson_id: lessonId, role: "user", content: teksPertanyaan },
    { learner_id: userId, lesson_id: lessonId, role: "assistant", content: hasil.data.jawaban },
  ])
  await admin.from("ai_usage").insert({
    user_id: userId,
    feature: "lesson-assistant",
    tokens: hasil.token,
    model: hasil.data.model,
  })

  return { ok: true, jawaban: hasil.data.jawaban, sisaHariIni: BATAS_HARIAN - terpakai - 1 }
}
