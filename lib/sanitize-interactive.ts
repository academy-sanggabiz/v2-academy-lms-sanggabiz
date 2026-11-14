import postcss, { type Rule, type AtRule } from "postcss"
import sanitizeHtml from "sanitize-html"

import { KELAS_MATERI, type HasilBersih } from "@/lib/interactive-lesson"

/**
 * Pembersih materi interaktif (`docs/STANDAR-MATERI-INTERAKTIF.md` §4).
 *
 * **Profil KEDUA, bukan pelebaran profil yang ada.** `lib/sanitize-content.ts`
 * mengizinkan 34 tag, dipetakan dari apa yang editor Tiptap bisa hasilkan.
 * Melebarkan daftar itu akan ikut melebarkan permukaan pelajaran teks biasa,
 * blok halaman depan, dan keterangan kursus -- yang tidak satu pun
 * membutuhkannya. Jadi berkas ini berdiri sendiri, dan yang memilih profil
 * adalah jenis pelajarannya.
 *
 * **Dua masalah yang sering dikira satu.** Daftar tag menahan skrip dan
 * penangan peristiwa. Ia TIDAK menahan kerusakan tata letak: diukur 13 Nov
 * 2026, CSS penulis tanpa satu pun tag berbahaya menutupi seluruh header LMS
 * -- termasuk tombol Keluar -- dan membuat halaman meluber melewati 320px.
 * Karena itu CSS penulis diurai, diberi awalan, dan disaring di sini; dan
 * pemutar menambahkan `contain: layout style` pada pembungkusnya.
 */

/**
 * Tag yang diizinkan, DI ATAS profil Tiptap.
 *
 * Tiap tambahan punya alasan interaktif, bukan "mungkin berguna":
 * `details`/`summary` untuk ungkap-sembunyi, `input`/`label`/`fieldset`/
 * `legend` untuk pilih-lalu-lihat-akibatnya, `div` sebagai wadah yang dituju
 * selector saudara, `figure`/`figcaption` untuk gambar bersumber.
 */
const TAG = [
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "mark", "span", "small", "abbr",
  "blockquote", "pre", "code", "kbd", "samp",
  "ul", "ol", "li", "dl", "dt", "dd",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th", "colgroup", "col", "caption",
  "div", "section", "article", "aside", "header", "footer", "main", "nav",
  "details", "summary",
  "fieldset", "legend", "label", "input", "output", "progress", "meter",
]

/**
 * `input` HANYA checkbox dan radio.
 *
 * Jenis lain tidak punya guna di sini dan beberapa justru berbahaya:
 * `type="file"` membuka pemilih berkas, `type="password"` membuat kotak yang
 * tampak meminta kata sandi di tengah pelajaran, dan `type="image"` adalah
 * tombol kirim yang memuat gambar dari luar.
 */
const INPUT_BOLEH = new Set(["checkbox", "radio"])

/**
 * Properti CSS yang dibuang.
 *
 * `position: fixed` dan `sticky` keluar dari pembungkus dan menutupi
 * antarmuka LMS -- itu yang terukur menutupi tombol Keluar. `contain` pada
 * pembungkus sudah menahannya, tetapi dibuang juga di sini: dua penjaga untuk
 * satu-satunya cara materi bisa menutupi jalan keluar peserta.
 */
const POSISI_TERLARANG = new Set(["fixed", "sticky"])

/** At-rule yang dibuang seluruhnya: keduanya menarik berkas dari luar. */
const ATRULE_TERLARANG = new Set(["import", "font-face"])

/**
 * Apa yang terlihat sambil membersihkan.
 *
 * Dikumpulkan di `onOpenTag` dan bukan dengan mengurai ulang hasilnya: parser
 * sanitize-html sudah berjalan satu kali di atas berkas ini, jadi menumpang
 * di situ tidak menambah biaya apa pun dan tidak bisa melihat HTML yang
 * berbeda dari yang benar-benar disimpan.
 */
type Struktur = {
  judul: number[]
  gambarTanpaAlt: number
  tabel: number
  th: number
}

function strukturKosong(): Struktur {
  return { judul: [], gambarTanpaAlt: 0, tabel: 0, th: 0 }
}

/**
 * Hambatan aksesibilitas yang benar-benar muncul pada materi tulisan orang.
 *
 * **Kenapa bukan axe di sini.** axe-core adalah devDependency 550 KB; menyeret
 * pengurai itu ke bundel hanya untuk satu layar admin mahal, dan yang lebih
 * penting: materi ini digambar INLINE di halaman pelajaran, jadi
 * `npm run audit:a11y` yang sudah ada benar-benar melihatnya saat menelusuri
 * halaman. Itu justru alasan inline dipilih, bukan iframe (standar §3).
 * Pemeriksaan di sini melengkapinya lebih awal, bukan menggantikannya.
 *
 * Semuanya PERINGATAN, bukan penolakan. Materi yang tidak sempurna tetap lebih
 * berguna daripada materi yang tidak pernah terbit -- yang ditolak hanya hal
 * yang berbahaya, dan itu urusan bagian di atas.
 */
/**
 * Kotak pilihan yang tidak punya nama yang bisa dibacakan.
 *
 * Dihitung dari HASILNYA, bukan saat parse, karena cara melabeli yang paling
 * umum justru TIDAK terlihat dari satu tag: `<label><input> Teks</label>`
 * membungkus inputnya dan sama sekali tidak memakai `for`. Versi pertama
 * pemeriksaan ini hanya mengenal `for`, lalu menuduh berkas contoh kita
 * sendiri punya tiga kotak tanpa label -- padahal ketiganya terbungkus.
 * Peringatan palsu lebih buruk daripada tidak ada peringatan: ia menyuruh
 * penyusun merusak markah yang sudah benar.
 */
function kotakTanpaLabel(html: string): number {
  const rentang: [number, number][] = []
  for (const m of html.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/gi)) {
    rentang.push([m.index, m.index + m[0].length])
  }
  const untuk = new Set(
    [...html.matchAll(/<label\b[^>]*\bfor="([^"]*)"/gi)].map((m) => m[1])
  )

  let tanpa = 0
  for (const m of html.matchAll(/<input\b[^>]*>/gi)) {
    const tag = m[0]
    const dibungkus = rentang.some(([a, b]) => m.index > a && m.index < b)
    if (dibungkus) continue
    if (/\baria-label(ledby)?="[^"]+"/i.test(tag)) continue
    const id = /\bid="([^"]*)"/i.exec(tag)?.[1]
    if (id && untuk.has(id)) continue
    tanpa += 1
  }
  return tanpa
}

/**
 * Aturan CSS yang menunjuk kelas yang tidak ada di markahnya.
 *
 * Kegagalan paling berbahaya pada materi interaktif bukan yang merusak
 * halaman, melainkan yang tidak melakukan apa-apa: tombol yang bisa ditekan
 * dan tidak mengubah apa pun. Tidak ada galat, tidak ada peringatan peramban,
 * dan penyusunnya mengira materinya bekerja.
 *
 * Terukur 14 Nov 2026 pada simulasi buatan AI: dua aturan varian menunjuk
 * `.tanda-salinan` dan `.jalan-supervisor` yang tidak pernah ditulis di
 * markahnya. Ketiga tombol variannya bisa ditekan, dan tidak satu pun
 * mengubah layar.
 *
 * Hanya kelas yang diperiksa, bukan id: `#t0` dan `#v1` yang tidak dirujuk
 * CSS justru benar -- keduanya keadaan awal, dan menuduhnya mati akan
 * menghasilkan peringatan palsu pada materi yang baik.
 */
function kelasYatim(html: string, css: string): string[] {
  const dipakai = new Set<string>()
  for (const m of html.matchAll(/\bclass="([^"]*)"/g)) {
    for (const k of m[1].split(/\s+/)) if (k) dipakai.add(k)
  }

  const yatim = new Set<string>()
  // Selector dibaca dari bagian di luar kurung deklarasi, supaya nilai seperti
  // `content: ".x"` tidak terbaca sebagai kelas.
  for (const aturan of css.split("}")) {
    const bagian = aturan.split("{")[0]
    if (!bagian || bagian.trim().startsWith("@")) continue
    for (const m of bagian.matchAll(/\.([A-Za-z_][\w-]*)/g)) {
      const k = m[1]
      if (k !== KELAS_MATERI && !dipakai.has(k)) yatim.add(k)
    }
  }
  return [...yatim]
}

function periksaAksesibilitas(st: Struktur, html: string): string[] {
  const pesan: string[] = []

  if (st.judul.includes(1)) {
    pesan.push("Ada <h1> di dalam materi. Judul pelajaran sudah memakai <h1>, jadi mulailah dari <h2>.")
  }
  for (let i = 1; i < st.judul.length; i++) {
    if (st.judul[i] - st.judul[i - 1] > 1) {
      pesan.push(
        `Tingkat judul melompat dari <h${st.judul[i - 1]}> ke <h${st.judul[i]}>. Pembaca layar memakai urutan ini untuk menelusuri halaman.`
      )
      break
    }
  }
  if (st.gambarTanpaAlt > 0) {
    pesan.push(
      `Ada ${st.gambarTanpaAlt} gambar tanpa atribut alt. Tulis alt="" kalau gambarnya memang hanya hiasan.`
    )
  }
  const tanpaLabel = kotakTanpaLabel(html)
  if (tanpaLabel > 0) {
    pesan.push(
      `Ada ${tanpaLabel} kotak pilihan tanpa label. Bungkus dengan <label> atau sambungkan lewat for dan id.`
    )
  }
  if (st.tabel > 0 && st.th === 0) {
    pesan.push("Ada tabel tanpa satu pun <th>. Tanpa sel judul, isinya tidak bisa dibacakan per kolom.")
  }

  return pesan
}

function opsiHtml(dibuang: Set<string>, st: Struktur): sanitizeHtml.IOptions {
  return {
    allowedTags: TAG,
    allowedAttributes: {
      /*
        `data-*` dan `aria-*` HARUS disebut. sanitize-html tidak
        meloloskannya sendiri, dan tanpa keduanya materi interaktif mati
        tanpa suara: `data-*` yang menyambung selector saudara
        (`[data-for="a"]`) dibuang, sehingga CSS-nya tidak menemukan apa pun
        dan isinya tidak pernah muncul. Diukur: satu uji gagal persis di
        sini sebelum baris ini ada.
      */
      "*": ["class", "id", "title", "lang", "dir", "hidden", "role", "data-*", "aria-*"],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      input: ["type", "name", "checked", "disabled", "value"],
      label: ["for"],
      output: ["for"],
      progress: ["value", "max"],
      meter: ["value", "min", "max", "low", "high", "optimum"],
      details: ["open"],
      th: ["scope", "colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      col: ["span"],
      colgroup: ["span"],
      abbr: ["title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    // `style` TIDAK ada di daftar tag: CSS penulis tidak pernah lewat jalur
    // ini. Ia dicabut lebih dulu, diurai, lalu dipasang kembali oleh kode
    // kita sendiri -- jadi yang sampai ke peramban hanya CSS yang sudah kita
    // tulis ulang.
    exclusiveFilter: (frame) => {
      if (frame.tag === "input") {
        const jenis = String(frame.attribs.type ?? "").toLowerCase()
        if (!INPUT_BOLEH.has(jenis)) {
          dibuang.add(`<input type="${jenis || "text"}">`)
          return true
        }
      }
      return false
    },
    /*
      `transformTags`, BUKAN `onOpenTag`. Berkas tipe sanitize-html menjanjikan
      `onOpenTag`, tetapi pustakanya tidak pernah memanggilnya: tsc tetap
      hijau sementara pemeriksaannya diam-diam tidak pernah jalan. Terukur --
      lima uji aksesibilitas gagal serentak sebelum baris ini diganti.
    */
    transformTags: {
      "*": (nama, atribut) => {
        const tingkat = /^h([1-6])$/.exec(nama)
        if (tingkat) st.judul.push(Number(tingkat[1]))
        // `alt=""` SAH -- itu cara menyatakan gambar hiasan. Yang jadi masalah
        // hanya atribut yang tidak ada sama sekali.
        else if (nama === "img" && atribut.alt === undefined) st.gambarTanpaAlt += 1
        else if (nama === "table") st.tabel += 1
        else if (nama === "th") st.th += 1
        return { tagName: nama, attribs: atribut }
      },
    },
  }
}

/**
 * Memberi awalan pada setiap selector dan membuang deklarasi berbahaya.
 *
 * Diurai dengan postcss, bukan dengan regex. Selector CSS punya koma di dalam
 * `:is()`, `:has()` dan `[attr=","]`; memecahnya dengan `split(",")` akan
 * merusak selector yang sah dan -- lebih buruk -- bisa menghasilkan selector
 * tanpa awalan yang lalu berlaku ke seluruh halaman.
 */
function lingkupiCss(css: string, dibuang: Set<string>, peringatan: string[]): string {
  let akar: postcss.Root
  try {
    akar = postcss.parse(css)
  } catch {
    // CSS yang tidak terurai dibuang seluruhnya, bukan dipasang apa adanya:
    // yang tidak bisa diperiksa tidak boleh dipasang.
    peringatan.push("Ada <style> yang tidak bisa dibaca, jadi seluruhnya dibuang.")
    return ""
  }

  const bungkus = `.${KELAS_MATERI}`

  akar.walkAtRules((at: AtRule) => {
    if (ATRULE_TERLARANG.has(at.name.toLowerCase())) {
      dibuang.add(`@${at.name}`)
      at.remove()
    }
  })

  akar.walkDecls((d) => {
    const prop = d.prop.toLowerCase()
    const nilai = d.value.toLowerCase()

    if (prop === "position" && POSISI_TERLARANG.has(nilai.trim())) {
      dibuang.add(`position: ${nilai.trim()}`)
      d.remove()
      return
    }
    // `url(http…)` di CSS menarik berkas dari luar saat halaman dibuka --
    // sekaligus memberi tahu pemilik berkas itu siapa saja peserta kita.
    if (/url\(\s*['"]?(https?:)?\/\//i.test(d.value)) {
      dibuang.add(`${prop}: url(…luar…)`)
      d.remove()
    }
  })

  akar.walkRules((r: Rule) => {
    // Rule di dalam @keyframes memakai `from`/`to`/`50%` sebagai selector --
    // memberi awalan di situ akan merusak animasinya.
    const induk = r.parent as AtRule | undefined
    if (induk && induk.type === "atrule" && /keyframes$/i.test(induk.name)) return

    r.selectors = r.selectors.map((s) => {
      const bersih = s.trim()
      if (!bersih) return bersih
      /*
        Selector yang SUDAH berawalan dibiarkan. Fungsi ini dijalankan lebih
        dari sekali pada isi yang sama -- penyunting membersihkan saat
        mengunggah, lalu `saveCourseDraft` membersihkan lagi di pintu simpan,
        dan impor `.md` membersihkan sekali lagi. Tanpa penjagaan ini,
        pembersihan kedua menghasilkan `.materi-interaktif .materi-interaktif`
        yang tidak cocok dengan apa pun.

        Terukur 14 Nov 2026: 56 selector rusak pada satu berkas, dan materinya
        tampil tanpa gaya sama sekali. Tidak ada yang gagal, tidak ada
        peringatan -- hanya halaman polos.
      */
      if (bersih === bungkus || bersih.startsWith(bungkus + " ") || bersih.startsWith(bungkus + ":")) {
        return bersih
      }
      // `:root`, `html` dan `body` menunjuk ke LUAR materi. Diarahkan ulang
      // ke pembungkusnya supaya variabel CSS yang ditulis penulis tetap
      // berlaku untuk materinya sendiri, tanpa menyentuh halaman.
      if (/^(:root|html|body)\b/i.test(bersih)) {
        // Catatan, BUKAN "dibuang": aturannya tetap berlaku, hanya sasarannya
        // yang dipersempit ke kotak materi. Menaruhnya di daftar buangan
        // membuat penyusun mencari gaya yang sebenarnya masih ada.
        const catatan =
          "Selector :root, html dan body diarahkan ke kotak materi, supaya gayanya tidak mengubah halaman LMS."
        if (!peringatan.includes(catatan)) peringatan.push(catatan)
        return bungkus + bersih.replace(/^(:root|html|body)/i, "")
      }
      return `${bungkus} ${bersih}`
    })
  })

  return akar.toString().trim()
}

/**
 * Membersihkan satu berkas materi interaktif.
 *
 * Mengembalikan HTML siap simpan: isi `<body>` yang sudah disaring, dengan
 * satu `<style>` berisi CSS penulis yang sudah dilingkupi. Tidak ada
 * `<script>`, `<head>`, atau `<html>` yang tersisa.
 */
export function bersihkanMateriInteraktif(berkas: string | null | undefined): HasilBersih {
  const dibuang = new Set<string>()
  const peringatan: string[] = []
  const struktur = strukturKosong()

  if (!berkas || !berkas.trim()) {
    return { html: "", dibuang: [], peringatan: [] }
  }

  // Komentar HTML dibuang paling awal. Bukan demi keamanan -- sanitize-html
  // sudah membuangnya -- tetapi karena penghitung di bawah ini membaca teks
  // mentah: berkas contoh kita sendiri menulis "jangan pakai <script>" di
  // dalam komentar, dan penyusunnya diberi tahu materinya memuat JavaScript
  // padahal tidak ada satu pun.
  let isi = berkas.replace(/<!--[\s\S]*?-->/g, " ")

  // Skrip dibuang SEBELUM apa pun yang lain, berikut isinya. Membiarkannya
  // sampai ke sanitize-html akan membuang tagnya tetapi menyisakan badannya
  // sebagai teks yang terbaca peserta.
  const jumlahSkrip = (isi.match(/<script\b/gi) ?? []).length
  if (jumlahSkrip > 0) {
    dibuang.add(`<script> (${jumlahSkrip})`)
    peringatan.push(
      "Materi ini memuat JavaScript dan itu dibuang. Interaktifnya harus memakai HTML dan CSS saja."
    )
  }
  isi = isi.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<script\b[^>]*\/?>/gi, " ")

  // `<style>` dicabut dan diproses terpisah; lihat catatan pada opsiHtml.
  const gaya: string[] = []
  isi = isi.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, css: string) => {
    gaya.push(css)
    return " "
  })

  // Hanya isi <body> yang dipakai. Berkas dari AI hampir selalu lengkap
  // dengan <!doctype>, <head> dan <meta>; semuanya tidak berguna di dalam
  // halaman yang sudah punya kepala sendiri.
  const body = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(isi)
  if (body) isi = body[1]
  isi = isi.replace(/<\/?(html|head|body|title|meta|link|base)\b[^>]*>/gi, " ")

  // Dipangkas supaya pembersihan kedua menghasilkan yang persis sama. Tanpa
  // ini, `<style>` yang dicabut meninggalkan satu spasi di depan isinya, dan
  // spasi itu bertambah setiap kali fungsi ini dijalankan ulang.
  const html = sanitizeHtml(isi, opsiHtml(dibuang, struktur)).trim()
  const css = gaya.length > 0 ? lingkupiCss(gaya.join("\n"), dibuang, peringatan) : ""
  peringatan.push(...periksaAksesibilitas(struktur, html))

  const yatim = kelasYatim(html, css)
  if (yatim.length > 0) {
    peringatan.push(
      `Ada aturan gaya yang menunjuk kelas yang tidak ada di materinya: ${yatim
        .slice(0, 6)
        .map((k) => `.${k}`)
        .join(", ")}${yatim.length > 6 ? `, dan ${yatim.length - 6} lagi` : ""}. Biasanya ini berarti ada tombol yang bisa ditekan tetapi tidak mengubah apa pun.`
    )
  }
  if (!html.trim()) {
    peringatan.push("Setelah dibersihkan tidak ada isi yang tersisa.")
  }

  return {
    // `<style>` ditaruh di DEPAN supaya gaya sudah ada saat isinya digambar,
    // menghindari kedipan tak bergaya pada materi yang panjang.
    html: css ? `<style>${css}</style>\n${html}` : html,
    dibuang: [...dibuang],
    peringatan,
  }
}
