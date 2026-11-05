// Pemeriksa bahasa sederhana (STANDAR-PLATFORM-DIGITAL-LEARNING butir F1-F2).
//
// F1: kalimat antarmuka lebih dari 25 kata dilaporkan -- satu kalimat satu
//     gagasan, hal terpenting di depan.
// F2: singkatan kapital (>=2 huruf) di kamus yang tidak ada di daftar dikenal
//     dilaporkan agar dijelaskan saat pertama muncul.
//
// Tiga sumber diperiksa:
//   1. kamus ID di lib/i18n/dictionaries.ts (layar dwibahasa);
//   2. string literal di app/, components/, lib/ (pesan galat, zod, toast);
//   3. simpul teks JSX (kalimat yang ditulis langsung di markah).
// Keterbatasan: teks yang dirakit dari potongan-potongan kecil saat runtime
// tidak terjangkau; pemeriksaan manual 5 layar tetap tercatat di dokumen standar.
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const AKAR = fileURLToPath(new URL("..", import.meta.url))
const BATAS_KATA = 25

const laporF1 = []
const laporF2 = new Map()

function urai(teks, sumber) {
  // Baris markdown/escape \n adalah batas kalimat juga -- judul markdown yang
  // menyambung dengan paragraf di bawahnya bukan satu kalimat.
  for (const kalimat of teks.split(/(?<=[.!?])\s+|\\n|\n/)) {
    const kata = kalimat.trim().split(/\s+/).filter(Boolean)
    if (kata.length > BATAS_KATA) laporF1.push({ n: kata.length, sumber, kalimat: kalimat.trim().slice(0, 160) })
  }
}

// ---- 1. kamus ID --------------------------------------------------------
const kamus = readFileSync(join(AKAR, "lib/i18n/dictionaries.ts"), "utf8")
const blokId = kamus.slice(kamus.indexOf("export const id"), kamus.indexOf("export const en"))

const SINGKATAN_DIKENAL = new Set([
  "LMS", // dijelaskan di pengaturan pelacakan ("platform belajar ini")
  "PDF", "CSV", "URL", "ID", "OK", "EN", "WIB",
])

for (const m of blokId.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
  const s = m[1]
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\n/g, " ")
  if (s.length < 10) continue
  urai(s, "kamus")
  for (const sg of s.matchAll(/\b[A-Z]{2,}\b/g)) {
    if (!SINGKATAN_DIKENAL.has(sg[0]) && !laporF2.has(sg[0])) laporF2.set(sg[0], s.slice(0, 90))
  }
}

// ---- 2 & 3. berkas sumber ----------------------------------------------
function* berkas(dir) {
  for (const nama of readdirSync(dir)) {
    const p = join(dir, nama)
    if (statSync(p).isDirectory()) yield* berkas(p)
    else if (/\.tsx?$/.test(nama) && !nama.includes("dictionaries")) yield p
  }
}

for (const d of ["app", "components", "lib"]) {
  for (const f of berkas(join(AKAR, d))) {
    const asli = readFileSync(f, "utf8")
    const relatif = f.slice(AKAR.length)
    // string literal (komentar tidak ikut karena pola menuntut kutip)
    for (const m of asli.matchAll(/"((?:[^"\\\n]|\\.){40,}?)"/g)) {
      const s = m[1]
      if (/[a-z]:\/\/|className|data-|aria-|^[\w/.-]+$/.test(s)) continue
      // Bukan kalimat kalau hurufnya kurang dari separuh. Yang disaring di
      // sini data jalur SVG ("M17.472 14.382c-.297-.149..."): panjang,
      // berspasi, dan lolos semua saringan di atas, tetapi itu koordinat --
      // menghitungnya sebagai "kalimat 66 kata" membuat gerbang ini melaporkan
      // kegagalan yang tidak bisa diperbaiki siapa pun. Prosa dalam bahasa apa
      // pun jauh di atas ambang ini.
      const huruf = (s.match(/\p{L}/gu) ?? []).length
      if (huruf / s.length < 0.5) continue
      urai(s, relatif)
    }
    // simpul teks JSX (hanya .tsx), setelah komentar dibuang supaya tidak salah lapor
    if (!f.endsWith(".tsx")) continue
    const tanpaKomentar = asli.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ")
    for (const m of tanpaKomentar.matchAll(/>([^<>{}]{60,})</g)) {
      urai(m[1].split(/\s+/).join(" "), relatif)
    }
  }
}

let gagal = 0
if (laporF1.length) {
  console.log(`F1: ${laporF1.length} kalimat lebih dari ${BATAS_KATA} kata:`)
  for (const { n, sumber, kalimat } of laporF1) console.log(`  (${n} kata) ${sumber}\n     ${kalimat}`)
  gagal = 1
} else {
  console.log(`F1: tidak ada kalimat antarmuka lebih dari ${BATAS_KATA} kata (kamus + string + teks JSX)`)
}
if (laporF2.size) {
  console.log(`F2: ${laporF2.size} singkatan di kamus belum dikenal:`)
  for (const [sg, ctx] of laporF2) console.log(`  ${sg} -- "${ctx}"`)
  gagal = 1
} else {
  console.log("F2: semua singkatan di kamus dikenal/dijelaskan")
}
process.exit(gagal)
