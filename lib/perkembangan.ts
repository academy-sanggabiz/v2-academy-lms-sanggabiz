/**
 * Perkembangan: selisih pretest dan posttest, dipecah per modul.
 *
 * Bebas dari modul server supaya komponen peramban bisa memakai tipenya,
 * aturan yang sama dengan lib/org.ts dan lib/courses.ts.
 *
 * == Kenapa per modul, bukan satu angka ==
 *
 * "Nilai naik 30 poin" tidak bisa ditindaklanjuti siapa pun. "Modul 3 tidak
 * naik sementara modul lain naik" bisa: itu menunjuk satu bagian materi untuk
 * diperbaiki. Pemetaannya datang dari `questions.measured_section_id`, yang
 * wajib diisi di setiap soal kuis ukur -- lihat validateQuizzes.
 */

/** Berapa pasang pretest-posttest minimal sebelum angka kelas ditampilkan.
 *
 *  Sama dengan AMBANG_ANONIMITAS di lib/catalog-server.ts, dan alasannya
 *  sama: di kelas berisi empat orang, "rata-rata modul 2 turun" ditambah
 *  sedikit pengetahuan tentang siapa ikut kelas itu menunjuk satu orang.
 *  Jangan diturunkan supaya layarnya terlihat lebih ramai. */
export const AMBANG_PASANGAN = 5

export type ModulKenaikan = {
  sectionId: string
  title: string
  /** Persen benar saat pretest, 0-100. */
  sebelum: number
  /** Persen benar saat posttest, 0-100. */
  sesudah: number
  /** sesudah - sebelum. Negatif berarti turun, dan itu memang bisa terjadi. */
  selisih: number
  /** Berapa soal mengukur modul ini. Dipakai layar untuk berkata jujur
   *  bahwa dua soal bukan ukuran yang kuat. */
  soal: number
}

export type PerkembanganPeserta = {
  /** null bila pretest atau posttest belum dikerjakan. */
  sebelum: number | null
  sesudah: number | null
  modul: ModulKenaikan[]
  adaPretest: boolean
  adaPosttest: boolean
}

export type PerkembanganKursus = {
  /** Berapa peserta punya pretest DAN posttest yang sah. */
  pasangan: number
  /** false bila di bawah AMBANG_PASANGAN -- angkanya ditahan, bukan dibulatkan. */
  cukup: boolean
  rataSebelum: number
  rataSesudah: number
  modul: ModulKenaikan[]
  /** Pasangan yang dibuang karena pretest dikerjakan setelah peserta mulai
   *  belajar. Ditampilkan, bukan disembunyikan: angka yang dibuang diam-diam
   *  membuat jumlah di layar tidak cocok dengan jumlah peserta. */
  dibuang: number
}

/** Satu jawaban yang sudah dipetakan ke modul. */
export type JawabanTerukur = {
  sectionId: string
  benar: boolean
}

/**
 * Persen benar per modul untuk satu kumpulan jawaban.
 *
 * Dipisahkan dari pembacaan basis data supaya bisa diuji tanpa basis data,
 * dan supaya sisi peserta dan sisi mentor memakai rumus yang sama persis --
 * dua layar yang menghitung "kenaikan" sendiri-sendiri pasti berbeda suatu
 * hari, dan yang satu akan terlihat seperti bohong.
 */
export function persenPerModul(jawaban: JawabanTerukur[]): Map<string, { benar: number; total: number }> {
  const peta = new Map<string, { benar: number; total: number }>()
  for (const j of jawaban) {
    const b = peta.get(j.sectionId) ?? { benar: 0, total: 0 }
    b.total += 1
    if (j.benar) b.benar += 1
    peta.set(j.sectionId, b)
  }
  return peta
}

export function persen(benar: number, total: number): number {
  return total === 0 ? 0 : Math.round((benar / total) * 100)
}

/**
 * Menggabungkan jawaban pretest dan posttest menjadi daftar kenaikan per
 * modul. Modul yang tidak diukur SALAH SATU sisi dibuang: "naik dari tidak
 * diukur" bukan kalimat yang punya arti.
 */
export function kenaikanPerModul(
  pre: Map<string, { benar: number; total: number }>,
  post: Map<string, { benar: number; total: number }>,
  judulModul: Map<string, string>,
  urutan: string[]
): ModulKenaikan[] {
  const hasil: ModulKenaikan[] = []
  for (const sectionId of urutan) {
    const a = pre.get(sectionId)
    const b = post.get(sectionId)
    if (!a || !b || a.total === 0 || b.total === 0) continue
    const sebelum = persen(a.benar, a.total)
    const sesudah = persen(b.benar, b.total)
    hasil.push({
      sectionId,
      title: judulModul.get(sectionId) ?? "",
      sebelum,
      sesudah,
      selisih: sesudah - sebelum,
      // Soal pretest dan posttest untuk satu modul bisa berbeda jumlahnya;
      // yang ditampilkan jumlah terkecil, karena itu yang membatasi seberapa
      // kuat pernyataannya.
      soal: Math.min(a.total, b.total),
    })
  }
  return hasil
}

/** Satu percobaan kuis ukur, sebatas yang dibutuhkan pemilihan pasangan. */
export type PercobaanUkur = {
  learnerId: string
  jenis: "pretest" | "posttest"
  /** Pretest yang dikerjakan setelah orangnya mulai belajar. */
  setelahMulai: boolean
}

/**
 * Siapa saja yang pasangan pretest-posttest-nya SAH, dan berapa yang dibuang.
 *
 * Fungsi murni supaya bagian yang paling perlu benar bisa diuji tanpa basis
 * data: aturan ambang di sinilah yang menjaga kelas kecil tidak menunjuk satu
 * orang, dan aturan itu tidak boleh bergantung pada apakah seseorang ingat
 * menulisnya ulang dengan benar di layar.
 */
export function pilihPasangan(percobaan: PercobaanUkur[]): {
  sah: string[]
  dibuang: number
  cukup: boolean
} {
  const punyaPre = new Set<string>()
  const tercemar = new Set<string>()
  const punyaPost = new Set<string>()
  for (const p of percobaan) {
    if (p.jenis === "pretest") {
      punyaPre.add(p.learnerId)
      if (p.setelahMulai) tercemar.add(p.learnerId)
    } else {
      punyaPost.add(p.learnerId)
    }
  }
  const keduanya = [...punyaPre].filter((id) => punyaPost.has(id))
  const sah = keduanya.filter((id) => !tercemar.has(id))
  return { sah, dibuang: keduanya.length - sah.length, cukup: sah.length >= AMBANG_PASANGAN }
}
