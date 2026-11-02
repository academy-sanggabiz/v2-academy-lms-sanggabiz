/**
 * Pengacakan urutan soal dan pilihan jawaban per percobaan.
 *
 * Dibuat setelah batas percobaan dicabut: kalau peserta boleh mengulang sampai
 * lulus, kuis yang selalu tampil persis sama mengundang menghafal posisi --
 * "jawabannya yang kedua" -- alih-alih memahami materinya.
 *
 * **Benihnya id percobaan, bukan angka acak.** Dengan begitu urutannya tetap
 * sama selama satu percobaan: menyegarkan halaman atau kembali ke soal
 * sebelumnya tidak mengacak ulang di tengah jalan, yang akan membuat jawaban
 * yang sudah dipilih menunjuk pilihan yang berbeda. Percobaan berikutnya punya
 * id berbeda, jadi urutannya pun berbeda.
 *
 * Pengacakan terjadi **hanya di pemutar peserta**, bukan di `getCourseDetail`:
 * pratinjau pengelola dan editor kursus harus tetap menampilkan urutan yang
 * ditulis penyusunnya.
 */

/** Hash string 32-bit (FNV-1a) untuk dijadikan benih. */
function hashSeed(value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** PRNG kecil dan deterministik (mulberry32). */
function createRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Salinan acak dari sebuah larik. Fisher–Yates, berjalan mundur, memakai PRNG
 * di atas -- bukan `Math.random()`, supaya hasilnya bisa diulang.
 */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const result = [...items]
  const random = createRandom(hashSeed(seed))
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

type ShuffleableQuestion = { id: string; options?: { id: string }[] }

/**
 * Urutan tampil untuk satu percobaan. Soal dan pilihan di dalamnya diacak
 * dengan benih berbeda supaya dua soal tidak pernah ikut pola yang sama.
 *
 * `enabled` false mengembalikan urutan aslinya apa adanya -- tidak menyalin,
 * tidak mengurutkan ulang.
 */
export function orderQuestionsForAttempt<T extends ShuffleableQuestion>(
  questions: readonly T[],
  {
    enabled,
    attemptId,
    drawnIds = null,
  }: {
    enabled: boolean
    attemptId: string | null
    /**
     * Soal yang ditarik untuk percobaan ini, dipilih basis data saat percobaan
     * dibuat. NULL berarti seluruh soal kuis.
     *
     * Penyaringannya memakai daftar ini apa adanya dan tidak pernah menebak:
     * penilaian di server memakai daftar yang sama, jadi apa pun yang tampil
     * di sini harus persis itu. Soal yang namanya ada di daftar tetapi sudah
     * dihapus penyusun hilang dengan sendirinya karena tidak ketemu di
     * `questions`.
     */
    drawnIds?: string[] | null
  }
): T[] {
  const dipakai = drawnIds ? questions.filter((q) => drawnIds.includes(q.id)) : questions
  if (!enabled || !attemptId) return [...dipakai]

  return seededShuffle(dipakai, `${attemptId}:soal`).map((question) =>
    question.options && question.options.length > 0
      ? { ...question, options: seededShuffle(question.options, `${attemptId}:${question.id}`) }
      : question
  )
}
