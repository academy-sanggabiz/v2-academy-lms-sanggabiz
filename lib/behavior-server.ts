import { createClient } from "@/lib/supabase/server"

/**
 * Ringkasan perilaku belajar untuk superadmin.
 *
 * Seluruh angkanya berasal dari `learning_events`, yang hanya bisa terisi
 * bila pesertanya menyetujui (docs/STANDAR-PELACAKAN.md). Karena itu angka
 * ini **tidak mewakili seluruh peserta** -- hanya yang menyetujui. Jumlah
 * yang menyetujui ikut dibaca supaya layarnya bisa mengatakan itu terus
 * terang, bukan menyajikan rata-rata yang terbaca seolah-olah menyeluruh.
 */

export type BehaviorCourse = {
  courseId: string
  courseTitle: string
  peserta: number
  totalDetik: number
  rataDetikPerPeserta: number
  terakhir: string | null
}

export type ConsentCounts = {
  menyetujui: number
  menolak: number
  belumMemutuskan: number
}

export type BehaviorSummary = {
  courses: BehaviorCourse[]
  consent: ConsentCounts
  /** False bila fungsinya belum ada di basis data. */
  ready: boolean
}

export async function getBehaviorSummary(): Promise<BehaviorSummary> {
  const supabase = await createClient()
  const [ringkasan, persetujuan] = await Promise.all([
    supabase.rpc("admin_behavior_summary"),
    supabase.rpc("admin_consent_counts"),
  ])

  if (ringkasan.error) {
    console.error("getBehaviorSummary failed:", ringkasan.error.message)
    return {
      courses: [],
      consent: { menyetujui: 0, menolak: 0, belumMemutuskan: 0 },
      ready: false,
    }
  }

  const c = (persetujuan.data as Record<string, number>[] | null)?.[0]
  return {
    courses: ((ringkasan.data ?? []) as Record<string, unknown>[]).map((r) => ({
      courseId: r.course_id as string,
      courseTitle: r.course_title as string,
      peserta: Number(r.peserta ?? 0),
      totalDetik: Number(r.total_detik ?? 0),
      rataDetikPerPeserta: Number(r.rata_detik_per_peserta ?? 0),
      terakhir: (r.terakhir as string | null) ?? null,
    })),
    consent: {
      menyetujui: Number(c?.menyetujui ?? 0),
      menolak: Number(c?.menolak ?? 0),
      belumMemutuskan: Number(c?.belum_memutuskan ?? 0),
    },
    ready: true,
  }
}
