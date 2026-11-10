import { createClient } from "@/lib/supabase/server"
import {
  kenaikanPerModul,
  pilihPasangan,
  persen,
  persenPerModul,
  type JawabanTerukur,
  type PerkembanganKursus,
  type PerkembanganPeserta,
} from "@/lib/perkembangan"

/**
 * Pembacaan untuk layar Perkembangan.
 *
 * Keduanya dibaca dengan klien PEMANGGIL, bukan service role. Peserta melihat
 * jawabannya sendiri karena policy "own quiz responses readable"; mentor
 * melihat kursus miliknya karena policy admin menurunkan kepemilikan lewat
 * `owns_course()`. Tidak ada kewenangan baru yang diberikan berkas ini --
 * seluruhnya membaca ulang data yang memang sudah dikumpulkan untuk menilai.
 */

type KuisUkur = { id: string; measure_kind: "pretest" | "posttest" }

/** Kuis ukur sebuah kursus, plus urutan dan judul modulnya. */
async function kerangka(supabase: Awaited<ReturnType<typeof createClient>>, courseId: string) {
  const { data: sections, error } = await supabase
    .from("course_sections")
    .select("id, title, position, lessons(id)")
    .eq("course_id", courseId)
    .order("position", { ascending: true })

  if (error || !sections) return null

  const urutan = sections.map((s) => s.id as string)
  const judul = new Map(sections.map((s) => [s.id as string, s.title as string]))
  const lessonIds = sections.flatMap((s) => ((s.lessons ?? []) as { id: string }[]).map((l) => l.id))
  if (lessonIds.length === 0) return { urutan, judul, pretest: null, posttest: null }

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, measure_kind")
    .in("lesson_id", lessonIds)
    .not("measure_kind", "is", null)

  const daftar = (quizzes ?? []) as KuisUkur[]
  return {
    urutan,
    judul,
    pretest: daftar.find((q) => q.measure_kind === "pretest")?.id ?? null,
    posttest: daftar.find((q) => q.measure_kind === "posttest")?.id ?? null,
  }
}

type BarisJawaban = {
  is_correct: boolean | null
  question: { measured_section_id: string | null } | { measured_section_id: string | null }[] | null
  attempt: { quiz_id: string; learner_id: string; status: string } | { quiz_id: string; learner_id: string; status: string }[] | null
}

function satu<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

/**
 * Jawaban terkirim untuk sekumpulan kuis, sudah dipetakan ke modul.
 *
 * Soal yang `measured_section_id`-nya kosong dibuang di sini, bukan dianggap
 * milik modul pertama: menebak modulnya akan membuat satu baris di layar
 * salah tanpa ada yang bisa melihatnya.
 */
async function jawabanTerukur(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quizIds: string[]
): Promise<{ learnerId: string; quizId: string; jawab: JawabanTerukur }[]> {
  if (quizIds.length === 0) return []
  const { data, error } = await supabase
    .from("quiz_responses")
    .select(
      "is_correct, question:questions!inner(measured_section_id), attempt:quiz_attempts!inner(quiz_id, learner_id, status)"
    )
    .in("attempt.quiz_id", quizIds)
    .neq("attempt.status", "in_progress")

  if (error || !data) {
    if (error) console.error("jawabanTerukur gagal:", error.message)
    return []
  }

  const hasil: { learnerId: string; quizId: string; jawab: JawabanTerukur }[] = []
  for (const row of data as unknown as BarisJawaban[]) {
    const q = satu(row.question)
    const a = satu(row.attempt)
    if (!q?.measured_section_id || !a) continue
    hasil.push({
      learnerId: a.learner_id,
      quizId: a.quiz_id,
      jawab: { sectionId: q.measured_section_id, benar: row.is_correct === true },
    })
  }
  return hasil
}

/** Perkembangan peserta yang sedang masuk, pada satu kursus. */
export async function getPerkembanganPeserta(courseId: string): Promise<PerkembanganPeserta | null> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return null

  const k = await kerangka(supabase, courseId)
  if (!k || (!k.pretest && !k.posttest)) return null

  const quizIds = [k.pretest, k.posttest].filter((x): x is string => x !== null)
  // RLS sudah membatasi ke jawaban sendiri; penyaring learner_id di bawah
  // hanya menegaskannya, bukan menggantikannya.
  const semua = (await jawabanTerukur(supabase, quizIds)).filter((r) => r.learnerId === userId)

  const pre = persenPerModul(semua.filter((r) => r.quizId === k.pretest).map((r) => r.jawab))
  const post = persenPerModul(semua.filter((r) => r.quizId === k.posttest).map((r) => r.jawab))

  const total = (m: Map<string, { benar: number; total: number }>) => {
    let benar = 0
    let n = 0
    for (const v of m.values()) {
      benar += v.benar
      n += v.total
    }
    return n === 0 ? null : persen(benar, n)
  }

  return {
    sebelum: total(pre),
    sesudah: total(post),
    modul: kenaikanPerModul(pre, post, k.judul, k.urutan),
    adaPretest: k.pretest !== null,
    adaPosttest: k.posttest !== null,
  }
}

/**
 * Perkembangan seluruh kelas, tanpa nama.
 *
 * Yang dihitung hanya peserta yang punya KEDUA sisi; pretest yang dikerjakan
 * setelah orangnya mulai belajar dibuang, karena "sebelum" dan "sesudah"-nya
 * sudah tercampur (lihat quiz_attempts.after_learning_started).
 */
export async function getPerkembanganKursus(courseId: string): Promise<PerkembanganKursus | null> {
  const supabase = await createClient()

  const k = await kerangka(supabase, courseId)
  if (!k || !k.pretest || !k.posttest) return null

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("learner_id, quiz_id, after_learning_started")
    .in("quiz_id", [k.pretest, k.posttest])
    .neq("status", "in_progress")

  // Pemilihan pasangan dan ambangnya ada di fungsi murni, bukan di sini:
  // itu bagian yang paling perlu benar, dan di sana ia bisa diuji.
  const { sah, dibuang, cukup } = pilihPasangan(
    ((attempts ?? []) as { learner_id: string; quiz_id: string; after_learning_started: boolean }[]).map((a) => ({
      learnerId: a.learner_id,
      jenis: a.quiz_id === k.pretest ? ("pretest" as const) : ("posttest" as const),
      setelahMulai: a.after_learning_started,
    }))
  )
  const pasangan = sah.length

  if (!cukup) {
    return { pasangan, cukup: false, rataSebelum: 0, rataSesudah: 0, modul: [], dibuang }
  }

  const sahSet = new Set(sah)
  const semua = (await jawabanTerukur(supabase, [k.pretest, k.posttest])).filter((r) => sahSet.has(r.learnerId))

  const pre = persenPerModul(semua.filter((r) => r.quizId === k.pretest).map((r) => r.jawab))
  const post = persenPerModul(semua.filter((r) => r.quizId === k.posttest).map((r) => r.jawab))

  const ratakan = (m: Map<string, { benar: number; total: number }>) => {
    let benar = 0
    let n = 0
    for (const v of m.values()) {
      benar += v.benar
      n += v.total
    }
    return persen(benar, n)
  }

  return {
    pasangan,
    cukup: true,
    rataSebelum: ratakan(pre),
    rataSesudah: ratakan(post),
    modul: kenaikanPerModul(pre, post, k.judul, k.urutan),
    dibuang,
  }
}
