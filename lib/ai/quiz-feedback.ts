import "server-only"

import { tanyaJson, modelAi, type HasilAi } from "@/lib/ai/client"

/**
 * Pembahasan per jawaban salah (F5).
 *
 * **Lapisan tambahan, bukan pengganti.** v2 sudah memberi skor, penjelasan
 * penulis per soal, tautan "Pelajari lagi", dan kotak "3 kali salah". Yang
 * belum ada: kenapa pilihan YANG ITU menjebak. Karena itu bagian ini duduk
 * SETELAH kotak adaptif dan memakai tautan materi yang sama -- tidak satu pun
 * dari yang lama berubah.
 *
 * **Kunci jawaban tidak pernah menyeberang ke peramban.** Jawaban benar dibaca
 * di server, dipakai untuk menyusun prompt, dan hanya muncul lagi di dalam
 * kalimat pembahasan -- yang memang baru ada setelah percobaannya dikirim.
 */

export type ItemPembahasan = {
  questionId: string
  /** Kenapa jawaban yang dipilih keliru. */
  kenapa: string
  /** Konsep yang perlu diulang. */
  konsep: string
  /** Satu langkah berikutnya yang konkret. */
  langkah: string
}

export type MasukanSoal = {
  questionId: string
  prompt: string
  jawabanPeserta: string
  jawabanBenar: string
  /** Penjelasan yang ditulis penyusun kursus, bila ada. */
  penjelasanPenulis?: string
}

const SKEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          questionId: { type: "string" },
          kenapa: { type: "string" },
          konsep: { type: "string" },
          langkah: { type: "string" },
        },
        required: ["questionId", "kenapa", "konsep", "langkah"],
      },
    },
  },
  required: ["items"],
} as const

function periksa(ids: Set<string>) {
  return (nilai: unknown): { items: ItemPembahasan[] } | null => {
    if (typeof nilai !== "object" || nilai === null) return null
    const items = (nilai as { items?: unknown }).items
    if (!Array.isArray(items)) return null

    const bersih: ItemPembahasan[] = []
    for (const it of items) {
      if (typeof it !== "object" || it === null) continue
      const o = it as Record<string, unknown>
      const id = typeof o.questionId === "string" ? o.questionId : null
      // Soal yang tidak kita kirim tidak boleh muncul di keluaran: model bisa
      // saja mengarang id, dan menyimpannya berarti menampilkan pembahasan
      // untuk soal yang tidak pernah dijawab orang ini.
      if (!id || !ids.has(id)) continue
      if (
        typeof o.kenapa !== "string" ||
        typeof o.konsep !== "string" ||
        typeof o.langkah !== "string"
      )
        continue
      bersih.push({
        questionId: id,
        kenapa: o.kenapa.trim(),
        konsep: o.konsep.trim(),
        langkah: o.langkah.trim(),
      })
    }
    return bersih.length > 0 ? { items: bersih } : null
  }
}

const SISTEM = `Anda pengajar yang membahas jawaban kuis seorang peserta.

Aturan:
- Bahas HANYA soal yang diberikan. Jangan menambah soal baru.
- Jelaskan kenapa jawaban yang DIPILIH peserta keliru, bukan sekadar
  menyebutkan jawaban benarnya.
- Bahasa Indonesia yang sederhana, "Anda", tanpa tanda seru dan tanpa emoji.
- Tiap bagian maksimal dua kalimat pendek.
- Jangan menyebut nama orang, nilai, atau kelulusan.`

export async function buatPembahasan(
  soal: MasukanSoal[],
  bahasa: "id" | "en"
): Promise<HasilAi<{ items: ItemPembahasan[]; model: string }>> {
  if (soal.length === 0) return { ok: false, error: "Tidak ada jawaban salah untuk dibahas." }

  const daftar = soal
    .map(
      (s, i) =>
        `Soal ${i + 1} (id: ${s.questionId})\n` +
        `Pertanyaan: ${s.prompt}\n` +
        `Jawaban peserta: ${s.jawabanPeserta}\n` +
        `Jawaban benar: ${s.jawabanBenar}` +
        (s.penjelasanPenulis ? `\nCatatan penyusun: ${s.penjelasanPenulis}` : "")
    )
    .join("\n\n")

  const hasil = await tanyaJson(
    {
      sistem: SISTEM + (bahasa === "en" ? "\n- Tulis jawabannya dalam bahasa Inggris." : ""),
      prompt: `Bahas tiap jawaban salah berikut. Kembalikan satu item per soal, memakai id yang sama persis.\n\n${daftar}`,
      skema: SKEMA as unknown as Record<string, unknown>,
      maxOutputTokens: 300 + soal.length * 220,
    },
    periksa(new Set(soal.map((s) => s.questionId)))
  )

  if (!hasil.ok) return hasil
  return { ok: true, data: { items: hasil.data.items, model: modelAi() }, token: hasil.token }
}
