import { requireAdmin } from "@/lib/auth/require-admin"
import { COURSE_GUIDE_MARKDOWN } from "@/lib/course-markdown/guide"

/**
 * Mengunduh panduan penyusunan kursus sebagai berkas `.md`.
 *
 * Dibatasi pengelola, bukan karena isinya rahasia -- tidak ada yang rahasia di
 * dalamnya -- tetapi karena seluruh area /admin memang tertutup, dan membuat
 * satu rute di dalamnya terbuka akan jadi pengecualian yang mudah terlupakan
 * saat kelak ada yang menambahkan data ke berkas ini.
 */
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return new Response("Tidak berwenang", { status: 403 })
  }

  return new Response(COURSE_GUIDE_MARKDOWN, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="panduan-kursus-sanggabiz.md"',
      "Cache-Control": "no-store",
    },
  })
}
