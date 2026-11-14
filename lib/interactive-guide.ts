/**
 * Panduan singkat untuk tim penyusun materi interaktif.
 *
 * Mengikuti pola `lib/course-markdown/guide.ts`: satu berkas Markdown yang
 * diunduh penyusun lalu DIBERIKAN KE ASISTEN AI MEREKA SENDIRI, bersama bahan
 * mereka. Jadi pembacanya ada dua -- orangnya dan modelnya -- dan itu yang
 * menentukan bentuknya: aturan ditulis sebagai perintah yang bisa dipatuhi
 * model, bukan sebagai penjelasan untuk manusia saja.
 *
 * Petunjuk di penyunting dulu menyebut `docs/TEMPLATE-MATERI-INTERAKTIF.html`.
 * Itu tidak berguna bagi tim: mereka tidak punya akses ke repositori ini.
 * Sekarang petunjuknya menunjuk ke tautan unduh di layar yang sama.
 */

/**
 * Contoh materi yang sudah lolos pembersih tanpa satu pun bagian dibuang.
 *
 * Ini SATU-SATUNYA salinan contohnya; `docs/TEMPLATE-MATERI-INTERAKTIF.html`
 * dihapus supaya tidak ada dua versi yang pelan-pelan berbeda. `npm run
 * test:interaktif` membuktikan contoh ini masih lolos bersih, jadi panduan
 * tidak bisa mengajarkan pola yang sudah tidak berlaku.
 */
export const CONTOH_MATERI_INTERAKTIF = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Contoh materi interaktif</title>
<style>
/*
  ATURAN CSS DI SINI (dibaca pembersih LMS, bukan sekadar saran):

  1. Semua selector otomatis diberi awalan \`.materi-interaktif\` saat diunggah.
     Jadi tulis selector biasa saja; jangan menulis awalannya sendiri.
  2. \`position: fixed\` dan \`position: sticky\` DIBUANG. Keduanya keluar dari
     kotak materi dan menutupi menu LMS -- termasuk tombol Keluar.
  3. \`@import\` dan \`@font-face\` DIBUANG. Pakai font yang sudah ada.
  4. \`url(https://...)\` DIBUANG. Gambar dari luar memberi tahu pemilik berkas
     itu siapa saja peserta kita. Tempelkan gambar sebagai data: URI, atau
     unggah lewat Sumber Belajar.
  5. \`:root\`, \`html\`, \`body\` diarahkan ulang ke kotak materi.
  5b. \`<form>\` TIDAK diizinkan, jadi jangan menggantungkan selector pada kelas
     yang menempel padanya -- kelasnya ikut hilang bersama tagnya. Tanpa
     JavaScript sebuah form memang tidak punya guna; pakai <div> saja.
  6. Jangan pakai satuan lebar tetap yang besar (\`width: 900px\`, \`100vw\`).
     Materi harus tetap terbaca di layar selebar 320px.
*/
:root {
  --utama: #13707f;
  --garis: #d6e2e5;
  --redup: #566a70;
}

.sampul {
  border-left: 4px solid var(--utama);
  padding: 0.25rem 0 0.25rem 0.9rem;
  margin-bottom: 1.5rem;
}

/* Kisi yang melipat sendiri: tanpa media query, tetap aman di 320px. */
.kisi {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(14rem, 100%), 1fr));
  gap: 0.75rem;
}

.kartu {
  border: 1px solid var(--garis);
  border-radius: 0.6rem;
  padding: 0.9rem;
}

.kartu h3 { margin: 0 0 0.35rem; font-size: 1rem; }
.kartu p  { margin: 0; color: var(--redup); font-size: 0.9rem; }

/* --- Ungkap-sembunyi: <details> bawaan peramban --- */
details {
  border: 1px solid var(--garis);
  border-radius: 0.6rem;
  padding: 0.75rem 0.9rem;
  margin-bottom: 0.6rem;
}
summary {
  cursor: pointer;
  font-weight: 600;
  /* 24x24 adalah ukuran sasaran terkecil (WCAG 2.5.8). */
  min-height: 24px;
  display: flex;
  align-items: center;
}
details[open] summary { margin-bottom: 0.6rem; }

/* --- Latihan pilih-jawaban, murni CSS --- */
.latihan { border: 1px solid var(--garis); border-radius: 0.6rem; padding: 1rem; }

/* Radio-nya disembunyikan dari mata, TIDAK dari papan ketik maupun pembaca
   layar. \`display: none\` akan membuatnya tidak bisa difokus sama sekali. */
.latihan input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.pilihan {
  display: block;
  border: 1px solid var(--garis);
  border-radius: 0.5rem;
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  min-height: 24px;
}

/* Fokus papan ketik harus terlihat; tanpa ini pengguna papan ketik tersesat. */
.latihan input:focus-visible + .pilihan {
  outline: 2px solid var(--utama);
  outline-offset: 2px;
}

.latihan input:checked + .pilihan {
  border-color: var(--utama);
  background: #eef6f7;
}

/* Umpan balik disembunyikan sampai pilihannya dipilih. \`~\` mencari saudara
   sesudahnya, jadi .umpan harus diletakkan SESUDAH semua pilihan. */
.umpan { display: none; margin-top: 0.75rem; font-size: 0.9rem; }
#j1:checked ~ .salah,
#j3:checked ~ .salah,
#j2:checked ~ .benar { display: block; }

.benar { color: #0f5c3f; }
.salah { color: #8a2b2b; }

/* --- Daftar periksa yang menghitung dirinya sendiri, dengan :has() --- */
.periksa label { display: flex; gap: 0.5rem; min-height: 24px; align-items: center; }
.selesai { display: none; margin-top: 0.6rem; font-weight: 600; color: #0f5c3f; }
.periksa:has(#p1:checked):has(#p2:checked):has(#p3:checked) .selesai { display: block; }

/* Hormati orang yang mematikan animasi di sistemnya. */
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
</style>
</head>
<body>

<!--
  ATURAN ISI:

  A. JANGAN pakai <script>. Seluruhnya dibuang. Semua interaksi di berkas ini
     dibuat dengan HTML dan CSS saja.
  B. Mulai dari <h2>. <h1> sudah dipakai judul pelajaran di LMS.
  C. Setiap <img> wajib punya alt. Tulis alt="" kalau memang hiasan.
  D. Setiap kotak pilihan wajib punya <label>, disambung lewat for dan id.
  E. Tabel wajib punya <th>.
  F. Satu berkas, satu bahasa. Kalau butuh dua bahasa, buat dua pelajaran.
  G. Maksimal 512 KB.
-->

<div class="sampul">
  <h2>Mengenali biaya tersembunyi sebuah sistem</h2>
  <p>Perkiraan waktu baca 7 menit. Materi ini bisa diklik.</p>
</div>

<div class="kisi">
  <div class="kartu">
    <h3>Biaya langsung</h3>
    <p>Yang muncul di tagihan: server, lisensi, langganan.</p>
  </div>
  <div class="kartu">
    <h3>Biaya tidak langsung</h3>
    <p>Waktu orang: menunggu, mengulang, menambal.</p>
  </div>
  <div class="kartu">
    <h3>Biaya tertunda</h3>
    <p>Yang dibayar nanti karena keputusan hari ini.</p>
  </div>
</div>

<h3>Buka satu per satu</h3>

<details>
  <summary>Kenapa biaya tidak langsung sering luput?</summary>
  <p>Karena tidak ada yang menagihnya. Tidak ada faktur untuk tiga menit
  menunggu, dikali tiga puluh orang, dikali setiap hari kerja.</p>
</details>

<details>
  <summary>Bagaimana cara mulai mengukurnya?</summary>
  <p>Hitung satu tugas nyata dari ujung ke ujung. Catat berapa kali orang
  berpindah alat. Setiap perpindahan adalah tempat waktu hilang.</p>
</details>

<h3>Latihan</h3>

<div class="latihan">
  <fieldset>
    <legend>Sebuah tim mengulang laporan yang sama tiap minggu. Itu biaya apa?</legend>

    <input type="radio" name="s1" id="j1">
    <label class="pilihan" for="j1">Biaya langsung</label>

    <input type="radio" name="s1" id="j2">
    <label class="pilihan" for="j2">Biaya tidak langsung</label>

    <input type="radio" name="s1" id="j3">
    <label class="pilihan" for="j3">Bukan biaya</label>

    <p class="umpan benar">Tepat. Tidak ada tagihannya, tetapi waktunya nyata
    dan berulang.</p>
    <p class="umpan salah">Belum tepat. Tidak ada yang menagih pengulangan itu,
    jadi ia bukan biaya langsung -- tetapi waktunya tetap terpakai.</p>
  </fieldset>
</div>

<h3>Daftar periksa</h3>

<div class="periksa">
  <label><input type="checkbox" id="p1"> Saya bisa menyebut satu biaya langsung</label>
  <label><input type="checkbox" id="p2"> Saya bisa menyebut satu biaya tidak langsung</label>
  <label><input type="checkbox" id="p3"> Saya tahu cara mulai mengukurnya</label>
  <p class="selesai">Bagus. Anda siap lanjut ke pelajaran berikutnya.</p>
</div>

</body>
</html>
`

/**
 * Perintah yang disalin penyusun ke asisten AI mereka.
 *
 * Satu salinan, dipakai DUA tempat: berkas `.md` yang diunduh dan halaman
 * panduan yang dibaca. Kalau masing-masing punya salinannya sendiri, yang
 * satu akan menua tanpa ada yang menyadarinya -- dan yang menua itu justru
 * bagian yang paling menentukan mutu keluaran AI-nya.
 */
export const PERINTAH_AI = `Buatkan satu berkas HTML materi interaktif dari bahan yang saya unggah.

Patuhi seluruh aturan di berkas panduan yang saya unggah. Yang paling penting:

- Tanpa JavaScript sama sekali. Semua interaksi dibuat dengan HTML dan CSS.
- Mulai judul dari h2. Jangan pakai h1.
- Jangan pakai position: fixed, position: sticky, @import, @font-face, atau
  url() yang menunjuk ke alamat internet.
- Jangan pakai tag form, iframe, script, atau input selain checkbox dan radio.
- Setiap gambar wajib punya atribut alt.
- Setiap kotak pilihan wajib dibungkus tag label.
- Setiap tabel wajib punya th.
- Harus tetap terbaca di layar selebar 320 piksel.

Isinya:

- Satu sasaran belajar saja. Kalau bahan saya memuat lebih dari satu, pilih
  yang paling penting dan katakan sisanya sebaiknya jadi pelajaran terpisah.
- Bahasa Indonesia, kalimat pendek, sapaan "Anda". Tanpa tanda seru dan tanpa
  emoji.
- Mulai dengan satu paragraf yang menjawab "kenapa ini penting bagi saya".
- Sertakan minimal satu bagian buka-tutup dan satu latihan pilih jawaban.
- Tanggapan latihan harus menjelaskan KENAPA sebuah jawaban benar atau salah,
  bukan sekadar menyatakan benar atau salah.
- Tutup dengan daftar periksa berisi tiga pernyataan yang bisa dicentang
  peserta sendiri.

Keluarkan satu berkas HTML lengkap, siap saya simpan sebagai .html.`

/**
 * Aturan yang ditegakkan pembersih, berikut alasannya.
 *
 * Alasannya ikut dibawa dengan sengaja. Daftar larangan tanpa sebab akan
 * dilanggar begitu terasa menghalangi; aturan yang alasannya diketahui
 * dipatuhi bahkan pada kasus yang tidak disebut daftarnya.
 */
export const ATURAN_SISTEM: { aturan: string; kenapa: string }[] = [
  { aturan: "Tanpa JavaScript", kenapa: "Satu baris yang salah bisa mencuri sesi peserta." },
  { aturan: "Tanpa position: fixed atau sticky", kenapa: "Terukur menutupi menu LMS, termasuk tombol Keluar." },
  { aturan: "Tanpa @import dan @font-face", kenapa: "Keduanya menarik berkas dari server orang lain." },
  { aturan: "Tanpa url() ke alamat internet", kenapa: "Pemilik berkas itu jadi tahu siapa saja peserta kita." },
  { aturan: "Tanpa form dan iframe", kenapa: "Tidak ada gunanya tanpa JavaScript, dan keduanya bisa menyesatkan." },
  { aturan: "input hanya checkbox dan radio", kenapa: "Kotak kata sandi di tengah pelajaran adalah jebakan yang sempurna." },
  { aturan: "Maksimal 512 KB", kenapa: "Hampir selalu terlampaui karena gambar ditempel ke dalam berkas." },
]


export const PANDUAN_MATERI_INTERAKTIF = `# Panduan singkat: menyusun materi interaktif

Untuk tim penyusun materi Sanggabiz Academy. Materi interaktif adalah satu
berkas HTML yang bisa diklik peserta: bagian yang dibuka-tutup, latihan pilih
jawaban yang langsung memberi tanggapan, daftar periksa yang menandai dirinya
sendiri.

Anda membuatnya di luar LMS, lalu mengunggahnya ke salah satu pelajaran. Satu
kursus boleh berisi campuran video, teks, slide, kuis, dan materi interaktif.

## 1. Cara tercepat: minta AI yang membuat

Buka asisten AI Anda (ChatGPT, Claude, Gemini). Unggah berkas panduan ini,
lalu unggah bahan Anda sendiri: SOP, catatan pelatihan, salindia lama. Setelah
itu salin perintah di bawah ini apa adanya.

---

${PERINTAH_AI}

---

Sesudah itu, buka berkasnya di peramban Anda untuk melihat hasilnya. Kalau ada
yang kurang pas, minta perbaikannya ke AI yang sama.

## 2. Aturan yang ditegakkan sistem

LMS membersihkan setiap berkas sebelum menyimpannya. Yang melanggar aturan
berikut akan dibuang diam-diam oleh peramban kalau kami biarkan, jadi kami
membuangnya lebih dulu dan memberi tahu Anda apa saja yang hilang.

| Aturan | Kenapa |
| --- | --- |
${ATURAN_SISTEM.map((a) => `| ${a.aturan} | ${a.kenapa} |`).join("\n")}

Dua hal yang perlu Anda ingat saat menulis CSS:

- Semua selector otomatis diberi awalan oleh sistem. Tulis selector biasa saja.
- Kelas yang menempel pada tag yang tidak diizinkan ikut hilang bersama
  tagnya. Jangan menggantungkan gaya pada kelas di tag form.

## 3. Cara mengunggah

1. Buka **Kelola Kursus**, pilih kursusnya, masuk ke tab **Pelajaran**.
2. Tambah pelajaran baru atau buka yang sudah ada, lalu pilih jenis
   **Materi Interaktif**.
3. Tekan **Unggah berkas HTML** dan pilih berkas Anda.
4. Periksa **Pratinjau** di bawahnya. Yang Anda lihat di situ persis yang
   dilihat peserta.
5. Simpan kursusnya seperti biasa.

## 4. Kalau muncul kotak kuning "Dibuang saat dibersihkan"

Kotak itu menyebut apa saja yang dihapus dari berkas Anda. Materinya tetap
tersimpan, tetapi bagian yang disebut sudah tidak ada.

Cara memperbaikinya: kembali ke asisten AI Anda, tempelkan isi kotak kuning
itu, dan minta berkasnya dibuat ulang tanpa bagian tersebut. Lalu unggah lagi.

Kotak abu-abu **"Yang perlu Anda tahu"** berbeda. Itu bukan penghapusan,
melainkan hal yang sebaiknya diperbaiki: judul yang melompat, gambar tanpa
keterangan, kotak pilihan tanpa label. Materinya tetap bisa diterbitkan, tetapi
sebagian peserta akan kesulitan membacanya.

Kotak **Perbaikan kecil** di bawah pratinjau untuk mengganti satu-dua kata
saja. Untuk perubahan besar, perbaiki di berkas asli lalu unggah ulang.

## 5. Yang tidak perlu dipaksakan

Materi interaktif bukan satu-satunya cara. Kalau bahan Anda memang paling pas
sebagai teks biasa, video, atau salindia, pakailah itu. Jenis pelajaran lain
tetap ada dan tetap setara.

Satu berkas memuat satu bahasa. Kalau butuh dua bahasa, buat dua pelajaran.

## 6. Contoh lengkap

Berkas di bawah ini lolos pembersih tanpa satu bagian pun dibuang. Berikan ke
AI Anda sebagai contoh pola, atau pakai langsung sebagai titik mulai.

\`\`\`html
${CONTOH_MATERI_INTERAKTIF}
\`\`\`
`
