import type { AuthorableQuestionType } from "@/lib/courses"

/**
 * Jenis soal yang bisa ditulis penyusun, satu daftar untuk editor kuis dan
 * bank soal. Sempat hanya ada di dalam QuizEditor; begitu bank soal ikut
 * memerlukannya, menyalinnya berarti dua daftar yang akan berbeda setelah
 * beberapa perubahan.
 *
 * `essay` dan `file_upload` sengaja tidak di sini: keduanya dibuat lewat
 * jalur "studi kasus", bukan lewat pemilih jenis soal biasa.
 */
export const QUESTION_TYPES: { value: AuthorableQuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Pilihan Ganda" },
  { value: "true_false", label: "Benar / Salah" },
  { value: "short_answer", label: "Isian Singkat" },
]
