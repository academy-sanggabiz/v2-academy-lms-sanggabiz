import sanitizeHtml from "sanitize-html"

/**
 * Pembersih HTML yang ditulis admin (isi pelajaran, prompt soal, penjelasan,
 * teks halaman depan) sebelum dirender dengan `dangerouslySetInnerHTML`.
 *
 * Temuan C-09 (`docs/SECURITY-REVIEW.md`): HTML itu dulu dirender apa adanya,
 * termasuk saat SSR. Admin biasa -- bukan hanya superadmin -- bisa menyimpan
 * HTML apa pun lewat server action, yang kemudian berjalan di browser peserta
 * dan superadmin.
 *
 * Memakai `sanitize-html`, bukan DOMPurify, karena ini harus jalan **di
 * server**: DOMPurify perlu DOM, sedangkan saat SSR tidak ada DOM sama sekali.
 * `sanitize-html` murni JavaScript sehingga ikut bekerja di runtime Workers
 * yang dipakai target deploy alternatif repo ini.
 *
 * Daftar izinnya sengaja dipetakan dari apa yang benar-benar bisa dihasilkan
 * editor Tiptap (`components/admin/courses/RichTextEditor.tsx`). Menambah tag
 * di sini berarti memperluas yang bisa dijalankan di browser peserta, jadi
 * tambahkan hanya kalau editornya memang bisa menghasilkannya.
 */

const COLOR = [
  /^#(0x)?[0-9a-f]{3,8}$/i,
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\)$/i,
  /^[a-z]+$/i,
]

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "mark", "span",
    "blockquote", "pre", "code",
    "ul", "ol", "li",
    "a", "img",
    "table", "thead", "tbody", "tfoot", "tr", "td", "th", "colgroup", "col",
  ],
  allowedAttributes: {
    "*": ["class"],
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    span: ["style"],
    mark: ["style", "data-color"],
    p: ["style"],
    h1: ["style"], h2: ["style"], h3: ["style"],
    h4: ["style"], h5: ["style"], h6: ["style"],
    // `colwidth` dipakai Tiptap untuk menyimpan lebar kolom tabel yang
    // disetel admin; tanpa izin ini lebarnya hilang setiap kali disimpan.
    td: ["style", "colspan", "rowspan", "colwidth"],
    th: ["style", "colspan", "rowspan", "colwidth"],
    col: ["style", "span"],
  },
  // `style` hanya menerima properti dan nilai di bawah ini. Tanpa pembatasan
  // ini, atribut style tetap bisa menyelundupkan `url(javascript:...)`.
  allowedStyles: {
    "*": {
      color: COLOR,
      "background-color": COLOR,
      "text-align": [/^(left|right|center|justify)$/],
      width: [/^\d+(\.\d+)?(px|%|em|rem)$/],
      "min-width": [/^\d+(\.\d+)?(px|%|em|rem)$/],
    },
  },
  // Tanpa ini, `href="javascript:..."` lolos.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  // Tautan keluar dari konten yang diketik orang lain tidak boleh bisa
  // mengendalikan tab asal (reverse tabnabbing).
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
  disallowedTagsMode: "discard",
}

/** Mengembalikan HTML yang aman dirender. String kosong tetap string kosong. */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return ""
  return sanitizeHtml(html, OPTIONS)
}
