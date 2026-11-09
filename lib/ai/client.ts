import "server-only"

/**
 * Satu-satunya tempat LMS ini memanggil model bahasa.
 *
 * **Kenapa terpusat.** Setiap fitur AI punya pagarnya sendiri (batas harian,
 * bentuk keluaran, bahasa), tetapi tiga hal harus sama di semuanya: kuncinya
 * tidak pernah meninggalkan server, keluaran yang tidak lolos validasi tidak
 * pernah disimpan, dan kegagalan menghasilkan pesan yang bisa dibaca orang
 * Indonesia. Menyebar pemanggilan ke tiap fitur berarti tiga jaminan itu
 * dijaga tiga kali.
 *
 * **Angka-angka di sini diukur, bukan ditebak** (10 Nov 2026, kunci proyek
 * 430885087073):
 *
 * - `gemini-2.5-flash` dan `gemini-2.5-flash-lite` -> 404, "no longer
 *   available to new users". Tidak bisa dipakai proyek ini sama sekali.
 * - `gemini-flash-latest` (= gemini-3.8-flash) -> jalan, tetapi sering 503
 *   "high demand", dan berpikir 331 token untuk prompt 7 token: 40 detik
 *   untuk satu kalimat. Mustahil untuk asisten yang diketik orang.
 * - `gemini-3.1-flash-lite` -> 1,5-2,4 detik, `thinkingBudget: 0` diterima,
 *   JSON terstruktur sah. Inilah bawaannya.
 *
 * Modelnya tetap lewat env (`AI_MODEL`) supaya pemilik bisa menaikkannya
 * tanpa menyentuh kode saat kuota model yang lebih besar terbuka.
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models"

/** Berapa lama menunggu satu jawaban sebelum menyerah. */
const BATAS_DETIK = 45

/**
 * Apakah fitur AI dirender sama sekali.
 *
 * Dipakai di SERVER untuk memutuskan apakah komponennya dikirim ke peramban.
 * Standar v2 melarang kontrol yang tampak bekerja padahal tidak: tanpa kunci,
 * tombol AI tidak boleh muncul lalu gagal -- ia tidak boleh muncul.
 */
export function aiAktif(): boolean {
  return process.env.AI_ENABLED === "true" && !!process.env.GEMINI_API_KEY
}

export function modelAi(): string {
  return process.env.AI_MODEL || "gemini-3.1-flash-lite"
}

export type HasilAi<T> = { ok: true; data: T; token: number } | { ok: false; error: string }

type Permintaan = {
  /** Aturan peran model. Dipisah dari `prompt` supaya terbaca di log. */
  sistem?: string
  prompt: string
  /** Bentuk JSON yang diharapkan. Tanpa ini, keluarannya teks biasa. */
  skema?: Record<string, unknown>
  maxOutputTokens?: number
}

/**
 * Memanggil model dan mengembalikan teks mentahnya.
 *
 * `thinkingBudget: 0` **wajib** dan bukan penghematan biaya: tanpa itu model
 * ini menghabiskan ratusan token penalaran untuk pertanyaan sederhana dan
 * jawabannya datang setelah puluhan detik. Fungsi serverless Vercel punya
 * batas durasi, jadi penalaran bawaan bukan hanya lambat -- ia gagal.
 *
 * Satu kali coba ulang untuk 503/429 saja. Galat lain (kunci salah, model
 * tidak ada, permintaan cacat) tidak akan membaik dengan diulang, dan
 * mengulangnya hanya membuat orang menunggu dua kali lebih lama.
 */
async function panggil(req: Permintaan): Promise<HasilAi<string>> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return { ok: false, error: "Fitur AI belum diaktifkan." }

  const body = {
    ...(req.sistem ? { systemInstruction: { parts: [{ text: req.sistem }] } } : {}),
    contents: [{ parts: [{ text: req.prompt }] }],
    generationConfig: {
      maxOutputTokens: req.maxOutputTokens ?? 2048,
      thinkingConfig: { thinkingBudget: 0 },
      ...(req.skema
        ? { responseMimeType: "application/json", responseSchema: req.skema }
        : {}),
    },
  }

  for (let percobaan = 0; percobaan < 2; percobaan++) {
    let res: Response
    try {
      res = await fetch(`${ENDPOINT}/${modelAi()}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": key },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(BATAS_DETIK * 1000),
      })
    } catch (err) {
      // Termasuk waktu habis. Satu kali ulang, lalu menyerah dengan jujur.
      if (percobaan === 0) continue
      console.error("AI fetch gagal:", err)
      return { ok: false, error: "AI tidak menjawab tepat waktu. Coba lagi." }
    }

    if (res.status === 503 || res.status === 429) {
      if (percobaan === 0) {
        await new Promise((r) => setTimeout(r, 1200))
        continue
      }
      return { ok: false, error: "Layanan AI sedang penuh. Coba lagi sebentar." }
    }

    const json = (await res.json().catch(() => null)) as {
      error?: { message?: string }
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
      usageMetadata?: { totalTokenCount?: number }
    } | null

    if (!res.ok || !json || json.error) {
      // Pesan Google berbahasa Inggris dan menyebut nama model. Itu untuk log,
      // bukan untuk layar -- aturan yang sama dengan lib/db-error-message.ts.
      console.error("AI menolak:", res.status, json?.error?.message)
      return { ok: false, error: "AI sedang tidak bisa dipakai. Coba lagi nanti." }
    }

    const kandidat = json.candidates?.[0]
    const teks = (kandidat?.content?.parts ?? []).map((p) => p.text ?? "").join("")
    if (!teks.trim()) {
      // `MAX_TOKENS` di sini berarti jawabannya terpotong di tengah, jadi
      // menyimpannya separuh lebih buruk daripada mengaku gagal.
      console.error("AI balas kosong, finishReason:", kandidat?.finishReason)
      return { ok: false, error: "AI tidak menghasilkan jawaban. Coba lagi." }
    }

    return { ok: true, data: teks, token: json.usageMetadata?.totalTokenCount ?? 0 }
  }

  return { ok: false, error: "AI tidak bisa dihubungi." }
}

/** Jawaban berupa teks biasa. */
export async function tanyaTeks(req: Permintaan): Promise<HasilAi<string>> {
  return panggil(req)
}

/**
 * Jawaban berupa JSON yang harus cocok dengan `skema`.
 *
 * Dua lapis: `responseSchema` memberi tahu model bentuk yang diminta, dan
 * `periksa` memeriksanya lagi di sini. Lapisan kedua bukan kelebihan --
 * `responseMimeType: application/json` menjamin JSON yang SAH, bukan JSON
 * yang BENAR, dan yang akan disimpan ke basis data adalah yang kedua.
 */
export async function tanyaJson<T>(
  req: Permintaan & { skema: Record<string, unknown> },
  periksa: (nilai: unknown) => T | null
): Promise<HasilAi<T>> {
  const hasil = await panggil(req)
  if (!hasil.ok) return hasil

  let mentah: unknown
  try {
    mentah = JSON.parse(hasil.data)
  } catch {
    console.error("AI mengembalikan JSON tidak sah:", hasil.data.slice(0, 200))
    return { ok: false, error: "Jawaban AI tidak terbaca. Coba lagi." }
  }

  const bersih = periksa(mentah)
  if (bersih === null) {
    console.error("AI JSON tidak sesuai bentuk:", hasil.data.slice(0, 200))
    return { ok: false, error: "Jawaban AI tidak lengkap. Coba lagi." }
  }

  return { ok: true, data: bersih, token: hasil.token }
}
