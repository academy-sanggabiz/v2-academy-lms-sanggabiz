/**
 * Gerbang pulang-pergi berkas kursus `.md`.
 *
 *   npm run test:markdown
 *
 * Berkas `.md` adalah jalur utama penyusunan kursus: tim memberikannya ke AI
 * mereka, AI bawaan menghasilkannya, dan penyunting mengekspornya. Apa pun
 * yang hilang di perjalanan hilang diam-diam -- tidak ada yang gagal, isinya
 * saja berkurang.
 *
 * Yang diuji bukan daftar aturannya, melainkan apa yang benar-benar kembali:
 * kursus disusun, ditulis ke `.md`, dibaca lagi, lalu dibandingkan.
 */
import { courseToMarkdown, parseCourseMarkdown } from "@/lib/course-markdown"

let lulus = 0
let gagal = 0
function cek(nama: string, benar: boolean, catatan = "") {
  if (benar) { lulus++; console.log(`ok    ${nama}`) }
  else { gagal++; console.log(`GAGAL ${nama}${catatan ? ` -- ${catatan}` : ""}`) }
}

const TEKS = "<h2>Judul besar</h2><p>Paragraf dengan <strong>tebal</strong> dan <em>miring</em>.</p><h3>Judul kecil</h3><ul><li>Butir satu</li><li>Butir dua</li></ul><blockquote><p>Kutipan.</p></blockquote>"
const INTERAKTIF = `<style>.materi-interaktif .kartu{border:1px solid #ddd}.materi-interaktif .sim:has(#a:checked) .x{display:block}</style>\n<div class="sim"><h2>Simulasi</h2><input type="radio" name="a" id="a"><label for="a">Pilih</label><div class="x">Akibat</div></div>`

const draf = {
  title: "Kursus uji", description: "Keterangan.", requirementsText: "", audienceText: "",
  level: "beginner", passingGrade: 70,
  sections: [{ id: "s1", title: "Modul 1", lessons: [
    { id: "l1", title: "Bacaan", content_type: "text", content: TEKS, video_url: null, transcript: null, duration_seconds: 300, resources: [], quiz: null },
    { id: "l2", title: "Simulasi", content_type: "interactive", content: INTERAKTIF, video_url: null, transcript: null, duration_seconds: 420, resources: [], quiz: null },
    { id: "l3", title: "Kuis", content_type: "quiz", content: null, video_url: null, transcript: null, duration_seconds: 300, resources: [],
      quiz: { id: "q1", title: "Kuis", pass_score: 70, max_attempts: 3, shuffle: false, is_assessment: false, time_limit_seconds: null,
        questions: [{ id: "qq1", type: "multiple_choice", prompt: "<p>Pertanyaan?</p>", points: 1, position: 0, allow_multiple: false, case_sensitive: false, explanation: "Penjelasannya.",
          options: [{ id: "o1", text: "Salah", is_correct: false, position: 0 }, { id: "o2", text: "Benar", is_correct: true, position: 1 }] }] } },
  ] }],
} as unknown as Parameters<typeof courseToMarkdown>[0]

const md = courseToMarkdown(draf)
const kembali = parseCourseMarkdown(md)
const l = kembali.draft.sections[0].lessons

console.log("--- BENTUK BERKAS ---")
cek("jumlah pelajaran utuh", l.length === 3, `${l.length}`)
cek("jenis interaktif ditulis", /tipe: interaktif/.test(md))
cek("materi interaktif dibungkus blok html", md.includes("```html"))

console.log("\n--- PELAJARAN TEKS ---")
const teks = l[0].content ?? ""
cek("h2 tetap h2", /<h2>Judul besar<\/h2>/.test(teks), teks.slice(0, 60))
cek("h3 tetap h3", /<h3>Judul kecil<\/h3>/.test(teks))
cek("tebal selamat", /<strong>tebal<\/strong>/.test(teks))
cek("miring selamat", /<em>miring<\/em>/.test(teks))
cek("daftar selamat", (teks.match(/<li>/g) ?? []).length === 2)
cek("kutipan selamat", /<blockquote>/.test(teks))

console.log("\n--- PELAJARAN INTERAKTIF ---")
const inter = l[1].content ?? ""
cek("jenisnya terbaca interaktif", l[1].content_type === "interactive")
cek("gaya penulis selamat", /<style>/.test(inter))
cek(":has() selamat", /:has\(#a:checked\)/.test(inter))
cek("radio selamat", inter.includes('type="radio"'))
cek("kembali persis sama", inter.trim() === INTERAKTIF.trim(), `${inter.length} vs ${INTERAKTIF.length}`)

console.log("\n--- KUIS ---")
const q = l[2].quiz
cek("soal selamat", (q?.questions.length ?? 0) === 1)
cek("jawaban benar ditandai", q?.questions[0]?.options.some((o) => o.is_correct && o.text === "Benar") === true)
cek("penjelasan selamat", q?.questions[0]?.explanation === "Penjelasannya.")

console.log("\n--- TIDAK ADA YANG HILANG DIAM-DIAM ---")
cek("tanpa peringatan tak terduga", kembali.report.warnings.length === 0, kembali.report.warnings.join(" | "))

console.log(`\n${lulus} lulus, ${gagal} gagal`)
process.exit(gagal > 0 ? 1 : 0)
