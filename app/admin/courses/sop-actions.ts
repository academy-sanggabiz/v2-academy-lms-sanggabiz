"use server"

import mammoth from "mammoth"
import { extractText, getDocumentProxy } from "unpdf"

import { requireAdmin } from "@/lib/auth/require-admin"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { aiAktif } from "@/lib/ai/client"
import { buatKerangka, rakitMarkdown, tulisModul, type KerangkaKursus } from "@/lib/ai/sop"
import { parseCourseMarkdown, type ParsedCourse } from "@/lib/course-markdown"

/**
 * F1: dari dokumen apa pun menjadi draf kursus.
 *
 * Dua langkah terpisah dan sengaja dipisah, bukan satu tombol:
 *
 *   1. `buatKerangkaDariSop` -- unggah berkas, ekstrak teks, buat KERANGKA.
 *      Mentor melihat daftar modul dan pelajaran sebelum satu kalimat materi
 *      pun ditulis. Kerangka yang salah ditolak di sini, bukan setelah enam
 *      panggilan penulisan dibayar.
 *   2. `tulisKursusDariKerangka` -- menulis isi tiap modul, merakitnya jadi
 *      satu berkas Markdown, lalu menyerahkannya ke `parseCourseMarkdown`.
 *
 * Tidak ada jalur tulis baru ke basis data kursus. Hasil akhirnya persis
 * seperti berkas `.md` yang diunggah manusia, lengkap dengan seluruh pagar
 * impor yang sudah ada (docs/STANDAR-IMPOR-KURSUS.md §5 dan §8).
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

const MAKS_BERKAS = 10 * 1024 * 1024
const MIN_HURUF = 200

/**
 * Pagar yang sama dengan impor Markdown: kursus milik pemanggil, dan belum
 * punya peserta. Ditegakkan di server, bukan dengan menyembunyikan tombol --
 * server action bisa dipanggil langsung lewat jaringan.
 */
async function pastikanBolehDiisi(courseId: string): Promise<{ error: string } | { error?: undefined }> {
  const supabase = await createClient()

  const { data: course } = await supabase.from("courses").select("id").eq("id", courseId).maybeSingle()
  if (!course) return { error: "Kursus tidak ditemukan atau bukan milik Anda." }

  const { count, error } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)

  if (error) {
    console.error("pastikanBolehDiisi gagal menghitung peserta:", error.message)
    return { error: "Gagal memeriksa peserta kursus. Coba lagi." }
  }
  if ((count ?? 0) > 0) {
    return {
      error:
        `Kursus ini sudah punya ${count} pendaftaran, jadi isinya tidak bisa diganti. ` +
        "Buat kursus baru, lalu susun dari SOP di sana.",
    }
  }
  return {}
}

const JENIS_WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

/**
 * Teks dari Word atau PDF, atau dari berkas teks apa adanya.
 *
 * Word ikut didukung sejak janjinya berubah dari "SOP" menjadi "dokumen apa
 * pun": itu format pertama yang dicoba orang, dan nama yang luas dengan
 * format yang sempit adalah janji yang tidak ditepati.
 *
 * `.doc` lama (bukan `.docx`) sengaja tidak didukung -- formatnya biner
 * warisan yang perlu pustaka tersendiri, dan Word sendiri sudah lama
 * menyimpan sebagai `.docx`.
 */
async function ambilTeks(file: File): Promise<{ teks: string } | { error: string }> {
  const buf = new Uint8Array(await file.arrayBuffer())
  const nama = file.name.toLowerCase()

  if (file.type === JENIS_WORD || nama.endsWith(".docx")) {
    try {
      // extractRawText, bukan convertToHtml: yang dibutuhkan model hanya
      // kalimatnya. HTML Word penuh markup gaya yang memakan tempat di
      // prompt tanpa menambah satu pun informasi.
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buf) })
      return { teks: value }
    } catch (e) {
      console.error("gagal membaca Word:", e)
      return { error: "Berkas Word-nya tidak terbaca. Pastikan formatnya .docx, bukan .doc lama." }
    }
  }

  if (file.type === "application/pdf" || nama.endsWith(".pdf")) {
    try {
      const pdf = await getDocumentProxy(buf)
      // `mergePages: true` membuat `text` sebuah string; tipenya tetap
      // dilonggarkan supaya kode ini tidak pecah kalau unpdf mengubahnya.
      const { text } = await extractText(pdf, { mergePages: true })
      const gabung: string = Array.isArray(text) ? (text as string[]).join("\n") : String(text)
      return { teks: gabung }
    } catch (e) {
      console.error("gagal membaca PDF:", e)
      /*
       * Dua sebab yang sangat berbeda, dan pesan yang sama untuk keduanya
       * membuang waktu orang berikutnya. `unpdf` memuat PDF.js yang memakai
       * global `Iterator` -- baru ada sejak Node 22. Produksi menjalankan
       * Node 24, jadi ini hanya muncul di mesin pengembang yang masih
       * Node 20, dan di sana "PDF-nya hasil pindai" adalah tebakan yang
       * salah arah.
       */
      const pesan = e instanceof Error ? e.message : String(e)
      if (/Iterator is not defined|PDF\.js could not be resolved/.test(pesan)) {
        return { error: "Pembaca PDF memerlukan Node 22 atau lebih baru di server ini." }
      }
      return { error: "Berkas PDF-nya tidak terbaca. Coba simpan ulang sebagai PDF teks, bukan hasil pindai." }
    }
  }

  return { teks: new TextDecoder().decode(buf) }
}

export type HasilKerangka = {
  kerangka: KerangkaKursus
  /** Disimpan di server lalu dipakai lagi pada langkah 2, supaya dokumennya
   *  tidak perlu diunggah dua kali. */
  generationId: string
}

export async function buatKerangkaDariSop(
  courseId: string,
  formData: FormData
): Promise<ActionResult<HasilKerangka>> {
  let adminId: string
  try {
    const profil = await requireAdmin()
    adminId = profil.userId
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  if (!aiAktif()) return { ok: false, error: "Fitur AI belum diaktifkan." }

  const izin = await pastikanBolehDiisi(courseId)
  if (izin.error) return { ok: false, error: izin.error }

  const file = formData.get("berkas")
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Pilih berkas SOP dulu." }
  if (file.size > MAKS_BERKAS) {
    return { ok: false, error: "Berkas lebih dari 10 MB. Pakai dokumen yang lebih ringkas." }
  }

  const hasilTeks = await ambilTeks(file)
  if ("error" in hasilTeks) return { ok: false, error: hasilTeks.error }

  // Spasi tak-putus (U+00A0) sering terbawa dari PDF dan membuat hitungan
  // huruf di bawah terlihat besar padahal halamannya kosong.
  const sop = hasilTeks.teks.replace(/ /g, " ").trim()
  if (sop.length < MIN_HURUF) {
    return {
      ok: false,
      error: "Dokumennya hampir tidak berisi teks. PDF hasil pindai tidak bisa dibaca; gunakan dokumen teks.",
    }
  }

  const kerangka = await buatKerangka(sop, file.name)
  if (!kerangka.ok) return { ok: false, error: kerangka.error }

  /*
   * Dokumen dan teksnya disimpan dengan service role.
   *
   * Bucket 'sop-documents' PRIVAT dan tidak punya policy select sama sekali
   * (migrasi 20261110040000): SOP adalah dokumen internal perusahaan
   * pelanggan. Teks hasil ekstraksi ikut disimpan di baris generasi supaya
   * langkah 2 tidak perlu mengunggah ulang.
   */
  const admin = createAdminClient()
  const jalur = `${adminId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`
  const { error: unggahError } = await admin.storage
    .from("sop-documents")
    .upload(jalur, await file.arrayBuffer(), { contentType: file.type || "application/octet-stream" })
  if (unggahError) console.error("gagal menyimpan dokumen SOP:", unggahError.message)

  const { data: generasi, error: generasiError } = await admin
    .from("ai_course_generations")
    .insert({
      created_by: adminId,
      course_id: courseId,
      source_name: file.name,
      context: { jalur: unggahError ? null : jalur, sop },
      outline: kerangka.data,
      status: "kerangka",
      model: process.env.AI_MODEL ?? null,
    })
    .select("id")
    .single()

  if (generasiError || !generasi) {
    console.error("gagal mencatat generasi:", generasiError?.message)
    return { ok: false, error: "Gagal menyimpan kerangka. Coba lagi." }
  }

  await admin.from("ai_usage").insert({
    user_id: adminId,
    feature: "sop_kerangka",
    tokens: kerangka.token,
  })

  return { ok: true, data: { kerangka: kerangka.data, generationId: generasi.id } }
}

export async function tulisKursusDariKerangka(
  courseId: string,
  generationId: string
): Promise<ActionResult<{ parsed: ParsedCourse; markdown: string }>> {
  let adminId: string
  try {
    const profil = await requireAdmin()
    adminId = profil.userId
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  if (!aiAktif()) return { ok: false, error: "Fitur AI belum diaktifkan." }

  const izin = await pastikanBolehDiisi(courseId)
  if (izin.error) return { ok: false, error: izin.error }

  const admin = createAdminClient()
  // created_by disaring eksplisit: service role menembus RLS, jadi tanpa ini
  // satu id generasi milik mentor lain sudah cukup untuk membaca SOP-nya.
  const { data: generasi } = await admin
    .from("ai_course_generations")
    .select("id, outline, context, course_id")
    .eq("id", generationId)
    .eq("created_by", adminId)
    .eq("course_id", courseId)
    .maybeSingle()

  if (!generasi?.outline) return { ok: false, error: "Kerangkanya tidak ditemukan. Unggah ulang dokumennya." }

  const kerangka = generasi.outline as KerangkaKursus
  const sop = ((generasi.context as { sop?: string } | null)?.sop ?? "").trim()
  if (!sop) return { ok: false, error: "Teks dokumennya tidak tersimpan. Unggah ulang dokumennya." }

  const potongan: string[] = []
  let token = 0
  for (const modul of kerangka.modul) {
    const hasil = await tulisModul(sop, kerangka, modul)
    if (!hasil.ok) return { ok: false, error: hasil.error }
    potongan.push(hasil.data)
    token += hasil.token
  }

  const markdown = rakitMarkdown(kerangka, potongan)

  await admin.from("ai_course_generations").update({ markdown, status: "selesai" }).eq("id", generationId)
  await admin.from("ai_usage").insert({ user_id: adminId, feature: "sop_tulis", tokens: token })

  // Jalur yang sama persis dengan berkas .md buatan manusia.
  return { ok: true, data: { parsed: parseCourseMarkdown(markdown), markdown } }
}
