import "server-only"

import { tanyaJson, modelAi, type HasilAi } from "@/lib/ai/client"
import type { AngkaRingkas } from "@/lib/laporan-departemen"

/**
 * Ringkasan laporan per departemen (F3).
 *
 * **Model ini hanya melihat angka.** Yang masuk adalah `AngkaRingkas` --
 * tipe yang sengaja tidak punya ruas untuk nama orang, surel, id, maupun
 * judul kursus (lihat `lib/laporan-departemen.ts`). Pembatasan yang dijaga
 * tipe tidak bisa lolos lewat perubahan terburu-buru; yang hanya ditulis di
 * prompt bisa.
 *
 * **Ringkasan tidak menggantikan tabelnya.** Angkanya tetap ditampilkan utuh
 * di layar, dan ringkasan ini duduk di atasnya sebagai bacaan cepat. Kalau
 * keduanya berbeda, yang benar tabelnya -- itu sebabnya angka yang dipakai
 * ikut disimpan ke `ai_report_summaries.figures`, supaya bisa diperiksa ulang
 * apakah ringkasan lama masih cocok dengan keadaan sekarang.
 */

export type RingkasanLaporan = {
  /** Dua sampai tiga kalimat keadaan umum. */
  ringkas: string
  /** Hal yang menonjol, masing-masing satu kalimat. Maksimal empat. */
  temuan: string[]
  /** Langkah yang bisa diambil pengelola, masing-masing satu kalimat. */
  saran: string[]
}

const SKEMA = {
  type: "object",
  properties: {
    ringkas: { type: "string" },
    temuan: { type: "array", items: { type: "string" } },
    saran: { type: "array", items: { type: "string" } },
  },
  required: ["ringkas", "temuan", "saran"],
} as const

const MAKS_TEMUAN = 4
const MAKS_SARAN = 3

function periksa(nilai: unknown): RingkasanLaporan | null {
  if (typeof nilai !== "object" || nilai === null) return null
  const o = nilai as Record<string, unknown>
  if (typeof o.ringkas !== "string" || o.ringkas.trim() === "") return null

  const daftar = (v: unknown, maks: number): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "")
          .map((x) => x.trim())
          .slice(0, maks)
      : []

  return {
    ringkas: o.ringkas.trim(),
    temuan: daftar(o.temuan, MAKS_TEMUAN),
    saran: daftar(o.saran, MAKS_SARAN),
  }
}

const SISTEM = `Anda membantu pengelola pelatihan membaca angka penyelesaian kursus per departemen.

Aturan:
- Pakai HANYA angka yang diberikan. Jangan mengarang angka, tren, atau sebab.
- Jangan menyebut atau menebak nama orang. Datanya memang tidak memuat orang.
- Jangan memeringkat orang. Membandingkan departemen boleh.
- Bila ada departemen yang angkanya ditahan karena terlalu sedikit orang,
  sebutkan sekali bahwa laporan ini belum mencakup semuanya.
- Bahasa Indonesia sederhana, "Anda", tanpa tanda seru dan tanpa emoji.
- Tiap kalimat pendek. "ringkas" paling banyak tiga kalimat.
- Saran harus berupa langkah yang bisa dikerjakan pengelola LMS, bukan
  nasihat umum tentang motivasi.`

export async function buatRingkasanLaporan(
  angka: AngkaRingkas,
  bahasa: "id" | "en"
): Promise<HasilAi<{ ringkasan: RingkasanLaporan; model: string }>> {
  if (angka.departemen.length === 0) {
    return {
      ok: false,
      error:
        "Belum ada departemen yang angkanya bisa ditampilkan, jadi tidak ada yang bisa diringkas.",
    }
  }

  const baris = angka.departemen
    .map(
      (d) =>
        `- ${d.nama}: ${d.orang} orang, ${d.pendaftaran} pendaftaran, ` +
        `${d.selesai} selesai (${d.persenSelesai}%), ` +
        `${d.lewatTenggat} lewat tenggat, ${d.wajibBelumMulai} kursus wajib belum dimulai`
    )
    .join("\n")

  const konteks =
    `Seluruh organisasi: ${angka.total.orang} orang, ${angka.total.pendaftaran} pendaftaran, ` +
    `${angka.total.persenSelesai}% selesai, ${angka.total.lewatTenggat} lewat tenggat.` +
    (angka.ditahan > 0
      ? `\nAda ${angka.ditahan} kelompok yang angkanya ditahan karena anggotanya kurang dari lima orang.`
      : "")

  const hasil = await tanyaJson(
    {
      sistem: SISTEM + (bahasa === "en" ? "\n- Tulis jawabannya dalam bahasa Inggris." : ""),
      prompt: `Ringkas keadaan pelatihan berikut.\n\n${konteks}\n\nPer departemen:\n${baris}`,
      skema: SKEMA as unknown as Record<string, unknown>,
      maxOutputTokens: 400 + angka.departemen.length * 60,
    },
    periksa
  )

  if (!hasil.ok) return hasil
  return {
    ok: true,
    data: { ringkasan: hasil.data, model: modelAi() },
    token: hasil.token,
    terpotong: hasil.terpotong,
  }
}
