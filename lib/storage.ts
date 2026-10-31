import { createClient } from "@/lib/supabase/client"
import { dbErrorMessage } from "@/lib/db-error-message"

/**
 * Jenis gambar yang boleh diunggah. SVG sengaja tidak ada: SVG dapat memuat
 * `<script>`, dan berkas di bucket publik disajikan untuk dibuka peramban
 * (docs/STANDAR-PROFIL-PESERTA.md F2).
 *
 * Pemeriksaan di berkas ini hanya untuk memberi pesan galat yang enak dibaca.
 * Penegakan sebenarnya ada di `allowed_mime_types` dan `file_size_limit` milik
 * bucket (migrasi 20261101010000): `file.type` berasal dari peramban, dan
 * siapa pun bisa melewati berkas ini dengan memanggil Storage langsung.
 */
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

/** Daftar bucket `avatars` lebih sempit: lihat migrasi 20261101010000. */
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"]

const TYPE_LABEL: Record<string, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/webp": "WebP",
  "image/gif": "GIF",
}

function describeType(mime: string): string {
  return TYPE_LABEL[mime] ?? mime
}

async function uploadToBucket(
  bucket: string,
  file: File,
  maxBytes: number,
  { pathPrefix = "", allowedTypes = ALLOWED_IMAGE_TYPES }: { pathPrefix?: string; allowedTypes?: string[] } = {}
): Promise<{ url: string } | { error: string }> {
  if (!allowedTypes.includes(file.type)) {
    return { error: `Pilih berkas gambar ${allowedTypes.map(describeType).join(", ")}.` }
  }
  if (file.size > maxBytes) {
    return { error: `Ukuran gambar maksimal ${Math.round(maxBytes / (1024 * 1024))}MB` }
  }

  const supabase = createClient()
  const extension = file.name.split(".").pop() || "jpg"
  const path = `${pathPrefix}${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file)
  if (uploadError) return { error: dbErrorMessage(uploadError.message) }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl }
}

export function uploadCourseThumbnail(file: File) {
  return uploadToBucket("course-thumbnails", file, 5 * 1024 * 1024)
}

export function uploadCertificateTemplate(file: File) {
  return uploadToBucket("certificate-assets", file, 5 * 1024 * 1024)
}

export function uploadSignatureImage(file: File) {
  return uploadToBucket("certificate-assets", file, 1 * 1024 * 1024)
}

export function uploadLessonImage(file: File) {
  return uploadToBucket("lesson-content", file, 5 * 1024 * 1024)
}

/**
 * Foto profil peserta. Jalurnya diawali id penggunanya karena policy Storage
 * mengunci segmen pertama ke `auth.uid()`; tanpa itu satu peserta bisa menimpa
 * foto peserta lain (docs/STANDAR-PROFIL-PESERTA.md F3).
 */
export function uploadAvatar(file: File, userId: string) {
  if (!userId) return Promise.resolve({ error: "Anda belum masuk." })
  return uploadToBucket("avatars", file, 2 * 1024 * 1024, {
    pathPrefix: `${userId}/`,
    allowedTypes: ALLOWED_AVATAR_TYPES,
  })
}
