/**
 * Konversi Markdown <-> HTML untuk isi pelajaran.
 *
 * Sengaja kecil dan terbatas. Isi pelajaran di basis data adalah HTML keluaran
 * Tiptap, dan daftar tag yang boleh ada sudah ditetapkan
 * `lib/sanitize-content.ts`. Jadi yang perlu dikenali di sini hanyalah subset
 * yang benar-benar mungkin ditulis seorang penulis -- atau model bahasa --
 * untuk sebuah pelajaran: paragraf, subjudul, tebal, miring, daftar, tautan,
 * dan kutipan.
 *
 * Tidak memakai pustaka Markdown penuh karena tidak ada yang dibutuhkan dari
 * sisanya: tabel, footnote, dan HTML mentah justru lebih baik tidak lolos.
 * Apa pun hasil fungsi ini tetap melewati `sanitizeRichText` sebelum
 * tersimpan, jadi berkas impor yang nakal tidak bisa menyelundupkan apa pun.
 */

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/** Tebal, miring, kode, dan tautan di dalam satu baris. */
function inlineToHtml(text: string): string {
  let out = escapeHtml(text)
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>")
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
  return out
}

/**
 * Markdown blok -> HTML. Baris kosong memisahkan blok; daftar dikumpulkan
 * sampai baris pertama yang bukan butir.
 */
export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n")
  const out: string[] = []
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    out.push(`<p>${inlineToHtml(paragraph.join(" ").trim())}</p>`)
    paragraph = []
  }
  const flushList = () => {
    if (!list) return
    const tag = list.ordered ? "ol" : "ul"
    out.push(`<${tag}>${list.items.map((i) => `<li>${inlineToHtml(i)}</li>`).join("")}</${tag}>`)
    list = null
  }
  const flushAll = () => {
    flushParagraph()
    flushList()
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.trim() === "") {
      flushAll()
      continue
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      flushAll()
      // Subjudul di dalam pelajaran tidak boleh naik sampai h1/h2: judul
      // pelajaran sudah memakai tingkat itu di halaman peserta, dan dua h1
      // dalam satu halaman merusak urutan heading bagi pembaca layar.
      const level = Math.min(6, heading[1].length + 2)
      out.push(`<h${level}>${inlineToHtml(heading[2].trim())}</h${level}>`)
      continue
    }

    const quote = /^>\s?(.*)$/.exec(line)
    if (quote) {
      flushAll()
      out.push(`<blockquote><p>${inlineToHtml(quote[1].trim())}</p></blockquote>`)
      continue
    }

    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line)
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line)
    if (bullet || numbered) {
      flushParagraph()
      const ordered = !!numbered
      const text = (bullet ?? numbered)![1].trim()
      if (!list || list.ordered !== ordered) {
        flushList()
        list = { ordered, items: [] }
      }
      list.items.push(text)
      continue
    }

    flushList()
    paragraph.push(line.trim())
  }

  flushAll()
  return out.join("")
}

/**
 * HTML -> Markdown, untuk ekspor. Tidak perlu sempurna: hasilnya dibaca
 * manusia dan model, lalu diimpor kembali lewat `markdownToHtml` di atas.
 * Yang penting tidak ada isi yang hilang.
 */
export function htmlToMarkdown(html: string): string {
  if (!html?.trim()) return ""

  let out = html
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div)>/gi, "\n\n")
    .replace(/<h([1-6])[^>]*>/gi, (_m, level) => `\n\n${"#".repeat(Math.max(1, Number(level) - 2))} `)
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/(ul|ol)>/gi, "\n\n")
    .replace(/<blockquote[^>]*>/gi, "\n\n> ")
    .replace(/<\/blockquote>/gi, "\n\n")
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<[^>]+>/g, "")

  out = out
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  return out
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
