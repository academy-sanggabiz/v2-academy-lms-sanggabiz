"use server"

import mammoth from "mammoth"
import { extractText, getDocumentProxy } from "unpdf"

import { requireAdmin } from "@/lib/auth/require-admin"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { aiAktif } from "@/lib/ai/client"
import {
  buatKerangka,
  periksaKerangka,
  rakitMarkdown,
  revisiKerangka,
  tulisModul,
  type KerangkaKursus,
} from "@/lib/ai/sop"
import { parseCourseMarkdown, type ParsedCourse } from "@/lib/course-markdown"
import { BATAS_TOKEN_SOP_HARIAN, FITUR_SOP, formatToken } from "@/lib/ai-usage"
import { tokenHariIni } from "@/lib/ai-usage-server"

/**
 * F1: dari dokumen apa pun menjadi draf kursus.
 *
 * == Satu modul per panggilan, bukan satu panggilan panjang ==
 *
 * Penulisan enam modul memakan sekitar satu menit. Dikerjakan dalam satu
 * permintaan, layar hanya bisa menampilkan kata "Menulis..." dan menutup
 * dialog berarti kehilangan seluruhnya. Sekarang tiap panggilan menulis SATU
 * modul lalu menyimpannya ke baris pekerjaan (`ai_course_generations`).
 *
 * Tiga akibat, dan ketiganya diminta pemilik setelah pemakaian pertama:
 *
 *   * **Persennya nyata.** modul_selesai / modul_total adalah hitungan, bukan
 *     pengatur waktu yang mengarang kemajuan.
 *   * **Boleh ditinggal.** Keadaan ada di basis data, bukan di ingatan
 *     komponen, jadi layar bisa ditutup dan dibuka lagi.
 *   * **Bisa dilanjutkan.** Pekerjaan yang terputus di modul keempat
 *     diteruskan dari modul kelima, bukan diulang dari nol. Fungsi tanpa
 *     server punya batas waktu; pekerjaan satu menit yang tidak bisa
 *     dilanjutkan adalah pekerjaan yang sesekali hilang tanpa penjelasan.
 *
 * Tidak ada jalur tulis baru ke basis data kursus. Hasil akhirnya tetap
 * berkas Markdown yang dibaca `parseCourseMarkdown`, lengkap dengan seluruh
 * pagar impor yang sudah ada (docs/STANDAR-IMPOR-KURSUS.md §5 dan §8).
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

const MAKS_BERKAS = 10 * 1024 * 1024
const MIN_HURUF = 200
const MAKS_PERMINTAAN = 500

/**
 * Pagar biaya harian.
 *
 * Fitur ini sebelumnya sama sekali tanpa batas, dan justru ia yang paling
 * mahal: satu kursus menghabiskan sekitar 28 ribu token, jauh di atas satu
 * pertanyaan ke asisten pelajaran. Seseorang bisa menekan tombolnya berulang
 * kali tanpa ada yang menghentikan.
 *
 * Dihitung dengan TOKEN, bukan jumlah panggilan. Batas harian asisten
 * pelajaran menghitung pertanyaan, sehingga satu pertanyaan pendek dan satu
 * pertanyaan yang membakar dua ribu token dihitung sama -- kekeliruan yang
 * tidak diulang di sini.
 *
 * Diperiksa SEBELUM tiap panggilan AI, bukan sekali di awal: penulisan satu
 * kursus adalah tujuh panggilan terpisah, dan memeriksa sekali di awal
 * berarti batasnya bisa dilewati sejauh satu kursus penuh.
 */
async function pagarToken(adminId: string): Promise<{ error?: string }> {
  const terpakai = await tokenHariIni(adminId, FITUR_SOP)
  if (terpakai >= BATAS_TOKEN_SOP_HARIAN) {
    return {
      error:
        `Jatah AI hari ini sudah habis (${formatToken(terpakai, "id")} token). ` +
        "Coba lagi besok, atau minta pengelola menaikkan batasnya.",
    }
  }
  return {}
}

/** Keadaan satu pekerjaan, sebagaimana dilihat layar. */
export type Pekerjaan = {
  id: string
  namaBerkas: string
  kerangka: KerangkaKursus | null
  modulTotal: number
  modulSelesai: number
  tahap: "kerangka" | "menulis" | "selesai" | "gagal"
  galat: string | null
  diperbaruiPada: string
}

type BarisGenerasi = {
  id: string
  source_name: string | null
  outline: unknown
  modul_total: number | null
  modul_selesai: number | null
  tahap: string | null
  galat: string | null
  updated_at: string
}

function keKeadaan(baris: BarisGenerasi): Pekerjaan {
  const tahap = baris.tahap
  return {
    id: baris.id,
    namaBerkas: baris.source_name ?? "dokumen",
    kerangka: periksaKerangka(baris.outline),
    modulTotal: baris.modul_total ?? 0,
    modulSelesai: baris.modul_selesai ?? 0,
    tahap:
      tahap === "menulis" || tahap === "selesai" || tahap === "gagal" ? tahap : "kerangka",
    galat: baris.galat,
    diperbaruiPada: baris.updated_at,
  }
}

const RUAS = "id, source_name, outline, modul_total, modul_selesai, tahap, galat, updated_at"

/**
 * Pagar yang sama dengan impor Markdown: kursus milik pemanggil, dan belum
 * punya peserta. Ditegakkan di server, bukan dengan menyembunyikan tombol --
 * server action bisa dipanggil langsung lewat jaringan.
 */
async function pastikanBolehDiisi(courseId: string): Promise<{ error?: string }> {
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
        "Buat kursus baru untuk memakai fitur ini.",
    }
  }
  return {}
}

/**
 * Satu pemeriksaan untuk setiap action di bawah: pemanggil pengelola, AI
 * menyala, kursusnya boleh diisi, dan pekerjaannya memang miliknya.
 *
 * `created_by` disaring eksplisit karena pembacaan memakai service role --
 * ia menembus RLS, jadi tanpa penyaring itu satu id pekerjaan milik mentor
 * lain sudah cukup untuk membaca dokumennya.
 */
type BukaGagal = { error: string; adminId?: undefined; admin?: undefined; baris?: undefined }
type BukaBerhasil = {
  error?: undefined
  adminId: string
  admin: ReturnType<typeof createAdminClient>
  baris: BarisGenerasi & { context: unknown; bagian: unknown }
}

async function bukaPekerjaan(
  courseId: string,
  generationId: string
): Promise<BukaGagal | BukaBerhasil> {
  let adminId: string
  try {
    adminId = (await requireAdmin()).userId
  } catch {
    return { error: "Anda tidak berwenang" }
  }
  if (!aiAktif()) return { error: "Fitur AI belum diaktifkan." }

  const izin = await pastikanBolehDiisi(courseId)
  if (izin.error !== undefined) return { error: izin.error }

  const admin = createAdminClient()
  const { data } = await admin
    .from("ai_course_generations")
    .select(`${RUAS}, context, bagian`)
    .eq("id", generationId)
    .eq("created_by", adminId)
    .eq("course_id", courseId)
    .maybeSingle()

  if (!data) return { error: "Pekerjaannya tidak ditemukan. Unggah ulang dokumennya." }
  return { adminId, admin, baris: data as BarisGenerasi & { context: unknown; bagian: unknown } }
}

const JENIS_WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

/**
 * Teks dari Word atau PDF, atau dari berkas teks apa adanya.
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

/* ------------------------------------------------------------------ *
 * Membaca dokumen dan membuat kerangka
 * ------------------------------------------------------------------ */

export async function buatKerangkaDariSop(
  courseId: string,
  formData: FormData
): Promise<ActionResult<Pekerjaan>> {
  let adminId: string
  try {
    adminId = (await requireAdmin()).userId
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  if (!aiAktif()) return { ok: false, error: "Fitur AI belum diaktifkan." }

  const izin = await pastikanBolehDiisi(courseId)
  if (izin.error) return { ok: false, error: izin.error }

  const pagar = await pagarToken(adminId)
  if (pagar.error) return { ok: false, error: pagar.error }

  const file = formData.get("berkas")
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Pilih dokumennya dulu." }
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
   * (migrasi 20261110040000): dokumen sumber sering internal perusahaan
   * pelanggan. Teks hasil ekstraksi ikut disimpan di baris pekerjaan supaya
   * tahap berikutnya tidak perlu mengunggah ulang.
   */
  const admin = createAdminClient()
  const jalur = `${adminId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`
  const { error: unggahError } = await admin.storage
    .from("sop-documents")
    .upload(jalur, await file.arrayBuffer(), { contentType: file.type || "application/octet-stream" })
  if (unggahError) console.error("gagal menyimpan dokumen:", unggahError.message)

  const { data: baris, error: simpanError } = await admin
    .from("ai_course_generations")
    .insert({
      created_by: adminId,
      course_id: courseId,
      source_name: file.name,
      context: { jalur: unggahError ? null : jalur, sop },
      outline: kerangka.data,
      status: "kerangka",
      tahap: "kerangka",
      modul_total: kerangka.data.modul.length,
      modul_selesai: 0,
      bagian: [],
      model: process.env.AI_MODEL ?? null,
    })
    .select(RUAS)
    .single()

  if (simpanError || !baris) {
    console.error("gagal mencatat pekerjaan:", simpanError?.message)
    return { ok: false, error: "Gagal menyimpan kerangka. Coba lagi." }
  }

  await admin.from("ai_usage").insert({ user_id: adminId, feature: "sop_kerangka", tokens: kerangka.token })

  return { ok: true, data: keKeadaan(baris as BarisGenerasi) }
}

/* ------------------------------------------------------------------ *
 * Menyunting kerangka: tangan manusia, lalu tangan AI
 * ------------------------------------------------------------------ */

/** Menyimpan kerangka yang disunting sendiri oleh penyusun. */
export async function simpanKerangka(
  courseId: string,
  generationId: string,
  kerangka: unknown
): Promise<ActionResult<Pekerjaan>> {
  const buka = await bukaPekerjaan(courseId, generationId)
  if (buka.error !== undefined) return { ok: false, error: buka.error }

  // Diperiksa ulang di server dengan fungsi yang sama dengan keluaran model.
  // Kerangka yang datang dari peramban tidak lebih dipercaya daripada yang
  // datang dari AI: keduanya masukan.
  const bersih = periksaKerangka(kerangka)
  if (!bersih) {
    return { ok: false, error: "Kerangkanya tidak lengkap. Setiap modul harus punya judul dan minimal satu pelajaran." }
  }

  const { data, error } = await buka.admin
    .from("ai_course_generations")
    .update({
      outline: bersih,
      modul_total: bersih.modul.length,
      // Kerangka berubah berarti bagian yang sudah ditulis tidak lagi cocok
      // dengan urutannya. Dibuang, bukan dipaksa dipakai: satu modul yang
      // isinya milik modul lain lebih buruk daripada menulis ulang.
      modul_selesai: 0,
      bagian: [],
      tahap: "kerangka",
      galat: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", generationId)
    .select(RUAS)
    .single()

  if (error || !data) return { ok: false, error: "Gagal menyimpan perubahan. Coba lagi." }
  return { ok: true, data: keKeadaan(data as BarisGenerasi) }
}

/**
 * Meminta AI mengubah kerangka atas satu kalimat permintaan penyusun.
 *
 * `berubah: false` bukan kegagalan, dan itulah sebabnya ia dikembalikan
 * alih-alih dilaporkan sebagai galat. Permintaan menambah topik yang memang
 * tidak ada di dokumen DIHARAPKAN ditolak -- mengarangnya justru cacat.
 * Yang tidak boleh adalah diam: layar yang menampilkan "versi 2" dan tombol
 * kembali padahal tidak ada yang berubah membuat orang mengira fiturnya
 * rusak, lalu mencoba lagi dengan kalimat yang sama.
 */
export async function mintaRevisiKerangka(
  courseId: string,
  generationId: string,
  permintaan: string
): Promise<ActionResult<{ pekerjaan: Pekerjaan; berubah: boolean }>> {
  const buka = await bukaPekerjaan(courseId, generationId)
  if (buka.error !== undefined) return { ok: false, error: buka.error }

  const pinta = (permintaan ?? "").trim()
  if (!pinta) return { ok: false, error: "Tulis dulu perubahan yang Anda inginkan." }
  if (pinta.length > MAKS_PERMINTAAN) {
    return { ok: false, error: "Permintaannya terlalu panjang. Tulis satu perubahan saja." }
  }

  const kerangka = periksaKerangka(buka.baris.outline)
  if (!kerangka) return { ok: false, error: "Kerangkanya tidak ditemukan. Unggah ulang dokumennya." }

  const sop = ((buka.baris.context as { sop?: string } | null)?.sop ?? "").trim()
  if (!sop) return { ok: false, error: "Teks dokumennya tidak tersimpan. Unggah ulang dokumennya." }

  const pagar = await pagarToken(buka.adminId)
  if (pagar.error) return { ok: false, error: pagar.error }

  const baru = await revisiKerangka(sop, kerangka, pinta)
  if (!baru.ok) return { ok: false, error: baru.error }

  await buka.admin.from("ai_usage").insert({
    user_id: buka.adminId,
    feature: "sop_revisi",
    tokens: baru.token,
  })

  const berubah = JSON.stringify(baru.data) !== JSON.stringify(kerangka)
  if (!berubah) {
    return { ok: true, data: { pekerjaan: keKeadaan(buka.baris), berubah: false } }
  }

  const disimpan = await simpanKerangka(courseId, generationId, baru.data)
  if (!disimpan.ok) return disimpan
  return { ok: true, data: { pekerjaan: disimpan.data, berubah: true } }
}

/* ------------------------------------------------------------------ *
 * Menulis isi, satu modul tiap panggilan
 * ------------------------------------------------------------------ */

export type HasilModul =
  | { selesai: false; pekerjaan: Pekerjaan }
  | { selesai: true; pekerjaan: Pekerjaan; parsed: ParsedCourse }

/**
 * Menulis SATU modul berikutnya, lalu menyimpannya.
 *
 * Modul yang ditulis adalah `modul_selesai`-ke, jadi memanggil ulang setelah
 * terputus meneruskan dari tempat berhenti -- tanpa perlu tahu apa pun
 * tentang panggilan sebelumnya.
 */
export async function tulisModulBerikutnya(
  courseId: string,
  generationId: string
): Promise<ActionResult<HasilModul>> {
  const buka = await bukaPekerjaan(courseId, generationId)
  if (buka.error !== undefined) return { ok: false, error: buka.error }

  const kerangka = periksaKerangka(buka.baris.outline)
  if (!kerangka) return { ok: false, error: "Kerangkanya tidak ditemukan. Unggah ulang dokumennya." }

  const sop = ((buka.baris.context as { sop?: string } | null)?.sop ?? "").trim()
  if (!sop) return { ok: false, error: "Teks dokumennya tidak tersimpan. Unggah ulang dokumennya." }

  const bagian = Array.isArray(buka.baris.bagian) ? (buka.baris.bagian as string[]) : []
  const indeks = Math.min(bagian.length, kerangka.modul.length)

  if (indeks >= kerangka.modul.length) {
    return selesaikan(buka.admin, generationId, kerangka, bagian)
  }

  const pagar = await pagarToken(buka.adminId)
  if (pagar.error) {
    // Pekerjaannya TIDAK ditandai gagal: modul yang sudah jadi tetap
    // tersimpan, dan besok ia bisa dilanjutkan dari tempat berhenti.
    return { ok: false, error: pagar.error }
  }

  const hasil = await tulisModul(sop, kerangka, kerangka.modul[indeks])
  if (!hasil.ok) {
    await buka.admin
      .from("ai_course_generations")
      .update({ tahap: "gagal", galat: hasil.error, updated_at: new Date().toISOString() })
      .eq("id", generationId)
    return { ok: false, error: hasil.error }
  }

  const bagianBaru = [...bagian, hasil.data]
  const tuntas = bagianBaru.length >= kerangka.modul.length

  const { data, error } = await buka.admin
    .from("ai_course_generations")
    .update({
      bagian: bagianBaru,
      modul_selesai: bagianBaru.length,
      tahap: tuntas ? "selesai" : "menulis",
      galat: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", generationId)
    .select(RUAS)
    .single()

  if (error || !data) return { ok: false, error: "Gagal menyimpan hasil modul. Coba lagi." }

  await buka.admin.from("ai_usage").insert({
    user_id: buka.adminId,
    feature: "sop_tulis",
    tokens: hasil.token,
  })

  if (!tuntas) return { ok: true, data: { selesai: false, pekerjaan: keKeadaan(data as BarisGenerasi) } }
  return selesaikan(buka.admin, generationId, kerangka, bagianBaru)
}

async function selesaikan(
  admin: ReturnType<typeof createAdminClient>,
  generationId: string,
  kerangka: KerangkaKursus,
  bagian: string[]
): Promise<ActionResult<HasilModul>> {
  const markdown = rakitMarkdown(kerangka, bagian)

  const { data } = await admin
    .from("ai_course_generations")
    .update({ markdown, status: "selesai", tahap: "selesai", updated_at: new Date().toISOString() })
    .eq("id", generationId)
    .select(RUAS)
    .single()

  // Jalur yang sama persis dengan berkas .md buatan manusia.
  return {
    ok: true,
    data: {
      selesai: true,
      pekerjaan: keKeadaan(data as BarisGenerasi),
      parsed: parseCourseMarkdown(markdown),
    },
  }
}

/* ------------------------------------------------------------------ *
 * Kembali lagi nanti
 * ------------------------------------------------------------------ */

/** Pekerjaan terakhir pada kursus ini, bila ada. Dasar "lanjutkan". */
export async function ambilPekerjaanTerakhir(
  courseId: string
): Promise<ActionResult<Pekerjaan | null>> {
  let adminId: string
  try {
    adminId = (await requireAdmin()).userId
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from("ai_course_generations")
    .select(RUAS)
    .eq("created_by", adminId)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return { ok: true, data: data ? keKeadaan(data as BarisGenerasi) : null }
}

/** Mengambil hasil akhir pekerjaan yang sudah tuntas, untuk dimasukkan ke draf. */
export async function ambilHasilPekerjaan(
  courseId: string,
  generationId: string
): Promise<ActionResult<ParsedCourse>> {
  const buka = await bukaPekerjaan(courseId, generationId)
  if (buka.error !== undefined) return { ok: false, error: buka.error }

  const kerangka = periksaKerangka(buka.baris.outline)
  const bagian = Array.isArray(buka.baris.bagian) ? (buka.baris.bagian as string[]) : []
  if (!kerangka || bagian.length < kerangka.modul.length) {
    return { ok: false, error: "Pekerjaannya belum selesai." }
  }

  return { ok: true, data: parseCourseMarkdown(rakitMarkdown(kerangka, bagian)) }
}

/** Membuang pekerjaan supaya layar tidak menawarkannya lagi. */
export async function buangPekerjaan(
  courseId: string,
  generationId: string
): Promise<ActionResult<true>> {
  const buka = await bukaPekerjaan(courseId, generationId)
  if (buka.error !== undefined) return { ok: false, error: buka.error }

  await buka.admin.from("ai_course_generations").delete().eq("id", generationId)
  return { ok: true, data: true }
}
