/**
 * Memilih bentuk tunggal atau jamak untuk satu hitungan.
 *
 * Bahasa Indonesia tidak membedakan keduanya ("1 pelajaran", "5 pelajaran"),
 * jadi selama antarmukanya satu bahasa, menempelkan angka di depan kata benda
 * selalu benar. Begitu bahasa Inggris masuk, pola yang sama menghasilkan
 * "1 practice quizzes" -- salah, dan justru di halaman yang dibaca orang yang
 * belum kenal platform ini.
 *
 * Yang dipakai bukan `Intl.PluralRules` melainkan dua string di kamus: kedua
 * bahasa yang didukung hanya punya bentuk "satu" dan "banyak", dan dua kunci
 * yang terlihat berdampingan di kamus jauh lebih mudah diperiksa penerjemah
 * daripada aturan yang tersembunyi di dalam kode.
 */
export function plural(count: number, one: string, many: string): string {
  return (count === 1 ? one : many).replace("{n}", String(count))
}
