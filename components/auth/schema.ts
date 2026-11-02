import { z } from "zod"
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy"

/**
 * Konfirmasi kata sandi sengaja TIDAK ada di sini.
 *
 * Ruas itu dulu menangkap salah ketik pada masa ketika kata sandi selalu
 * tersembunyi. Form ini punya tombol lihat-sandi, jadi orang bisa memeriksa
 * ketikannya sendiri -- dan satu ruas lebih sedikit berarti satu kesempatan
 * gagal lebih sedikit pada layar pertama yang dilihat peserta baru. Kalau ada
 * salah ketik yang lolos, jalur lupa sandi sudah tersedia dan tidak mahal.
 */
export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Nama lengkap wajib diisi"),
  email: z.string().trim().email("Masukkan email yang valid"),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter`),
})

export type SignupFormValues = z.infer<typeof signupSchema>
