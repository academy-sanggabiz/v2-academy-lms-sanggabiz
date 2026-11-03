/**
 * Postgres/PostgREST/Storage errors arrive in English. The UI is Indonesian,
 * so admin/learner-facing actions pass the raw message through here: it is
 * logged for debugging and replaced with a short Indonesian sentence.
 */
export function dbErrorMessage(message: string | undefined | null, fallback = "Terjadi kesalahan. Coba lagi."): string {
  if (!message) return fallback
  console.error("database error:", message)
  if (/row-level security|permission denied|not authorized/i.test(message)) {
    return "Anda tidak memiliki akses untuk tindakan ini. Masuk kembali, atau hubungi admin bila seharusnya punya akses."
  }
  if (/duplicate key|already exists/i.test(message)) return "Data ini sudah ada. Periksa daftar yang sudah tersimpan."
  if (/foreign key/i.test(message)) return "Data ini masih dipakai di tempat lain. Hapus dulu data yang memakainya."
  if (/payload too large|exceeded the maximum allowed size/i.test(message)) return "Ukuran berkas terlalu besar. Perkecil berkasnya lalu unggah lagi."
  if (/bucket not found/i.test(message)) return "Penyimpanan berkas belum disiapkan. Hubungi admin platform."
  if (/fetch failed|network/i.test(message)) return "Koneksi bermasalah. Coba lagi."
  return fallback
}
