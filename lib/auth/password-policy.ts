/**
 * Panjang minimum kata sandi, satu sumber untuk seluruh aplikasi.
 *
 * Harus sama dengan `auth.minimum_password_length` di supabase/config.toml:
 * kalau aplikasi menerima kata sandi yang kemudian ditolak Supabase, peserta
 * mendapat pesan galat dari server yang tidak pernah muncul di form.
 *
 * 8 karakter mengikuti NIST SP 800-63B; nilai sebelumnya, 6, adalah batas
 * terendah yang diizinkan Supabase dan terlalu longgar untuk akun yang memuat
 * nama dan riwayat belajar orang.
 */
export const MIN_PASSWORD_LENGTH = 8
