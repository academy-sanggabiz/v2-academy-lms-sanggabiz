import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  rupiah,
  type BarisPemakaian,
  type LaporanPemakaian,
  type RingkasanFitur,
} from "@/lib/ai-usage"

/**
 * Laporan pemakaian AI untuk superadmin.
 *
 * Dibaca dengan SERVICE ROLE, dan itu keputusan sadar: `ai_usage` dikunci
 * own-row (lihat scripts/rls-mvp-check.mjs -- peserta tidak bisa membaca
 * baris orang lain, dan itu harus tetap begitu). Laporan lintas orang tidak
 * bisa ada tanpa menembus RLS, jadi yang menjaganya adalah `requireSuperAdmin()`
 * di layar pemanggil, bukan policy.
 *
 * Khusus superadmin, bukan mentor. Pemakaian AI per orang adalah data tentang
 * orang: berapa sering seorang mentor meminta bantuan, berapa sering seorang
 * peserta bertanya. Mentor tidak perlu melihat angka mentor lain, dan tidak
 * seorang pun perlu melihat pertanyaan yang diajukan -- laporan ini hanya
 * memuat hitungan, tidak pernah isi percakapan.
 */

/**
 * Harga satu juta token dalam rupiah, dari `AI_HARGA_PER_JUTA_TOKEN`.
 *
 * Tidak ada nilai bawaan. Tarif tiap penyedia berbeda dan berubah; menanam
 * satu angka di kode berarti layar ini akan menampilkan biaya yang salah
 * dengan penuh percaya diri, dan tidak ada yang akan curiga. Tanpa setelan
 * ini layarnya menampilkan token saja dan mengatakan kenapa.
 */
function hargaPerJuta(): number | null {
  const mentah = process.env.AI_HARGA_PER_JUTA_TOKEN
  if (!mentah) return null
  const angka = Number(mentah)
  return Number.isFinite(angka) && angka > 0 ? angka : null
}

type BarisMentah = { user_id: string; feature: string; tokens: number | null; created_at: string }

export async function getLaporanPemakaian(hari = 30): Promise<LaporanPemakaian> {
  const harga = hargaPerJuta()
  const admin = createAdminClient()

  const sejak = new Date()
  sejak.setDate(sejak.getDate() - hari)
  sejak.setHours(0, 0, 0, 0)

  const { data, error } = await admin
    .from("ai_usage")
    .select("user_id, feature, tokens, created_at")
    .gte("created_at", sejak.toISOString())
    .order("created_at", { ascending: false })
    .limit(20_000)

  const kosong: LaporanPemakaian = {
    hari,
    totalPanggilan: 0,
    totalToken: 0,
    totalBiaya: harga === null ? null : 0,
    hargaPerJuta: harga,
    orang: [],
    fitur: [],
  }

  if (error || !data) {
    if (error) console.error("getLaporanPemakaian gagal:", error.message)
    return kosong
  }

  const baris = data as BarisMentah[]
  if (baris.length === 0) return kosong

  const perOrang = new Map<string, { panggilan: number; token: number; terakhir: string }>()
  const perFitur = new Map<string, { panggilan: number; token: number }>()
  let totalToken = 0

  for (const b of baris) {
    const token = b.tokens ?? 0
    totalToken += token

    const o = perOrang.get(b.user_id) ?? { panggilan: 0, token: 0, terakhir: b.created_at }
    o.panggilan += 1
    o.token += token
    // Baris datang terurut menurun, jadi yang pertama terlihat adalah yang
    // terbaru; tidak perlu membandingkan tanggal.
    perOrang.set(b.user_id, o)

    const f = perFitur.get(b.feature) ?? { panggilan: 0, token: 0 }
    f.panggilan += 1
    f.token += token
    perFitur.set(b.feature, f)
  }

  // Nama dan peran diambil sekali untuk semua id, bukan satu kueri per orang.
  const ids = [...perOrang.keys()]
  const { data: profil } = await admin
    .from("profiles")
    .select("id, full_name, email, role")
    .in("id", ids)

  const petaProfil = new Map(
    ((profil ?? []) as { id: string; full_name: string | null; email: string | null; role: string }[]).map(
      (p) => [p.id, p]
    )
  )

  const orang: BarisPemakaian[] = ids
    .map((id) => {
      const o = perOrang.get(id)!
      const p = petaProfil.get(id)
      return {
        userId: id,
        nama: p?.full_name || p?.email || "Pengguna terhapus",
        email: p?.email ?? "",
        peran: p?.role ?? "",
        panggilan: o.panggilan,
        token: o.token,
        biaya: rupiah(o.token, harga),
        terakhir: o.terakhir,
      }
    })
    .sort((a, b) => b.token - a.token)

  const fitur: RingkasanFitur[] = [...perFitur.entries()]
    .map(([f, v]) => ({ fitur: f, panggilan: v.panggilan, token: v.token, biaya: rupiah(v.token, harga) }))
    .sort((a, b) => b.token - a.token)

  return {
    hari,
    totalPanggilan: baris.length,
    totalToken,
    totalBiaya: rupiah(totalToken, harga),
    hargaPerJuta: harga,
    orang,
    fitur,
  }
}

/**
 * Berapa token yang sudah dipakai seseorang untuk fitur tertentu hari ini.
 *
 * Dipakai pagar harian. Menjumlahkan TOKEN, bukan menghitung baris: yang
 * dijaga biayanya, dan satu panggilan bisa seratus kali lebih mahal daripada
 * panggilan lain.
 */
export async function tokenHariIni(userId: string, fitur: readonly string[]): Promise<number> {
  const admin = createAdminClient()
  const awalHari = new Date()
  awalHari.setHours(0, 0, 0, 0)

  const { data, error } = await admin
    .from("ai_usage")
    .select("tokens")
    .eq("user_id", userId)
    .in("feature", fitur as string[])
    .gte("created_at", awalHari.toISOString())

  if (error || !data) {
    if (error) console.error("tokenHariIni gagal:", error.message)
    // Gagal membaca pemakaian TIDAK boleh membuka pagar. Dikembalikan nol
    // berarti "silakan jalan terus", jadi yang dikembalikan adalah angka
    // yang menutup -- lebih baik satu orang tertahan sehari daripada batas
    // biaya hilang diam-diam setiap kali basis data tersendat.
    return Number.MAX_SAFE_INTEGER
  }

  return (data as { tokens: number | null }[]).reduce((n, r) => n + (r.tokens ?? 0), 0)
}
