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
 * **Penyedianya bisa diganti lewat env, bukan lewat kode.** Dua adapter hidup
 * berdampingan di sini: `gemini` (Google) dan `openai` (format
 * chat/completions, dipakai DeepSeek dan banyak penyedia lain). Yang di luar
 * berkas ini -- `tanyaTeks`, `tanyaJson`, `aiAktif`, dan pemanggilnya di
 * lesson-assistant.ts serta quiz-feedback.ts -- tidak tahu penyedia mana yang
 * sedang dipakai, dan memang tidak perlu tahu.
 *
 * Bawaannya `gemini`: tanpa `AI_PROVIDER`, perilakunya persis seperti sebelum
 * adapter kedua ada. Satu instalasi yang hanya memperbarui kodenya tidak
 * berubah apa pun.
 *
 * **Angka-angka di bawah diukur, bukan ditebak.**
 *
 * Gemini (10 Nov 2026, kunci proyek 430885087073):
 * - `gemini-2.5-flash` dan `-lite` -> 404, "no longer available to new users".
 * - `gemini-flash-latest` (= gemini-3.8-flash) -> jalan, tetapi sering 503
 *   "high demand", dan berpikir 331 token untuk prompt 7 token: 40 detik
 *   untuk satu kalimat. Mustahil untuk asisten yang diketik orang.
 * - `gemini-3.1-flash-lite` -> 1,5-2,4 detik, `thinkingBudget: 0` diterima.
 *
 * DeepSeek (10 Nov 2026):
 * - Model yang tersedia: `deepseek-flash`, `deepseek-v4-pro`.
 * - `deepseek-flash` dengan `thinking: {type: "disabled"}` dan
 *   `response_format: {type: "json_object"}` -> 2,0 detik, JSON sah.
 *
 * Mematikan mode berpikir WAJIB di kedua penyedia, dan bukan demi menghemat
 * biaya: fungsi serverless Vercel punya batas durasi, jadi penalaran bawaan
 * bukan sekadar lambat -- ia gagal.
 */

const ENDPOINT_GEMINI = "https://generativelanguage.googleapis.com/v1beta/models"

/** Berapa lama menunggu satu jawaban sebelum menyerah. */
const BATAS_DETIK = 45

export type Penyedia = "gemini" | "openai"

export function penyedia(): Penyedia {
  return process.env.AI_PROVIDER === "openai" ? "openai" : "gemini"
}

/**
 * Kunci penyedia yang sedang aktif.
 *
 * `AI_API_KEY` untuk adapter openai, `GEMINI_API_KEY` untuk gemini. Dipisah
 * dengan sengaja: satu instalasi boleh menyimpan keduanya dan berpindah
 * penyedia hanya dengan mengubah `AI_PROVIDER`, tanpa menukar nilai kunci.
 */
function kunci(): string | undefined {
  return penyedia() === "openai" ? process.env.AI_API_KEY : process.env.GEMINI_API_KEY
}

/**
 * Apakah fitur AI dirender sama sekali.
 *
 * Dipakai di SERVER untuk memutuskan apakah komponennya dikirim ke peramban.
 * Standar v2 melarang kontrol yang tampak bekerja padahal tidak: tanpa kunci,
 * tombol AI tidak boleh muncul lalu gagal -- ia tidak boleh muncul.
 */
export function aiAktif(): boolean {
  return process.env.AI_ENABLED === "true" && !!kunci()
}

export function modelAi(): string {
  if (process.env.AI_MODEL) return process.env.AI_MODEL
  return penyedia() === "openai" ? "deepseek-flash" : "gemini-3.1-flash-lite"
}

export type HasilAi<T> =
  | {
      ok: true
      data: T
      token: number
      /**
       * Balasan berhenti karena kehabisan jatah token, bukan karena selesai.
       *
       * Dulu ini hanya dicatat ke log ketika balasannya KOSONG, sehingga
       * jawaban yang terpotong di tengah lolos sebagai "ok" dan pemanggil
       * tidak punya cara tahu. Satu modul kursus pernah keluar dengan satu
       * soal dari tiga yang diminta, tanpa satu pun tanda.
       */
      terpotong: boolean
    }
  | { ok: false; error: string }

type Permintaan = {
  /** Aturan peran model. Dipisah dari `prompt` supaya terbaca di log. */
  sistem?: string
  prompt: string
  /** Bentuk JSON yang diharapkan. Tanpa ini, keluarannya teks biasa. */
  skema?: Record<string, unknown>
  maxOutputTokens?: number
}

/** Hasil satu kali panggil ke penyedia, sebelum diputuskan mau diulang atau tidak. */
type Balasan =
  | { jenis: "ok"; teks: string; token: number; terpotong: boolean }
  | { jenis: "sibuk" } // 429/503: layak dicoba ulang
  | { jenis: "kosong" } // balasan tanpa isi: layak dicoba ulang sekali
  | { jenis: "gagal"; pesan: string } // tidak akan membaik dengan diulang

async function panggilGemini(req: Permintaan, key: string): Promise<Balasan> {
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

  const res = await fetch(`${ENDPOINT_GEMINI}/${modelAi()}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(BATAS_DETIK * 1000),
  })

  if (res.status === 503 || res.status === 429) return { jenis: "sibuk" }

  const json = (await res.json().catch(() => null)) as {
    error?: { message?: string }
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
    usageMetadata?: { totalTokenCount?: number }
  } | null

  if (!res.ok || !json || json.error) {
    console.error("AI (gemini) menolak:", res.status, json?.error?.message)
    return { jenis: "gagal", pesan: "AI sedang tidak bisa dipakai. Coba lagi nanti." }
  }

  const kandidat = json.candidates?.[0]
  const teks = (kandidat?.content?.parts ?? []).map((p) => p.text ?? "").join("")
  if (!teks.trim()) {
    console.error("AI (gemini) balas kosong, finishReason:", kandidat?.finishReason)
    return { jenis: "kosong" }
  }
  return {
    jenis: "ok",
    teks,
    token: json.usageMetadata?.totalTokenCount ?? 0,
    terpotong: kandidat?.finishReason === "MAX_TOKENS",
  }
}

/**
 * Adapter format chat/completions (DeepSeek, dan penyedia lain yang
 * kompatibel OpenAI).
 *
 * Dua perbedaan penting dari Gemini, keduanya diuji langsung:
 *
 * 1. **Mode JSON tidak menerima skema.** Hanya `{type: "json_object"}`. Jadi
 *    bentuk yang diminta dijelaskan di prompt sistem -- dan kata "json" wajib
 *    ada di sana, karena penyedia menolak permintaan mode JSON tanpa kata itu.
 *    `periksa()` di `tanyaJson` tetap jadi penjaga terakhir, persis seperti
 *    pada Gemini: `responseSchema` pun hanya menjamin JSON yang SAH, bukan
 *    JSON yang BENAR.
 * 2. **Isi bisa kosong di mode JSON.** Diperlakukan sama dengan balasan
 *    kosong: satu kali ulang, lalu menyerah dengan jujur.
 */
async function panggilOpenAI(req: Permintaan, key: string): Promise<Balasan> {
  const base = (process.env.AI_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "")

  /*
   * Skema diselipkan ke prompt sistem karena mode JSON DeepSeek tidak
   * menerima skema seperti `responseSchema` milik Gemini.
   *
   * Kalimatnya dipilih setelah model benar-benar salah membacanya: dengan
   * "balas dengan satu objek json yang cocok dengan bentuk berikut", model
   * pernah mengembalikan SKEMA-nya sendiri, bukan data yang memenuhinya --
   * dan karena skema juga JSON yang sah, kesalahan itu baru ketahuan di
   * `periksa`. Sekarang disebut terang-terangan apa yang bukan jawaban.
   */
  const sistem = req.skema
    ? [
        req.sistem ?? "",
        "",
        "Balas HANYA dengan satu objek json berisi DATA.",
        "Di bawah ini JSON Schema yang harus dipenuhi data itu.",
        "JSON Schema ini BUKAN jawaban: jangan menyalinnya, dan jangan",
        'mengembalikan objek yang berisi kata "type", "properties", atau "items".',
        "Jangan menambah kolom, jangan membungkusnya dengan teks apa pun.",
        "",
        "JSON Schema:",
        JSON.stringify(req.skema),
      ]
        .join("\n")
        .trim()
    : req.sistem

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: modelAi(),
      thinking: { type: "disabled" },
      max_tokens: req.maxOutputTokens ?? 2048,
      ...(req.skema ? { response_format: { type: "json_object" } } : {}),
      messages: [
        ...(sistem ? [{ role: "system", content: sistem }] : []),
        { role: "user", content: req.prompt },
      ],
    }),
    signal: AbortSignal.timeout(BATAS_DETIK * 1000),
  })

  if (res.status === 429 || res.status === 500 || res.status === 503) return { jenis: "sibuk" }

  const json = (await res.json().catch(() => null)) as {
    error?: { message?: string }
    choices?: { message?: { content?: string | null }; finish_reason?: string }[]
    usage?: { total_tokens?: number }
  } | null

  if (!res.ok || !json || json.error) {
    console.error("AI (openai) menolak:", res.status, json?.error?.message)
    return { jenis: "gagal", pesan: "AI sedang tidak bisa dipakai. Coba lagi nanti." }
  }

  const pilihan = json.choices?.[0]
  const teks = pilihan?.message?.content ?? ""
  if (!teks.trim()) {
    console.error("AI (openai) balas kosong, finish_reason:", pilihan?.finish_reason)
    return { jenis: "kosong" }
  }
  return {
    jenis: "ok",
    teks,
    token: json.usage?.total_tokens ?? 0,
    terpotong: pilihan?.finish_reason === "length",
  }
}

/**
 * Memanggil penyedia yang sedang aktif.
 *
 * Satu kali coba ulang untuk "sibuk" dan "kosong" saja. Galat lain (kunci
 * salah, model tidak ada, permintaan cacat) tidak akan membaik dengan
 * diulang, dan mengulangnya hanya membuat orang menunggu dua kali lebih lama.
 */
async function panggil(req: Permintaan): Promise<HasilAi<string>> {
  const key = kunci()
  if (!key) return { ok: false, error: "Fitur AI belum diaktifkan." }
  const adapter = penyedia() === "openai" ? panggilOpenAI : panggilGemini

  for (let percobaan = 0; percobaan < 2; percobaan++) {
    let balasan: Balasan
    try {
      balasan = await adapter(req, key)
    } catch (err) {
      // Termasuk waktu habis. Satu kali ulang, lalu menyerah dengan jujur.
      if (percobaan === 0) continue
      console.error("AI fetch gagal:", err)
      return { ok: false, error: "AI tidak menjawab tepat waktu. Coba lagi." }
    }

    if (balasan.jenis === "ok") {
      if (balasan.terpotong) {
        console.warn("AI: balasan terpotong karena batas token. Pemanggil harus menanganinya.")
      }
      return { ok: true, data: balasan.teks, token: balasan.token, terpotong: balasan.terpotong }
    }
    if (balasan.jenis === "gagal") {
      return { ok: false, error: balasan.pesan }
    }
    // sibuk atau kosong: coba sekali lagi, lalu pesan yang sesuai.
    if (percobaan === 0) {
      if (balasan.jenis === "sibuk") await new Promise((r) => setTimeout(r, 1200))
      continue
    }
    return {
      ok: false,
      error:
        balasan.jenis === "sibuk"
          ? "Layanan AI sedang penuh. Coba lagi sebentar."
          : "AI tidak menghasilkan jawaban. Coba lagi.",
    }
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
 * Dua lapis: penyedia diberi tahu bentuk yang diminta (lewat `responseSchema`
 * pada Gemini, lewat prompt sistem pada adapter openai), dan `periksa`
 * memeriksanya lagi di sini. Lapisan kedua bukan kelebihan -- mode JSON mana
 * pun hanya menjamin JSON yang SAH, bukan JSON yang BENAR, dan yang akan
 * disimpan ke basis data adalah yang kedua.
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

  return { ok: true, data: bersih, token: hasil.token, terpotong: hasil.terpotong }
}
