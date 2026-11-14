import { requireAdmin } from "@/lib/auth/require-admin"
import { PANDUAN_MATERI_INTERAKTIF } from "@/lib/interactive-guide"

/**
 * Mengunduh panduan materi interaktif sebagai berkas `.md`.
 *
 * Dibatasi pengelola dengan alasan yang sama seperti `../panduan/route.ts`:
 * isinya tidak rahasia, tetapi seluruh /admin memang tertutup, dan satu rute
 * terbuka di dalamnya akan jadi pengecualian yang mudah terlupakan.
 *
 * Markdown, bukan HTML, karena pembaca keduanya adalah penyusun DAN asisten
 * AI yang mereka pakai -- dan berkas `.md` adalah yang paling mudah diunggah
 * ke mana pun tanpa berubah bentuk.
 */
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return new Response("Tidak berwenang", { status: 403 })
  }

  return new Response(PANDUAN_MATERI_INTERAKTIF, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="panduan-materi-interaktif.md"',
      "Cache-Control": "no-store",
    },
  })
}
