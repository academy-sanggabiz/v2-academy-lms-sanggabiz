import { normalizeLevel } from "@/lib/course-level"
import { newId, type CourseDraft, type DraftLesson, type DraftQuestion, type DraftSection } from "@/lib/course-draft"
import type { AuthorableQuestionType, LessonContentType } from "@/lib/courses"
import {
  htmlToMarkdown,
  looksLikeHtml,
  markdownToHtml,
  markdownToPlainText,
} from "@/lib/course-markdown/inline"

/**
 * Format berkas kursus: `sanggabiz-course/v1`.
 *
 * **Kenapa Markdown, bukan JSON.** Berkas ini ditulis model bahasa atas
 * perintah penyusun kursus, lalu dibaca dan sering diperbaiki manusia sebelum
 * diimpor. Model jauh lebih andal menjaga struktur Markdown daripada
 * menghasilkan JSON panjang yang tetap valid sampai kurung terakhir, dan yang
 * lebih penting: kalau modelnya keliru sedikit, penyusun kursus bisa
 * memperbaikinya sendiri dengan mata telanjang. JSON yang rusak hanya bisa
 * diperbaiki orang yang mengerti kode.
 *
 * **Kenapa penanda eksplisit, bukan tingkat heading.** `## Modul:` dan
 * `### Pelajaran:` dikenali dari awalannya, bukan dari dalamnya berapa pagar.
 * Model sering menggeser tingkat heading satu tingkat tanpa alasan; kalau
 * strukturnya bergantung pada itu, satu geseran membuat seluruh berkas gagal
 * dibaca.
 *
 * **Kenapa `- [x]` untuk jawaban benar.** Sintaks daftar tugas sudah dikenal
 * setiap model dan setiap penyunting Markdown. Alternatif seperti menandai
 * dengan tanda bintang atau menulis "jawaban: B" jauh lebih sering salah.
 *
 * Yang sengaja **tidak** ikut di v1: gambar sampul, harga, prasyarat,
 * pengaturan sertifikat, dan berkas pendukung. Semuanya tidak bisa diwakili
 * teks, atau berisiko kalau bisa disetel dari berkas impor. Semuanya tetap
 * diatur di editor.
 */

export const COURSE_MARKDOWN_FORMAT = "sanggabiz-course/v1"

export type ParseReport = {
  /** Hal yang gagal dibaca atau dibetulkan sendiri, untuk ditampilkan ke penyusun. */
  warnings: string[]
  sections: number
  lessons: number
  questions: number
}

export type ParsedCourse = {
  draft: Pick<
    CourseDraft,
    "title" | "description" | "requirementsText" | "audienceText" | "level" | "passingGrade" | "sections"
  >
  report: ParseReport
}

const TYPE_TO_MD: Record<LessonContentType, string> = {
  text: "teks",
  video: "video",
  ppt: "slide",
  quiz: "kuis",
  mixed: "teks",
}

const MD_TO_TYPE: Record<string, LessonContentType> = {
  teks: "text",
  text: "text",
  video: "video",
  slide: "ppt",
  ppt: "ppt",
  kuis: "quiz",
  quiz: "quiz",
  // Studi kasus juga pelajaran kuis; bedanya ada pada bendera is_assessment.
  "studi-kasus": "quiz",
  "studi kasus": "quiz",
  assessment: "quiz",
}

/** Jenis yang menandai kuis sebagai studi kasus, bukan kuis biasa. */
const ASSESSMENT_KEYS = new Set(["studi-kasus", "studi kasus", "assessment"])

// ---------------------------------------------------------------- ekspor

export function courseToMarkdown(draft: CourseDraft): string {
  const out: string[] = []

  out.push("---")
  out.push(`format: ${COURSE_MARKDOWN_FORMAT}`)
  out.push(`judul: ${draft.title || ""}`)
  // Ditulis kembali dalam kosakata panduan (Pemula/Menengah/Lanjutan) supaya
  // berkas .md tetap enak dibaca penyusun, sementara kolomnya tetap kanonis.
  out.push(
    `tingkat: ${
      { beginner: "Pemula", intermediate: "Menengah", advanced: "Lanjutan" }[
        normalizeLevel(draft.level) ?? "beginner"
      ]
    }`
  )
  out.push(`nilai_kelulusan: ${draft.passingGrade}`)
  out.push("---", "")

  // Deskripsi disimpan sebagai teks polos (textarea di BasicInfoTab, dirender
  // dengan whitespace-pre-line), jadi ia ditulis apa adanya -- bukan lewat
  // htmlToMarkdown, yang hanya berlaku untuk bidang berisi HTML Tiptap.
  out.push("## Deskripsi", "", draft.description.trim(), "")

  if (draft.requirementsText.trim()) {
    out.push("## Persyaratan", "")
    for (const line of draft.requirementsText.split("\n")) {
      if (line.trim()) out.push(`- ${line.trim()}`)
    }
    out.push("")
  }

  if (draft.audienceText.trim()) {
    out.push("## Untuk siapa", "")
    for (const line of draft.audienceText.split("\n")) {
      if (line.trim()) out.push(`- ${line.trim()}`)
    }
    out.push("")
  }

  for (const section of draft.sections) {
    out.push(`## Modul: ${section.title}`, "")

    for (const lesson of section.lessons) {
      out.push(`### Pelajaran: ${lesson.title}`)
      const typeLabel =
        lesson.content_type === "quiz" && lesson.quiz?.is_assessment
          ? "studi-kasus"
          : TYPE_TO_MD[lesson.content_type]
      out.push(`tipe: ${typeLabel}`)
      if (lesson.video_url) out.push(`video: ${lesson.video_url}`)
      if (lesson.duration_seconds) out.push(`durasi: ${Math.round(lesson.duration_seconds / 60)} menit`)
      if (lesson.content_type === "quiz" && lesson.quiz) {
        out.push(`nilai_lulus: ${lesson.quiz.pass_score}`)
      }
      out.push("")

      const body = htmlToMarkdown(lesson.content ?? "")
      if (body) out.push(body, "")

      if (lesson.transcript?.trim()) {
        out.push("#### Transkrip", "", lesson.transcript.trim(), "")
      }

      for (const question of lesson.quiz?.questions ?? []) {
        out.push("#### Soal", "")
        out.push(htmlToMarkdown(question.prompt) || "(tanpa pertanyaan)", "")
        for (const option of question.options) {
          out.push(`- [${option.is_correct ? "x" : " "}] ${option.text}`)
        }
        if (question.options.length > 0) out.push("")
        if (question.explanation.trim()) {
          out.push(`> Penjelasan: ${question.explanation.trim()}`, "")
        }
      }
    }
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n"
}

// ---------------------------------------------------------------- impor

type Attrs = Record<string, string>

function parseAttrLines(lines: string[], from: number): { attrs: Attrs; next: number } {
  const attrs: Attrs = {}
  let i = from
  while (i < lines.length) {
    const line = lines[i].trim()
    if (line === "") {
      i++
      continue
    }
    const match = /^([a-z_]+)\s*:\s*(.*)$/i.exec(line)
    // Hanya baris atribut yang dikenali; begitu bertemu teks biasa atau
    // heading, blok atribut dianggap selesai.
    if (!match || line.startsWith("#") || line.startsWith("-") || line.startsWith(">")) break
    attrs[match[1].toLowerCase()] = match[2].trim()
    i++
  }
  return { attrs, next: i }
}

function minutesToSeconds(value: string | undefined): number | null {
  if (!value) return null
  const match = /(\d+)/.exec(value)
  if (!match) return null
  return Number(match[1]) * 60
}

function emptyQuiz(passScore: number, isAssessment = false) {
  return {
    id: newId(),
    pass_score: passScore,
    max_attempts: null,
    shuffle: true,
    draw_count: null,
    is_assessment: isAssessment,
    // Impor `.md` tidak membuat kuis ukur. Formatnya tidak punya cara
    // menyebut modul per soal, dan pretest tanpa pemetaan modul tidak bisa
    // dipakai layar Perkembangan -- lebih baik diatur di editor setelah
    // impor daripada diimpor setengah jadi. Lihat STANDAR-IMPOR-KURSUS.md.
    measure_kind: null,
    questions: [] as DraftQuestion[],
  }
}

/**
 * Membaca berkas `.md` menjadi draf kursus.
 *
 * Tidak pernah melempar. Apa pun yang tidak dikenali dicatat sebagai peringatan
 * dan dilewati, karena berkas ini datang dari model bahasa: setengah berhasil
 * dengan daftar jelas apa yang terlewat jauh lebih berguna daripada satu pesan
 * "format salah" yang membuat penyusun kursus harus menebak.
 */
export function parseCourseMarkdown(raw: string): ParsedCourse {
  const warnings: string[] = []
  const text = raw.replace(/\r\n/g, "\n")

  let body = text
  const front: Attrs = {}
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(text)
  if (fm) {
    for (const line of fm[1].split("\n")) {
      const match = /^([a-z_]+)\s*:\s*(.*)$/i.exec(line.trim())
      if (match) front[match[1].toLowerCase()] = match[2].trim()
    }
    body = text.slice(fm[0].length)
  } else {
    warnings.push("Berkas tidak punya blok frontmatter di bagian atas; judul dan tingkat diambil dari isi bila ada.")
  }

  if (front.format && front.format !== COURSE_MARKDOWN_FORMAT) {
    warnings.push(
      `Berkas menyebut format "${front.format}", sedangkan yang dikenali "${COURSE_MARKDOWN_FORMAT}". Hasil bacanya mungkin tidak lengkap.`
    )
  }

  const lines = body.split("\n")
  const sections: DraftSection[] = []
  let currentSection: DraftSection | null = null
  let currentLesson: DraftLesson | null = null
  let currentQuestion: DraftQuestion | null = null
  /*
   * Apakah baris berikutnya masih lanjutan kutipan "> Penjelasan:".
   *
   * Penjelasan ditulis sebagai kutipan markdown, dan kutipan markdown boleh
   * membungkus ke beberapa baris -- contoh di panduan unduhan sendiri
   * membungkusnya ke tiga baris. Tanpa penanda ini, hanya baris PERTAMA yang
   * terbaca sebagai penjelasan dan sisanya jatuh ke teks soal sebagai
   * <blockquote>, terpotong di tengah kalimat. Itulah butir D di
   * docs/BACKLOG.md: dua dari tiga soal sebuah kursus draf membawa potongan
   * penjelasan di dalam pertanyaannya.
   */
  let lanjutanPenjelasan = false

  let bucket: "none" | "description" | "requirements" | "audience" | "lesson" | "transcript" | "question" = "none"
  const buffers = { description: [] as string[], requirements: [] as string[], audience: [] as string[] }
  let lessonBody: string[] = []
  let transcript: string[] = []
  let questionBody: string[] = []

  const finishQuestion = () => {
    if (!currentQuestion) return
    currentQuestion.prompt = markdownToHtml(questionBody.join("\n").trim())
    const quiz = currentLesson?.quiz
    const firstLineOf = () => questionBody.map((l) => l.trim()).find(Boolean) ?? "(tanpa teks)"

    if (currentQuestion.options.length === 0) {
      /*
       * Soal tanpa pilihan adalah soal esai, dan esai hanya sah di dalam studi
       * kasus -- `validateQuizzes` menolak esai di kuis biasa, dan menolak
       * studi kasus yang berisi lebih dari satu soal. Parser harus mematuhi
       * aturan yang sama: menghasilkan sesuatu yang editor tidak akan pernah
       * mau simpan jauh lebih buruk daripada melewatkannya dengan penjelasan.
       */
      if (!quiz?.is_assessment) {
        const line = firstLineOf()
        warnings.push(
          `Soal "${line.slice(0, 50)}${line.length > 50 ? "…" : ""}" tidak punya pilihan jawaban. Soal esai hanya bisa dipakai pada pelajaran bertipe "studi-kasus"; soal dilewati.`
        )
        currentQuestion = null
        questionBody = []
        return
      }
      if (quiz.questions.length > 0) {
        warnings.push("Studi kasus hanya boleh berisi satu soal; soal berikutnya dilewati.")
        currentQuestion = null
        questionBody = []
        return
      }
      currentQuestion.type = "essay"
    } else if (quiz?.is_assessment) {
      warnings.push(
        "Studi kasus harus berupa satu soal esai tanpa pilihan jawaban; soal berpilihan dilewati."
      )
      currentQuestion = null
      questionBody = []
      return
    } else if (!currentQuestion.options.some((o) => o.is_correct)) {
      // Baris pertama yang berisi: baris sesudah "#### Soal" hampir selalu
      // kosong, dan peringatan yang tidak menyebut soal yang mana tidak
      // menolong siapa pun.
      const firstLine = firstLineOf()
      warnings.push(
        `Soal "${firstLine.slice(0, 50)}${firstLine.length > 50 ? "…" : ""}" tidak menandai jawaban benar dengan [x]; soal dilewati.`
      )
      currentQuestion = null
      questionBody = []
      return
    }
    if (currentLesson?.quiz) currentLesson.quiz.questions.push(currentQuestion)
    currentQuestion = null
    questionBody = []
  }

  const finishLesson = () => {
    if (!currentLesson) return
    finishQuestion()
    currentLesson.content = markdownToHtml(lessonBody.join("\n").trim()) || null
    currentLesson.transcript = transcript.join("\n").trim() || null
    if (currentLesson.content_type === "quiz" && (currentLesson.quiz?.questions.length ?? 0) === 0) {
      warnings.push(`Pelajaran kuis "${currentLesson.title}" tidak punya satu soal pun.`)
    }
    currentSection?.lessons.push(currentLesson)
    currentLesson = null
    lessonBody = []
    transcript = []
  }

  const finishSection = () => {
    finishLesson()
    if (currentSection) sections.push(currentSection)
    currentSection = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    const sectionHeading = /^#{1,3}\s*Modul\s*:\s*(.+)$/i.exec(trimmed)
    if (sectionHeading) {
      finishSection()
      currentSection = { id: newId(), title: sectionHeading[1].trim(), lessons: [] }
      bucket = "none"
      continue
    }

    const lessonHeading = /^#{2,4}\s*Pelajaran\s*:\s*(.+)$/i.exec(trimmed)
    if (lessonHeading) {
      finishLesson()
      if (!currentSection) {
        // Pelajaran sebelum modul mana pun: dibuatkan modul penampung alih-alih
        // dibuang, karena isinya tetap berguna.
        currentSection = { id: newId(), title: "Modul 1", lessons: [] }
        warnings.push("Ada pelajaran sebelum modul pertama; dimasukkan ke modul bernama \"Modul 1\".")
      }
      const { attrs, next } = parseAttrLines(lines, i + 1)
      i = next - 1

      const typeKey = (attrs.tipe ?? attrs.type ?? "teks").toLowerCase()
      const contentType = MD_TO_TYPE[typeKey]
      if (!contentType) {
        warnings.push(`Jenis pelajaran "${typeKey}" tidak dikenali pada "${lessonHeading[1].trim()}"; dianggap teks.`)
      }
      const resolved: LessonContentType = contentType ?? "text"
      const isAssessment = ASSESSMENT_KEYS.has(typeKey)
      const passScore = Number(attrs.nilai_lulus ?? attrs.pass_score ?? front.nilai_kelulusan ?? 70) || 70

      currentLesson = {
        id: newId(),
        title: lessonHeading[1].trim(),
        content_type: resolved,
        video_url: attrs.video ?? attrs.video_url ?? null,
        content: null,
        transcript: null,
        duration_seconds: minutesToSeconds(attrs.durasi ?? attrs.duration),
        resources: [],
        quiz: resolved === "quiz" ? emptyQuiz(passScore, isAssessment) : null,
      }
      bucket = "lesson"
      continue
    }

    if (/^#{3,5}\s*Transkrip\s*$/i.test(trimmed)) {
      bucket = "transcript"
      continue
    }

    if (/^#{3,5}\s*Soal\s*$/i.test(trimmed)) {
      finishQuestion()
      if (!currentLesson) {
        warnings.push("Ada soal di luar pelajaran mana pun; dilewati.")
        bucket = "none"
        continue
      }
      if (!currentLesson.quiz) {
        currentLesson.quiz = emptyQuiz(Number(front.nilai_kelulusan ?? 70) || 70)
        currentLesson.content_type = "quiz"
      }
      lanjutanPenjelasan = false
      currentQuestion = {
        id: newId(),
        type: "multiple_choice" as AuthorableQuestionType,
        prompt: "",
        allow_multiple: false,
        case_sensitive: false,
        explanation: "",
        measured_section_id: null,
        options: [],
      }
      bucket = "question"
      continue
    }

    if (/^#{1,3}\s*Deskripsi\s*$/i.test(trimmed)) {
      finishSection()
      bucket = "description"
      continue
    }
    if (/^#{1,3}\s*Persyaratan\s*$/i.test(trimmed)) {
      finishSection()
      bucket = "requirements"
      continue
    }
    if (/^#{1,3}\s*Untuk siapa.*$/i.test(trimmed)) {
      finishSection()
      bucket = "audience"
      continue
    }

    if (bucket === "question" && currentQuestion) {
      const option = /^[-*]\s*\[([ xX])\]\s*(.+)$/.exec(trimmed)
      if (option) {
        currentQuestion.options.push({
          id: newId(),
          text: option[2].trim(),
          is_correct: option[1].toLowerCase() === "x",
        })
        continue
      }
      const explanation = /^>\s*(?:Penjelasan|Explanation)\s*:\s*(.+)$/i.exec(trimmed)
      if (explanation) {
        // Penjelasan disimpan sebagai teks biasa, bukan HTML: ia dirender
        // sebagai teks, dan menyanitasinya pernah menghapus kalimat setelah
        // tanda "<" secara permanen.
        currentQuestion.explanation = explanation[1].trim()
        lanjutanPenjelasan = true
        continue
      }

      if (lanjutanPenjelasan) {
        const lanjutan = /^>\s?(.*)$/.exec(trimmed)
        if (lanjutan) {
          const isi = lanjutan[1].trim()
          // "> " kosong adalah pergantian paragraf di dalam kutipan, bukan
          // akhir kutipannya.
          currentQuestion.explanation = isi
            ? `${currentQuestion.explanation} ${isi}`.trimStart()
            : `${currentQuestion.explanation}\n\n`
          continue
        }
        // Baris apa pun yang bukan kutipan mengakhiri penjelasannya --
        // termasuk baris kosong, persis seperti kutipan markdown biasa.
        lanjutanPenjelasan = false
      }

      questionBody.push(line)
      continue
    }

    if (bucket === "description") buffers.description.push(line)
    else if (bucket === "requirements") buffers.requirements.push(line)
    else if (bucket === "audience") buffers.audience.push(line)
    else if (bucket === "transcript") transcript.push(line)
    else if (bucket === "lesson") lessonBody.push(line)
  }

  finishSection()

  const bulletsToLines = (input: string[]): string =>
    input
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*+]\s*/, ""))
      .join("\n")

  const title = front.judul ?? front.title ?? ""
  if (!title.trim()) warnings.push("Judul kursus tidak ditemukan di frontmatter.")
  if (sections.length === 0) warnings.push("Tidak ada satu pun modul yang terbaca.")

  /*
   * Jaring pengaman untuk satu kelas kesalahan yang sudah pernah terjadi:
   * bidang yang disunting sebagai teks polos terisi HTML, sehingga tag-nya
   * tampil mentah di layar. Diperiksa di sini supaya kalau formatnya berubah
   * lagi suatu hari, kesalahannya ketahuan sebagai peringatan -- bukan sebagai
   * "<p>" yang dibaca peserta.
   */
  const plainFields: [string, string][] = [
    ["Deskripsi", markdownToPlainText(buffers.description.join("\n").trim())],
    ["Persyaratan", bulletsToLines(buffers.requirements)],
    ["Untuk siapa", bulletsToLines(buffers.audience)],
  ]
  for (const [label, value] of plainFields) {
    if (looksLikeHtml(value)) {
      warnings.push(`Bagian "${label}" memuat tag HTML; tulis sebagai teks biasa, bukan HTML.`)
    }
  }
  for (const section of sections) {
    for (const lesson of section.lessons) {
      if (lesson.transcript && looksLikeHtml(lesson.transcript)) {
        warnings.push(`Transkrip pelajaran "${lesson.title}" memuat tag HTML; transkrip ditulis sebagai teks biasa.`)
      }
    }
  }

  const questions = sections.reduce(
    (n, s) => n + s.lessons.reduce((m, l) => m + (l.quiz?.questions.length ?? 0), 0),
    0
  )
  const lessons = sections.reduce((n, s) => n + s.lessons.length, 0)

  return {
    draft: {
      title: title.trim(),
      description: markdownToPlainText(buffers.description.join("\n").trim()),
      requirementsText: bulletsToLines(buffers.requirements),
      audienceText: bulletsToLines(buffers.audience),
      // Dinormalkan, bukan disimpan apa adanya: panduan .md menyuruh penyusun
      // menulis "Pemula"/"Menengah"/"Lanjutan", sedangkan kolomnya menyimpan
      // kosakata kanonis beginner/intermediate/advanced (lib/course-level.ts).
      // Tanpa pemetaan ini setiap impor mengembalikan lagi kosakata lama dan
      // saringan tingkat di katalog publik pecah dua.
      level: normalizeLevel(front.tingkat ?? front.level) ?? "beginner",
      passingGrade: Math.min(100, Math.max(0, Number(front.nilai_kelulusan ?? 70) || 70)),
      sections,
    },
    report: { warnings, sections: sections.length, lessons, questions },
  }
}
