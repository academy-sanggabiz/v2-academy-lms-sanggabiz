import { requireAdmin } from "@/lib/auth/require-admin"
import { CONTOH_SOP_MARKDOWN } from "@/lib/ai/contoh-dokumen"

/**
 * Mengunduh contoh dokumen untuk mencoba "Buat otomatis dengan AI".
 *
 * Dibatasi pengelola dengan alasan yang sama seperti rute panduan di
 * sebelahnya: tidak ada yang rahasia di dalamnya, tetapi seluruh area /admin
 * memang tertutup, dan satu rute terbuka di dalamnya jadi pengecualian yang
 * mudah terlupakan.
 *
 * Dikirim sebagai .txt, bukan .md: berkas ini bukan kursus yang akan
 * diimpor, melainkan DOKUMEN SUMBER yang akan dibaca AI. Ekstensi .md di
 * layar yang sama sudah berarti "berkas kursus" (lihat impor Markdown), dan
 * dua arti untuk satu ekstensi membingungkan.
 */
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return new Response("Tidak berwenang", { status: 403 })
  }

  return new Response(CONTOH_SOP_MARKDOWN, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contoh-sop-penerimaan-barang.txt"',
      "Cache-Control": "no-store",
    },
  })
}
