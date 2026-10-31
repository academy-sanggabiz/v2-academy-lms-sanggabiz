import { z } from "zod"
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy"

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(1, "Nama lengkap wajib diisi"),
    email: z.string().trim().email("Masukkan email yang valid"),
    password: z.string().min(MIN_PASSWORD_LENGTH, `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter`),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Kata sandi tidak cocok",
    path: ["confirmPassword"],
  })

export type SignupFormValues = z.infer<typeof signupSchema>
