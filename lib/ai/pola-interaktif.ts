/**
 * Katalog pola materi interaktif: bentuk yang boleh dipilih AI, beserta satu
 * contoh utuh dan syarat struktur yang bisa diperiksa mesin.
 *
 * == Kenapa katalog, bukan "pengetahuan dasar" ==
 *
 * Sebelum berkas ini ada, prompt simulasi hanya memberi ATURAN (tanpa
 * JavaScript, pakai `:has()`, warna dari daftar) ditambah kerangka paling
 * minimal: satu `.sim`, satu tindakan, satu akibat. Aturan membatasi; ia tidak
 * memberi bentuk. Hasilnya selalu jatuh ke bentuk paling generik yang memenuhi
 * aturan -- kotak, radio, akibat -- benar secara mekanis dan kosong secara
 * rancangan.
 *
 * Yang terbukti bagus justru dibuat di luar pipeline: pemilik menempelkan
 * hasil percakapan dengan model lain, dan bentuknya jauh lebih kaya (matriks
 * situasi x tindakan, layar tiruan sebagai akibat, penyembunyian bertahap,
 * tombol ulangi). Artinya modelnya memang sanggup; yang kurang contohnya.
 *
 * Maka: daftar TERTUTUP. Tahap kerangka memilih satu nama pola, tahap
 * penulisan menerima contoh pola itu utuh, dan `periksaPola()` menolak keluaran
 * yang tidak memenuhi janji polanya. Daftar tertutup bisa diaudit; "pengetahuan
 * yang ditaruh lalu diharapkan terpakai" tidak.
 *
 * == Contohnya utuh, bukan kerangka ==
 *
 * Contoh yang dipotong jadi kerangka kehilangan justru bagian yang membuatnya
 * bagus: jam yang disebut, status berwarna, kalimat akibat yang menceritakan
 * bukan menilai. Karena itu contohnya lengkap -- dan karena contoh lengkap
 * mengundang penyalinan, `JEJAK_CONTOH` mendaftar kata yang hanya ada di
 * contoh. Keluaran yang masih memuatnya berarti menyalin, bukan meniru.
 *
 * Acuan aslinya disimpan di `docs/contoh/acuan-kursus-izin-dan-cuti.md`.
 *
 * `JEJAK_CONTOH` hanya memuat kata yang ada di CONTOH DI BERKAS INI -- bukan
 * nama orang atau perusahaan dari dokumen pemilik. Versi pertama memasukkan
 * "Nusantara Terang", nama perusahaan di SOP yang memang sah muncul di kursus
 * yang dihasilkan darinya, dan pemeriksanya menuduh menyalin untuk keluaran
 * yang benar.
 */

export const ID_POLA = ["keputusan-bercabang", "percakapan-hp", "alat-bantu"] as const
export type IdPola = (typeof ID_POLA)[number]

export type SyaratPola = {
  /** Berapa grup radio berbeda (`name` berbeda) paling sedikit. */
  minGrupRadio?: number
  minRadio?: number
  minCheckbox?: number
  minDetails?: number
  /** Potongan markah yang wajib ada, apa adanya. */
  wajibAda?: { potongan: string; alasan: string }[]
  /** Berapa aturan `:has(...)` paling sedikit -- penanda interaksi sungguhan. */
  minAturanHas?: number
}

export type Pola = {
  id: IdPola
  nama: string
  /** Satu kalimat, dibaca tahap kerangka untuk memilih. */
  kapanDipakai: string
  /** Yang membuat pola ini bekerja, dibaca tahap penulisan. */
  kunci: string[]
  contoh: string
  syarat: SyaratPola
}

/*
 * Kata yang HANYA ada di contoh. Dipakai `periksaPola()` untuk menangkap
 * keluaran yang menyalin alih-alih meniru -- kursus gudang yang tiba-tiba
 * bercerita tentang Pak Hendra dan cuti tahunan.
 */
export const JEJAK_CONTOH = [
  "JUDUL SIMULASI",
  "JUDUL ALAT BANTU",
  "NAMA PENGIRIM",
  "NAMA LAYAR ATAU DOKUMEN",
  "Tindakan pertama.",
  "Akibat tindakan",
  "Pernyataan pertama yang bisa diperiksa",
  "Keadaan pertama",
]

const CONTOH_BERCABANG = `<style>
.sim-bcb{font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:16px;border:1px solid #d6e2e5;border-radius:14px;background:#fff;color:#14252a;line-height:1.5}
.sim-bcb input{position:absolute;opacity:0;pointer-events:none}
.sim-bcb h2{margin:0 0 6px;font-size:18px}
.sim-bcb p{margin:0 0 10px}
.sim-bcb .tugas{background:#f4f7f8;border-radius:10px;padding:10px 12px;margin-bottom:12px}
.sim-bcb .tab{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.sim-bcb .tab label{flex:1 1 150px;text-align:center;padding:8px;border:1px solid #d6e2e5;border-radius:999px;cursor:pointer;font-size:13px}
.sim-bcb:has(#s1:checked) label[for=s1],.sim-bcb:has(#s2:checked) label[for=s2],.sim-bcb:has(#s3:checked) label[for=s3]{background:#13707f;color:#fff;border-color:#13707f}
.sim-bcb .layar{border:1px solid #d6e2e5;border-radius:10px;padding:10px 12px;margin-bottom:12px;background:#f4f7f8;font-size:14px}
.sim-bcb .layar .judul{font-weight:600;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#566a70;margin-bottom:4px}
.sim-bcb .baris{display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed #d6e2e5;padding:3px 0}
.sim-bcb .baris:last-child{border-bottom:0}
.sim-bcb .st{font-weight:600}
.sim-bcb .tunggu{color:#8a2b2b}
.sim-bcb .ok{color:#0f5c3f}
.sim-bcb .tolak{color:#8a2b2b}
.sim-bcb .aksi label{display:block;padding:10px 12px;margin-bottom:8px;border:1px solid #d6e2e5;border-radius:10px;cursor:pointer}
.sim-bcb .aksi label:hover{background:#f4f7f8}
.sim-bcb .situasi,.sim-bcb .akibat,.sim-bcb .ulang{display:none}
.sim-bcb:has(#s1:checked) .u1,.sim-bcb:has(#s2:checked) .u2,.sim-bcb:has(#s3:checked) .u3{display:block}
.sim-bcb:has(.pilih:checked) .aksi,.sim-bcb:has(.pilih:checked) .tab,.sim-bcb:has(.pilih:checked) .awal{display:none}
.sim-bcb:has(.pilih:checked) .ulang{display:block}
.sim-bcb:has(#s1:checked):has(#a1:checked) .h1-1,
.sim-bcb:has(#s1:checked):has(#a2:checked) .h1-2,
.sim-bcb:has(#s1:checked):has(#a3:checked) .h1-3,
.sim-bcb:has(#s2:checked):has(#a1:checked) .h2-1,
.sim-bcb:has(#s2:checked):has(#a2:checked) .h2-2,
.sim-bcb:has(#s2:checked):has(#a3:checked) .h2-3,
.sim-bcb:has(#s3:checked):has(#a1:checked) .h3-1,
.sim-bcb:has(#s3:checked):has(#a2:checked) .h3-2,
.sim-bcb:has(#s3:checked):has(#a3:checked) .h3-3{display:block}
.sim-bcb .ulang label{display:block;text-align:center;padding:10px;border-radius:10px;background:#13707f;color:#fff;cursor:pointer}
</style>

<div class="sim-bcb">
  <input type="radio" name="s" id="s1" checked>
  <input type="radio" name="s" id="s2">
  <input type="radio" name="s" id="s3">
  <input type="radio" name="a" id="a0" checked>
  <input type="radio" name="a" id="a1" class="pilih">
  <input type="radio" name="a" id="a2" class="pilih">
  <input type="radio" name="a" id="a3" class="pilih">

  <h2>JUDUL SIMULASI</h2>
  <div class="tugas"><p>Perintah yang jelas: siapa Anda, apa yang baru terjadi, dan apa yang harus Anda putuskan.</p></div>

  <div class="tab">
    <label for="s1">Situasi 1: RINGKAS</label>
    <label for="s2">Situasi 2: RINGKAS</label>
    <label for="s3">Situasi 3: RINGKAS</label>
  </div>

  <div class="situasi u1">
    <div class="awal">
      <p><strong>Hari, jam.</strong> Keadaan pembuka satu kalimat.</p>
      <div class="layar">
        <div class="judul">NAMA LAYAR ATAU DOKUMEN</div>
        <div class="baris"><span>Ruas</span><span>Isi</span></div>
        <div class="baris"><span>Status</span><span class="st tunggu">Keadaan sekarang</span></div>
      </div>
    </div>
    <div class="aksi">
      <label for="a1">Tindakan pertama.</label>
      <label for="a2">Tindakan kedua.</label>
      <label for="a3">Tindakan ketiga.</label>
    </div>
    <div class="akibat h1-1">
      <div class="layar">
        <div class="judul">AKIBATNYA, DI LAYAR</div>
        <div class="baris"><span>Hari itu</span><span class="st tolak">Hasil buruk</span></div>
      </div>
      <p>Apa yang terjadi berikutnya, diceritakan. Bukan "benar" atau "salah".</p>
    </div>
    <div class="akibat h1-2"><p>Akibat tindakan kedua di situasi ini.</p></div>
    <div class="akibat h1-3">
      <div class="layar">
        <div class="judul">AKIBATNYA, DI LAYAR</div>
        <div class="baris"><span>Status</span><span class="st ok">Hasil baik</span></div>
      </div>
      <p>Akibat tindakan ketiga di situasi ini.</p>
    </div>
  </div>

  <div class="situasi u2">
    <div class="awal"><p><strong>Hari, jam.</strong> Keadaan kedua -- satu tanda yang tadinya menolong HILANG.</p></div>
    <div class="aksi">
      <label for="a1">Tindakan pertama.</label>
      <label for="a2">Tindakan kedua.</label>
      <label for="a3">Tindakan ketiga.</label>
    </div>
    <div class="akibat h2-1"><p>Akibat berbeda, karena situasinya berbeda.</p></div>
    <div class="akibat h2-2"><p>Akibat berbeda.</p></div>
    <div class="akibat h2-3"><p>Akibat berbeda.</p></div>
  </div>

  <div class="situasi u3">
    <div class="awal"><p><strong>Hari, jam.</strong> Keadaan ketiga -- salah satu jalan keluar TERTUTUP.</p></div>
    <div class="aksi">
      <label for="a1">Tindakan pertama.</label>
      <label for="a2">Tindakan kedua.</label>
      <label for="a3">Tindakan ketiga.</label>
    </div>
    <div class="akibat h3-1"><p>Akibat berbeda.</p></div>
    <div class="akibat h3-2"><p>Akibat berbeda.</p></div>
    <div class="akibat h3-3"><p>Akibat berbeda.</p></div>
  </div>

  <div class="ulang"><label for="a0">Ulangi dari awal</label></div>
</div>`

const CONTOH_PERCAKAPAN = `<style>
.sim-hp{font-family:system-ui,sans-serif;color:#14252a;line-height:1.5;display:flex;flex-wrap:wrap;gap:16px}
.sim-hp input{position:absolute;opacity:0;pointer-events:none}
.sim-hp h2{margin:0 0 6px;font-size:18px;flex:1 1 100%}
.sim-hp .tugas{flex:1 1 100%;background:#14252a;color:#fff;border-radius:10px;padding:10px 12px}
.sim-hp .tugas .label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.8}
.sim-hp .hp{flex:1 1 260px;max-width:320px;border:3px solid #14252a;border-radius:22px;overflow:hidden;background:#fff}
.sim-hp .bar{display:flex;justify-content:space-between;font-size:11px;padding:4px 10px;color:#566a70}
.sim-hp .kontak{background:#13707f;color:#fff;padding:8px 12px}
.sim-hp .kontak .nama{font-weight:700}
.sim-hp .kontak .no{font-size:11px;opacity:.9}
.sim-hp .obrolan{padding:10px;display:flex;flex-direction:column;gap:8px}
.sim-hp .gel{background:#f4f7f8;border-radius:10px;padding:8px 10px;font-size:14px;position:relative}
.sim-hp .gel .jam{display:block;text-align:right;font-size:10px;color:#566a70}
.sim-hp .gel.tandai{background:#fdf6e3}
.sim-hp .tanya{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#566a70;padding:0 10px}
.sim-hp .aksi{padding:0 10px 10px;display:flex;flex-direction:column;gap:6px}
.sim-hp .aksi label{border:1px solid #d6e2e5;border-radius:8px;padding:8px 10px;font-size:14px;cursor:pointer}
.sim-hp .aksi label:hover{background:#f4f7f8}
.sim-hp .panel{flex:1 1 260px;border:1px solid #d6e2e5;border-radius:12px;padding:12px}
.sim-hp .panel h3{margin:0 0 4px;font-size:15px}
.sim-hp .panel .ket{font-size:13px;color:#566a70;margin-bottom:8px}
.sim-hp .panel label{display:block;border:1px solid #d6e2e5;border-radius:8px;padding:8px 10px;margin-bottom:6px;cursor:pointer;font-size:14px}
.sim-hp .panel label .sub{display:block;font-size:12px;color:#566a70}
.sim-hp:has(#v1:checked) label[for=v1],.sim-hp:has(#v2:checked) label[for=v2],.sim-hp:has(#v3:checked) label[for=v3]{border-color:#13707f;background:#f4f7f8}
.sim-hp .akibat{flex:1 1 100%;display:none;border-left:3px solid #13707f;padding:8px 12px;background:#f4f7f8;border-radius:0 8px 8px 0}
.sim-hp .buruk{border-left-color:#8a2b2b}
.sim-hp:has(#v1:checked):has(#t1:checked) .k1-1,
.sim-hp:has(#v1:checked):has(#t2:checked) .k1-2,
.sim-hp:has(#v1:checked):has(#t3:checked) .k1-3,
.sim-hp:has(#v2:checked):has(#t1:checked) .k2-1,
.sim-hp:has(#v2:checked):has(#t2:checked) .k2-2,
.sim-hp:has(#v2:checked):has(#t3:checked) .k2-3,
.sim-hp:has(#v3:checked):has(#t1:checked) .k3-1,
.sim-hp:has(#v3:checked):has(#t2:checked) .k3-2,
.sim-hp:has(#v3:checked):has(#t3:checked) .k3-3{display:block}
.sim-hp .catatan{flex:1 1 100%;font-size:12px;color:#566a70}
</style>

<div class="sim-hp">
  <input type="radio" name="v" id="v1" checked>
  <input type="radio" name="v" id="v2">
  <input type="radio" name="v" id="v3">
  <input type="radio" name="t" id="t0" checked>
  <input type="radio" name="t" id="t1">
  <input type="radio" name="t" id="t2">
  <input type="radio" name="t" id="t3">

  <h2>JUDUL SIMULASI</h2>
  <div class="tugas"><div class="label">Tugas Anda</div>Siapa Anda, pesan apa yang baru masuk, dan apa yang diminta darinya.</div>

  <div class="hp">
    <div class="bar"><span>16.47</span><span>WiFi</span></div>
    <div class="kontak"><div class="nama">NAMA PENGIRIM</div><div class="no">+62 8xx-xxxx-xxxx &middot; nomor baru</div></div>
    <div class="obrolan">
      <div class="gel">Pesan pembuka yang terdengar wajar.<span class="jam">16.47</span></div>
      <div class="gel">Permintaannya, dengan angka dan tenggat.<span class="jam">16.47</span></div>
      <div class="gel tandai">Kalimat yang menutup jalan memeriksa.<span class="jam">16.48</span></div>
    </div>
    <div class="tanya">Apa yang Anda lakukan?</div>
    <div class="aksi">
      <label for="t1">Tindakan pertama.</label>
      <label for="t2">Tindakan kedua.</label>
      <label for="t3">Tindakan ketiga.</label>
    </div>
  </div>

  <div class="panel">
    <h3>Ganti situasinya</h3>
    <p class="ket">Pilih satu, lalu kerjakan lagi dari awal. Tiap situasi mengubah tandanya.</p>
    <label for="v1">Seperti biasa<span class="sub">Keterangan singkat.</span></label>
    <label for="v2">Situasi kedua<span class="sub">Satu tanda hilang.</span></label>
    <label for="v3">Situasi ketiga<span class="sub">Satu jalan keluar tertutup.</span></label>
  </div>

  <div class="akibat buruk k1-1"><p>Akibat tindakan 1 pada situasi 1.</p></div>
  <div class="akibat k1-2"><p>Akibat tindakan 2 pada situasi 1.</p></div>
  <div class="akibat k1-3"><p>Akibat tindakan 3 pada situasi 1.</p></div>
  <div class="akibat buruk k2-1"><p>Akibat tindakan 1 pada situasi 2.</p></div>
  <div class="akibat k2-2"><p>Akibat tindakan 2 pada situasi 2.</p></div>
  <div class="akibat k2-3"><p>Akibat tindakan 3 pada situasi 2.</p></div>
  <div class="akibat buruk k3-1"><p>Akibat tindakan 1 pada situasi 3.</p></div>
  <div class="akibat k3-2"><p>Akibat tindakan 2 pada situasi 3.</p></div>
  <div class="akibat k3-3"><p>Akibat tindakan 3 pada situasi 3.</p></div>

  <p class="catatan">Semua nama dan perusahaan di simulasi ini dibuat untuk pelajaran ini.</p>
</div>`

const CONTOH_ALAT = `<style>
.alat{font-family:system-ui,sans-serif;max-width:620px;color:#14252a;line-height:1.5}
.alat h2{margin:0 0 4px;font-size:18px}
.alat .ket{color:#566a70;margin:0 0 12px}
.alat .kotak{border:1px solid #d6e2e5;border-radius:12px;padding:12px;margin-bottom:12px}
.alat .kotak h3{margin:0 0 2px;font-size:15px}
.alat .kotak .ket{font-size:13px;margin-bottom:8px}
.alat .ceklis label{display:flex;gap:8px;align-items:flex-start;border:1px solid #d6e2e5;border-radius:8px;padding:8px 10px;margin-bottom:6px;cursor:pointer}
.alat .ceklis label:hover{background:#f4f7f8}
.alat .putusan{display:none;border-radius:8px;padding:8px 10px;font-weight:600}
.alat .lanjut{background:#f4f7f8;color:#0f5c3f}
.alat:has(#c1:checked):has(#c2:checked):has(#c3:checked) .lanjut{display:block}
.alat:has(#c1:checked):has(#c2:checked):has(#c3:checked) .belum{display:none}
.alat .belum{display:block;background:#f4f7f8;color:#8a2b2b;border-radius:8px;padding:8px 10px;font-weight:600}
.alat details{border:1px solid #d6e2e5;border-radius:8px;margin-bottom:6px;background:#fff}
.alat summary{cursor:pointer;padding:10px 12px;font-weight:600;list-style:none;display:flex;justify-content:space-between;gap:8px}
.alat summary::-webkit-details-marker{display:none}
.alat summary::after{content:"Buka";font-weight:400;font-size:12px;color:#13707f}
.alat details[open] summary::after{content:"Tutup"}
.alat summary:hover{background:#f4f7f8}
.alat details .isi{padding:0 12px 12px;font-size:14px}
.alat .darurat{border:1px solid #8a2b2b;border-radius:12px;padding:12px;background:#f4f7f8}
.alat .darurat h3{margin:0 0 4px;font-size:15px;color:#8a2b2b}
</style>

<div class="alat">
  <h2>JUDUL ALAT BANTU</h2>
  <p class="ket">Halaman ini alat kerja, bukan bacaan. Buka lagi kapan pun Anda ragu.</p>

  <div class="kotak">
    <h3>Tiga pertanyaan sebelum Anda lanjut</h3>
    <p class="ket">Centang hanya yang sudah Anda pastikan, bukan yang Anda kira.</p>
    <div class="ceklis">
      <label><input type="checkbox" id="c1"> Pernyataan pertama yang bisa diperiksa sendiri.</label>
      <label><input type="checkbox" id="c2"> Pernyataan kedua yang bisa diperiksa sendiri.</label>
      <label><input type="checkbox" id="c3"> Pernyataan ketiga yang bisa diperiksa sendiri.</label>
    </div>
    <p class="belum">Selama salah satu belum tercentang, berhenti dulu. Lihat daftar di bawah.</p>
    <p class="putusan lanjut">Ketiganya terpenuhi. Silakan lanjut seperti biasa.</p>
  </div>

  <h3>Kalau ada yang tidak bisa dicentang</h3>
  <details><summary>Keadaan pertama</summary><div class="isi">Apa yang harus dilakukan, dalam satu sampai dua kalimat.</div></details>
  <details><summary>Keadaan kedua</summary><div class="isi">Apa yang harus dilakukan.</div></details>
  <details><summary>Keadaan ketiga</summary><div class="isi">Apa yang harus dilakukan.</div></details>
  <details><summary>Keadaan keempat</summary><div class="isi">Apa yang harus dilakukan.</div></details>

  <div class="darurat">
    <h3>Kalau terlanjur</h3>
    <p>Langkah pertama, kedua, ketiga -- berurutan, paling mendesak lebih dulu.</p>
  </div>
</div>`

export const POLA: Pola[] = [
  {
    id: "keputusan-bercabang",
    nama: "Simulasi keputusan bercabang",
    kapanDipakai:
      "Dokumennya memuat prosedur dengan tenggat, status, atau syarat yang gampang dilanggar, dan akibat salah langkah bisa diceritakan.",
    kunci: [
      "Tiap situasi punya layar, daftar tindakan, DAN akibatnya sendiri -- bukan satu daftar tindakan yang dipakai bersama.",
      "Akibat ditampilkan sebagai layar tiruan (status berwarna), lalu satu paragraf yang menceritakan.",
      "Begitu satu tindakan dipilih, daftar tindakan dan tab situasi disembunyikan, dan tombol Ulangi muncul.",
      "Radio disembunyikan; yang terlihat labelnya, dan label situasi yang aktif diberi warna.",
    ],
    contoh: CONTOH_BERCABANG,
    syarat: {
      minGrupRadio: 2,
      minRadio: 7,
      minAturanHas: 9,
      wajibAda: [
        { potongan: "Ulangi", alasan: "Simulasi tanpa jalan mengulang hanya bisa dicoba sekali." },
      ],
    },
  },
  {
    id: "percakapan-hp",
    nama: "Simulasi percakapan di ponsel",
    kapanDipakai:
      "Bahayanya datang lewat pesan dari orang lain -- penipuan, permintaan mendesak, atasan palsu -- sehingga yang perlu dilatih adalah membaca tanda di pesan itu.",
    kunci: [
      "Gambar ponselnya dibuat dari HTML: bingkai, jam, nama pengirim, nomor, lalu gelembung pesan berjam.",
      "Satu gelembung yang paling menjebak diberi latar berbeda.",
      "Pilihan tindakan berada DI DALAM ponsel, tepat di bawah percakapan.",
      "Panel 'Ganti situasinya' terpisah di samping, dan tiap situasi mengubah akibat tiap tindakan.",
    ],
    contoh: CONTOH_PERCAKAPAN,
    syarat: {
      minGrupRadio: 2,
      minRadio: 7,
      minAturanHas: 9,
      wajibAda: [
        { potongan: "dibuat untuk pelajaran ini", alasan: "Nama rekaan harus diakui di halamannya." },
      ],
    },
  },
  {
    id: "alat-bantu",
    nama: "Alat bantu keputusan",
    kapanDipakai:
      "Yang dibutuhkan peserta bukan latihan sekali jalan, melainkan halaman yang dibuka lagi saat ragu. Isinya ceklis singkat dan apa yang harus dilakukan kalau salah satunya tidak terpenuhi.",
    kunci: [
      "Ceklis berisi pernyataan yang BISA DIPASTIKAN sendiri, bukan perasaan.",
      "Putusan muncul hanya setelah semua tercentang; sebelum itu ada kalimat 'berhenti dulu'.",
      "Tiap keadaan khusus jadi satu <details> yang KELIHATAN bisa dibuka (ada tulisan Buka/Tutup).",
      "Ditutup kotak 'Kalau terlanjur' berisi langkah berurutan.",
    ],
    contoh: CONTOH_ALAT,
    syarat: {
      minCheckbox: 3,
      minDetails: 3,
      minAturanHas: 2,
      wajibAda: [
        { potongan: "<summary", alasan: "Bagian yang bisa dibuka wajib punya ringkasannya." },
      ],
    },
  },
]

export function cariPola(id: string | null | undefined): Pola {
  return POLA.find((p) => p.id === id) ?? POLA[0]
}

/** Berapa grup radio berbeda (`name=` berbeda) ada di markah. */
function grupRadio(html: string): number {
  const nama = new Set<string>()
  for (const m of html.matchAll(/<input[^>]*type=["']?radio["']?[^>]*>/gi)) {
    const n = /name=["']([^"']+)["']/i.exec(m[0])
    if (n) nama.add(n[1])
  }
  return nama.size
}

/**
 * Memeriksa janji struktur sebuah pola.
 *
 * Mengembalikan daftar masalah; kosong berarti lolos. Dipakai untuk MENOLAK
 * lalu meminta ulang, bukan sekadar mencatat -- simulasi yang tidak memenuhi
 * polanya adalah simulasi yang akan dilihat peserta dalam bentuk cacat.
 */
export function periksaPola(html: string, pola: Pola): string[] {
  const masalah = periksaStruktur(html, pola)

  /*
   * Pemeriksaan jejak hanya berlaku untuk KELUARAN, bukan untuk contoh di
   * katalog ini -- contohnya memang berisi placeholder itu, dan menjalankan
   * pemeriksa yang sama padanya membuat contoh sendiri dinyatakan gagal.
   */
  const menyalin = JEJAK_CONTOH.filter((j) => html.includes(j))
  if (menyalin.length > 0)
    masalah.push(`menyalin dari contoh, bukan meniru: ${menyalin.join(", ")}`)

  return masalah
}

/** Hanya janji strukturnya. Dipakai juga untuk menguji contoh di katalog. */
export function periksaStruktur(html: string, pola: Pola): string[] {
  const masalah: string[] = []
  const s = pola.syarat

  const radio = (html.match(/<input[^>]*type=["']?radio/gi) ?? []).length
  const centang = (html.match(/<input[^>]*type=["']?checkbox/gi) ?? []).length
  const details = (html.match(/<details/gi) ?? []).length
  const has = (html.match(/:has\(/gi) ?? []).length

  if (s.minGrupRadio && grupRadio(html) < s.minGrupRadio)
    masalah.push(`perlu ${s.minGrupRadio} grup radio berbeda, baru ada ${grupRadio(html)}`)
  if (s.minRadio && radio < s.minRadio) masalah.push(`perlu ${s.minRadio} radio, baru ada ${radio}`)
  if (s.minCheckbox && centang < s.minCheckbox)
    masalah.push(`perlu ${s.minCheckbox} checkbox, baru ada ${centang}`)
  if (s.minDetails && details < s.minDetails)
    masalah.push(`perlu ${s.minDetails} bagian <details>, baru ada ${details}`)
  if (s.minAturanHas && has < s.minAturanHas)
    masalah.push(`perlu ${s.minAturanHas} aturan :has(), baru ada ${has}`)

  for (const w of s.wajibAda ?? []) {
    if (!html.includes(w.potongan)) masalah.push(`tidak ada "${w.potongan}" -- ${w.alasan}`)
  }

  /*
   * Kelas mati (aturan CSS menunjuk kelas yang tidak ada di markah) TIDAK
   * diperiksa di sini. `kelasYatim()` di lib/sanitize-interactive.ts sudah
   * melakukannya, dan lebih teliti: ia sengaja mengabaikan id, karena `#t0`
   * yang tidak dirujuk CSS justru benar -- itu keadaan awal. Memeriksanya di
   * dua tempat berarti dua aturan yang cepat atau lambat berbeda.
   */
  return masalah
}
