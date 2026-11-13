/**
 * Laporan pelatihan per departemen (F3).
 *
 * Bebas dari modul server supaya komponen di peramban bisa memakai tipenya --
 * aturan yang sama dengan `lib/org.ts`, `lib/perkembangan.ts`, dan
 * `lib/ai-usage.ts`.
 *
 * == Tiga aturan yang tidak boleh dilanggar ==
 *
 * `docs/MVP-AI-KORPORAT-STATUS.md` menetapkan F3 dengan tiga batasan, dan
 * ketiganya hidup di berkas ini supaya tidak bisa hilang diam-diam saat
 * layarnya diubah:
 *
 * 1. **Kelompok di bawah lima orang tidak menampilkan angka.** Lihat
 *    `AMBANG_LAPORAN`.
 * 2. **Ringkasan AI hanya boleh melihat angka agregat.** `keAngkaRingkas()`
 *    adalah satu-satunya bentuk yang dikirim ke model, dan tipenya tidak
 *    punya tempat untuk nama atau id orang.
 * 3. **Tidak ada pemeringkatan orang.** Tidak ada satu pun fungsi di sini
 *    yang mengembalikan baris per orang. Departemen boleh diurutkan;
 *    orang tidak pernah.
 */

import { AMBANG_ANONIMITAS } from "@/lib/anonimitas"

/**
 * Jumlah orang paling sedikit sebelum angka sebuah departemen ditampilkan.
 *
 * Nilainya `AMBANG_ANONIMITAS` (lib/anonimitas.ts), satu definisi untuk
 * seluruh aplikasi. Pada organisasi sebesar ini "penyelesaian 50% di
 * Keuangan" yang berasal dari dua orang bukan statistik, melainkan cara
 * menyebut nama seseorang tanpa menuliskannya.
 *
 * Yang disembunyikan ANGKANYA, bukan departemennya. Menghilangkan barisnya
 * membuat jumlah tidak pernah cocok dan membuat pengelola mengira datanya
 * rusak; menampilkan nama departemen dengan alasan kenapa angkanya kosong
 * justru memberi tahu apa yang perlu dilakukan.
 */
export const AMBANG_LAPORAN = AMBANG_ANONIMITAS

export type AngkaDepartemen = {
  /** Pendaftaran kursus milik orang-orang di departemen ini. */
  pendaftaran: number
  /** Berapa orang punya setidaknya satu pendaftaran. */
  terdaftar: number
  selesai: number
  /** 0-100. Nol bila belum ada pendaftaran sama sekali. */
  persenSelesai: number
  sertifikat: number
  /** Kursus wajib dari jalur jabatan yang belum didaftar sama sekali. */
  wajibBelumMulai: number
  /** Pendaftaran yang tenggatnya sudah lewat dan belum tuntas. */
  lewatTenggat: number
}

export type BarisDepartemen = {
  /** null berarti baris "tanpa departemen". */
  id: string | null
  /** null berarti baris "tanpa departemen"; layar memakai label kamus. */
  nama: string | null
  /**
   * Selalu ditampilkan, juga di bawah ambang.
   *
   * Jumlah kepala adalah fakta struktur organisasi yang sudah terlihat di
   * layar Jabatan & Departemen, bukan data perilaku belajar. Yang dilindungi
   * ambang ini adalah apa yang orang-orang itu KERJAKAN.
   */
  orang: number
  /** null ketika `orang` di bawah `AMBANG_LAPORAN`. */
  angka: AngkaDepartemen | null
}

export type MasukanPeserta = {
  learnerId: string
  departmentId: string | null
  jobTitleId: string | null
}

export type MasukanPendaftaran = {
  learnerId: string
  courseId: string
  selesai: boolean
  /** Tenggat tampilan dari jalur jabatan, bila ada. */
  dueAt: string | null
  bersertifikat: boolean
}

/** Satu kursus wajib pada jalur sebuah jabatan. */
export type MasukanWajib = {
  jobTitleId: string
  courseId: string
}

function kosong(): AngkaDepartemen {
  return {
    pendaftaran: 0,
    terdaftar: 0,
    selesai: 0,
    persenSelesai: 0,
    sertifikat: 0,
    wajibBelumMulai: 0,
    lewatTenggat: 0,
  }
}

/**
 * Menghitung satu baris per departemen, ditambah satu baris "tanpa
 * departemen".
 *
 * Fungsi murni supaya bagian yang menentukan angka apa yang dilihat pengelola
 * -- dan angka apa yang ditahan ambang -- bisa diuji tanpa basis data.
 *
 * Baris "tanpa departemen" ikut dihitung dengan sengaja: pada praktiknya
 * itulah baris terbesar di awal pemakaian, dan menyembunyikannya membuat
 * laporan terlihat lengkap padahal sebagian besar orang tidak terwakili.
 */
export function hitungLaporanDepartemen(
  departemen: { id: string; nama: string }[],
  peserta: MasukanPeserta[],
  pendaftaran: MasukanPendaftaran[],
  wajib: MasukanWajib[],
  sekarang: Date = new Date()
): BarisDepartemen[] {
  const wajibPerJabatan = new Map<string, Set<string>>()
  for (const w of wajib) {
    let set = wajibPerJabatan.get(w.jobTitleId)
    if (!set) wajibPerJabatan.set(w.jobTitleId, (set = new Set()))
    set.add(w.courseId)
  }

  const departemenPerOrang = new Map<string, string | null>()
  const jabatanPerOrang = new Map<string, string | null>()
  for (const p of peserta) {
    departemenPerOrang.set(p.learnerId, p.departmentId)
    jabatanPerOrang.set(p.learnerId, p.jobTitleId)
  }

  const kunci = (id: string | null) => id ?? "__tanpa__"
  const angkaPer = new Map<string, AngkaDepartemen>()
  const orangPer = new Map<string, number>()
  const punyaPendaftaran = new Map<string, Set<string>>()
  const kursusPerOrang = new Map<string, Set<string>>()

  for (const d of departemen) {
    angkaPer.set(kunci(d.id), kosong())
    orangPer.set(kunci(d.id), 0)
  }
  angkaPer.set(kunci(null), kosong())
  orangPer.set(kunci(null), 0)

  for (const p of peserta) {
    const k = kunci(p.departmentId)
    // Orang yang departemennya sudah dihapus jatuh ke baris "tanpa
    // departemen", bukan hilang dari laporan. `on delete set null` di
    // `profiles.department_id` memang membuat keadaan ini mungkin.
    if (!orangPer.has(k)) {
      orangPer.set(kunci(null), (orangPer.get(kunci(null)) ?? 0) + 1)
      continue
    }
    orangPer.set(k, (orangPer.get(k) ?? 0) + 1)
  }

  const batas = sekarang.getTime()
  for (const e of pendaftaran) {
    const dept = departemenPerOrang.get(e.learnerId)
    if (dept === undefined) continue // bukan peserta, mis. akun pengelola
    const k = angkaPer.has(kunci(dept)) ? kunci(dept) : kunci(null)
    const a = angkaPer.get(k)!

    a.pendaftaran += 1
    if (e.selesai) a.selesai += 1
    if (e.bersertifikat) a.sertifikat += 1
    if (!e.selesai && e.dueAt && new Date(e.dueAt).getTime() < batas) a.lewatTenggat += 1

    let set = punyaPendaftaran.get(k)
    if (!set) punyaPendaftaran.set(k, (set = new Set()))
    set.add(e.learnerId)

    let kursus = kursusPerOrang.get(e.learnerId)
    if (!kursus) kursusPerOrang.set(e.learnerId, (kursus = new Set()))
    kursus.add(e.courseId)
  }

  for (const p of peserta) {
    const diwajibkan = p.jobTitleId ? wajibPerJabatan.get(p.jobTitleId) : undefined
    if (!diwajibkan || diwajibkan.size === 0) continue
    const k = angkaPer.has(kunci(p.departmentId)) ? kunci(p.departmentId) : kunci(null)
    const diikuti = kursusPerOrang.get(p.learnerId)
    for (const courseId of diwajibkan) {
      if (!diikuti?.has(courseId)) angkaPer.get(k)!.wajibBelumMulai += 1
    }
  }

  const baris: BarisDepartemen[] = []
  const susun = (id: string | null, nama: string | null) => {
    const k = kunci(id)
    const orang = orangPer.get(k) ?? 0
    const a = angkaPer.get(k)!
    a.terdaftar = punyaPendaftaran.get(k)?.size ?? 0
    a.persenSelesai = a.pendaftaran > 0 ? Math.round((a.selesai / a.pendaftaran) * 100) : 0
    baris.push({ id, nama, orang, angka: orang >= AMBANG_LAPORAN ? a : null })
  }

  for (const d of departemen) susun(d.id, d.nama)
  // Baris "tanpa departemen" selalu paling bawah: ia bukan departemen, dan
  // mengurutkannya bersama yang lain membuatnya terbaca seolah-olah satu.
  const tanpa = orangPer.get(kunci(null)) ?? 0
  if (tanpa > 0) susun(null, null)

  return baris
}

/** Angka seluruh organisasi, dari baris yang angkanya memang ditampilkan. */
export type TotalLaporan = {
  departemen: number
  /** Berapa departemen yang angkanya ditahan ambang. */
  ditahan: number
  orang: number
  pendaftaran: number
  selesai: number
  persenSelesai: number
  sertifikat: number
  lewatTenggat: number
  wajibBelumMulai: number
}

export function totalLaporan(baris: BarisDepartemen[]): TotalLaporan {
  const t: TotalLaporan = {
    departemen: baris.filter((b) => b.id !== null).length,
    ditahan: baris.filter((b) => b.angka === null).length,
    orang: 0,
    pendaftaran: 0,
    selesai: 0,
    persenSelesai: 0,
    sertifikat: 0,
    lewatTenggat: 0,
    wajibBelumMulai: 0,
  }
  for (const b of baris) {
    t.orang += b.orang
    if (!b.angka) continue
    t.pendaftaran += b.angka.pendaftaran
    t.selesai += b.angka.selesai
    t.sertifikat += b.angka.sertifikat
    t.lewatTenggat += b.angka.lewatTenggat
    t.wajibBelumMulai += b.angka.wajibBelumMulai
  }
  t.persenSelesai = t.pendaftaran > 0 ? Math.round((t.selesai / t.pendaftaran) * 100) : 0
  return t
}

/**
 * Bentuk yang dikirim ke model bahasa -- dan satu-satunya yang boleh.
 *
 * Tipenya sengaja tidak punya ruas untuk id, nama orang, surel, atau judul
 * kursus. Bukan karena model akan menyalahgunakannya, melainkan karena
 * pembatasan yang dijaga TIPE tidak bisa lolos lewat perubahan yang terburu-
 * buru; sedangkan pembatasan yang hanya ditulis di prompt bisa.
 *
 * Nama departemen ikut, dan itu disengaja: ringkasan yang menyebut
 * "departemen 3" tidak berguna bagi pembacanya, dan nama departemen bukan
 * data pribadi.
 */
export type AngkaRingkas = {
  departemen: {
    nama: string
    orang: number
    pendaftaran: number
    selesai: number
    persenSelesai: number
    lewatTenggat: number
    wajibBelumMulai: number
  }[]
  total: { orang: number; pendaftaran: number; persenSelesai: number; lewatTenggat: number }
  /** Berapa departemen yang angkanya ditahan ambang, supaya model menyebutnya. */
  ditahan: number
}

/**
 * Membandingkan dua kumpulan angka tanpa peduli urutan kunci.
 *
 * `JSON.stringify` tidak cukup, dan ini bukan kehati-hatian berlebihan:
 * `ai_report_summaries.figures` bertipe `jsonb`, dan **jsonb menyusun ulang
 * kunci objek** saat menyimpan. Membandingkan hasil `stringify` karena itu
 * selalu berbeda -- ringkasan yang baru saja dibuat pun langsung dicap
 * "angkanya sudah berubah", yang justru melatih pembacanya mengabaikan
 * peringatan itu.
 */
export function samaAngka(a: unknown, b: unknown): boolean {
  return kanonik(a) === kanonik(b)
}

function kanonik(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null"
  if (Array.isArray(v)) return `[${v.map(kanonik).join(",")}]`
  const o = v as Record<string, unknown>
  return `{${Object.keys(o)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${kanonik(o[k])}`)
    .join(",")}}`
}

export function keAngkaRingkas(
  baris: BarisDepartemen[],
  labelTanpaDepartemen: string
): AngkaRingkas {
  const t = totalLaporan(baris)
  return {
    departemen: baris
      .filter((b) => b.angka !== null)
      .map((b) => ({
        nama: b.nama ?? labelTanpaDepartemen,
        orang: b.orang,
        pendaftaran: b.angka!.pendaftaran,
        selesai: b.angka!.selesai,
        persenSelesai: b.angka!.persenSelesai,
        lewatTenggat: b.angka!.lewatTenggat,
        wajibBelumMulai: b.angka!.wajibBelumMulai,
      })),
    total: {
      orang: t.orang,
      pendaftaran: t.pendaftaran,
      persenSelesai: t.persenSelesai,
      lewatTenggat: t.lewatTenggat,
    },
    ditahan: t.ditahan,
  }
}
