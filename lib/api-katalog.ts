import { KEJADIAN_WEBHOOK } from "@/lib/api-keys"

/**
 * Katalog API v1: satu sumber kebenaran untuk SETIAP cara kita menjelaskan
 * API ini kepada orang luar.
 *
 * Sebelum berkas ini ada, koleksi Postman memegang daftar endpoint-nya
 * sendiri. Begitu dokumentasi Swagger ditambahkan, akan ada dua daftar yang
 * harus diubah bersamaan setiap kali satu ruas bertambah -- dan yang kedua
 * selalu yang terlupa. Dokumentasi yang berbohong lebih buruk daripada tidak
 * ada dokumentasi: tim IT pelanggan membangun di atasnya, lalu menyalahkan
 * sistemnya saat ruas yang dijanjikan tidak pernah datang.
 *
 * Jadi: tambahkan endpoint SEKALI di sini, dan Postman (lib/postman-collection)
 * maupun OpenAPI (lib/openapi) ikut berubah dengan sendirinya.
 *
 * Bahasanya sengaja Indonesia untuk prosa dan Inggris untuk nama ruas serta
 * parameter -- aturan yang sama dengan halaman Petunjuk API. Prosanya dibaca
 * manusia di sini; nama ruasnya kontrak mesin dan tidak boleh diterjemahkan.
 */

export type RuasJawaban = {
  nama: string
  /** Tipe JSON apa adanya, bukan tipe basis data. */
  tipe: "string" | "number" | "integer" | "boolean"
  /** Format OpenAPI bila ada artinya bagi klien: uuid, date-time, email. */
  format?: string
  /** Boleh null. Ditulis eksplisit karena beberapa null di sini PUNYA arti --
   *  lihat `grade`. */
  nullable?: boolean
  keterangan: string
  contoh?: string | number | boolean | null
}

export type ParameterKueri = {
  nama: string
  contoh: string
  keterangan: string
  /** Ditandai di Postman sebagai baris yang aktif, bukan yang dimatikan. */
  selaluAktif?: boolean
}

export type Operasi = {
  /** Dipakai sebagai operationId OpenAPI; harus unik dan stabil, karena
   *  pembuat kode klien memakainya sebagai nama fungsi. */
  id: string
  nama: string
  metode: "GET" | "POST"
  jalur: string
  ringkas: string
  /** Prosa panjang. Baris pertama dipakai sebagai ringkasan bila `ringkas`
   *  kosong; selebihnya ikut apa adanya. */
  keterangan: string
  /** Lingkup kunci yang diperlukan. `null` berarti terbuka tanpa kunci. */
  lingkup: "read" | "write" | null
  kueri?: ParameterKueri[]
  badan?: { contoh: Record<string, string>; ruas: RuasJawaban[] }
  /** Ruas pada tiap baris di dalam `data`. Kosong berarti jawabannya bukan
   *  daftar berhalaman (lihat `amplop`). */
  ruas: RuasJawaban[]
  /** Daftar berhalaman memakai amplop `{ data, pagination }`; statistik publik
   *  memakai bentuknya sendiri. */
  amplop: "halaman" | "sendiri"
}

const HALAMAN: ParameterKueri[] = [
  { nama: "limit", contoh: "50", keterangan: "Jumlah baris per halaman, maksimal 200." },
  { nama: "offset", contoh: "0", keterangan: "Baris yang dilewati, untuk halaman berikutnya." },
]

const RUAS_KURSUS: RuasJawaban[] = [
  { nama: "id", tipe: "string", format: "uuid", keterangan: "Id kursus. Dipakai sebagai courseId di endpoint lain." },
  { nama: "title", tipe: "string", keterangan: "Judul kursus." },
  { nama: "description", tipe: "string", nullable: true, keterangan: "Ringkasan isi kursus." },
  { nama: "level", tipe: "string", nullable: true, keterangan: "beginner, intermediate, atau advanced." },
  { nama: "language", tipe: "string", nullable: true, keterangan: "Bahasa pengantar kursus." },
  { nama: "price", tipe: "number", nullable: true, keterangan: "Harga dalam rupiah. null berarti tidak dijual terpisah." },
  { nama: "private", tipe: "boolean", keterangan: "Kursus tertutup yang hanya bisa diikuti lewat undangan." },
  { nama: "createdAt", tipe: "string", format: "date-time", keterangan: "Kapan kursus dibuat." },
]

const RUAS_PESERTA: RuasJawaban[] = [
  { nama: "id", tipe: "string", format: "uuid", keterangan: "Id peserta. Dipakai sebagai learnerId di endpoint lain." },
  { nama: "name", tipe: "string", keterangan: "Nama lengkap peserta." },
  { nama: "email", tipe: "string", format: "email", keterangan: "Alamat surel peserta." },
  {
    nama: "externalId",
    tipe: "string",
    nullable: true,
    keterangan:
      "Id karyawan dari sistem Anda, bila sudah dicocokkan. Inilah ruas yang dipakai untuk menyambung data ini ke HRIS Anda tanpa mengandalkan surel.",
  },
  { nama: "departmentId", tipe: "string", format: "uuid", nullable: true, keterangan: "Departemen peserta." },
  { nama: "jobTitleId", tipe: "string", format: "uuid", nullable: true, keterangan: "Jabatan peserta." },
  { nama: "createdAt", tipe: "string", format: "date-time", keterangan: "Kapan akun peserta dibuat." },
]

const RUAS_PENDAFTARAN: RuasJawaban[] = [
  { nama: "id", tipe: "string", format: "uuid", keterangan: "Id pendaftaran." },
  { nama: "learnerId", tipe: "string", format: "uuid", keterangan: "Peserta yang mengikuti." },
  { nama: "courseId", tipe: "string", format: "uuid", keterangan: "Kursus yang diikuti." },
  { nama: "status", tipe: "string", keterangan: "active atau completed.", contoh: "completed" },
  { nama: "enrolledAt", tipe: "string", format: "date-time", keterangan: "Kapan peserta mendaftar." },
  { nama: "completedAt", tipe: "string", format: "date-time", nullable: true, keterangan: "Kapan kursus diselesaikan. null bila belum." },
  { nama: "lessonsCompleted", tipe: "integer", keterangan: "Pelajaran yang sudah dituntaskan." },
  { nama: "lessonsTotal", tipe: "integer", keterangan: "Seluruh pelajaran di kursus itu." },
  { nama: "progressPercent", tipe: "integer", keterangan: "Kemajuan 0-100, dihitung dari dua ruas di atas." },
  {
    nama: "grade",
    tipe: "number",
    nullable: true,
    keterangan:
      "Nilai akhir 0-100. null berarti kursusnya memang tidak punya kuis yang dinilai -- bukan nol. Jangan ubah null menjadi 0: itu melaporkan kursus tanpa ujian sebagai kegagalan.",
  },
  {
    nama: "gradePending",
    tipe: "integer",
    keterangan:
      "Jawaban esai yang masih menunggu dinilai pengajar. Selama di atas nol, grade masih bisa naik dan belum boleh disebut nilai akhir.",
  },
  { nama: "quizzesTotal", tipe: "integer", keterangan: "Kuis yang menentukan nilai di kursus itu." },
  {
    nama: "quizzesAttempted",
    tipe: "integer",
    keterangan:
      "Kuis yang sudah dikerjakan peserta. WAJIB dibaca bersama grade: nilai 0 dengan quizzesAttempted 0 berarti BELUM MULAI, sedangkan nilai 0 dengan quizzesAttempted penuh berarti benar-benar gagal.",
  },
]

const RUAS_SERTIFIKAT: RuasJawaban[] = [
  { nama: "id", tipe: "string", format: "uuid", keterangan: "Id sertifikat." },
  { nama: "serial", tipe: "string", keterangan: "Nomor seri yang tercetak di sertifikat dan bisa diverifikasi." },
  { nama: "issuedAt", tipe: "string", format: "date-time", keterangan: "Kapan sertifikat terbit." },
  { nama: "pdfUrl", tipe: "string", nullable: true, keterangan: "Tautan berkas PDF sertifikat." },
  { nama: "enrollmentId", tipe: "string", format: "uuid", nullable: true, keterangan: "Pendaftaran yang menghasilkannya." },
  { nama: "learnerId", tipe: "string", format: "uuid", nullable: true, keterangan: "Peserta pemilik sertifikat." },
  { nama: "courseId", tipe: "string", format: "uuid", nullable: true, keterangan: "Kursus yang diselesaikan." },
]

/**
 * Catatan baca-nilai yang diulang di dua tempat.
 *
 * Sengaja diulang, bukan ditautkan: yang membaca `/api/v1/enrollments` di
 * Swagger tidak sedang membaca deskripsi koleksi Postman, dan salah membaca
 * ruas ini menghasilkan dasbor yang menuduh orang gagal padahal belum mulai.
 */
const CARA_BACA_NILAI = [
  "grade            nilai akhir 0-100, atau null bila kursusnya tidak punya",
  "                 kuis yang dinilai.",
  "quizzesAttempted berapa kuis yang sudah dikerjakan peserta.",
  "quizzesTotal     berapa kuis yang menentukan nilai di kursus itu.",
  "gradePending     berapa jawaban esai yang masih menunggu dinilai pengajar.",
  "                 Selama ini di atas nol, nilainya masih bisa naik.",
  "",
  "BACA grade BERSAMA quizzesAttempted. Nilai 0 dengan quizzesAttempted 0",
  "berarti pesertanya BELUM MULAI, bukan gagal. Nilai 0 dengan",
  "quizzesAttempted penuh berarti benar-benar gagal. Dasbor yang hanya",
  "membaca grade akan melaporkan orang yang belum mulai sebagai orang",
  "yang gagal.",
].join("\n")

export const KATALOG_API: Operasi[] = [
  {
    id: "daftarKursus",
    nama: "Daftar kursus",
    metode: "GET",
    jalur: "/api/v1/courses",
    ringkas: "Daftar kursus terbit",
    keterangan: "Kursus yang terbit. Kursus privat dan draf tidak ikut.",
    lingkup: "read",
    kueri: HALAMAN,
    ruas: RUAS_KURSUS,
    amplop: "halaman",
  },
  {
    id: "daftarPeserta",
    nama: "Daftar peserta",
    metode: "GET",
    jalur: "/api/v1/learners",
    ringkas: "Daftar peserta",
    keterangan: "Peserta beserta id karyawan, departemen, dan jabatannya bila sudah diisi.",
    lingkup: "read",
    kueri: [
      ...HALAMAN,
      { nama: "email", contoh: "", keterangan: "Saring berdasarkan alamat surel." },
      { nama: "externalId", contoh: "", keterangan: "Saring berdasarkan id karyawan dari sistem Anda." },
    ],
    ruas: RUAS_PESERTA,
    amplop: "halaman",
  },
  {
    id: "daftarPendaftaran",
    nama: "Daftar pendaftaran, kemajuan, dan nilai",
    metode: "GET",
    jalur: "/api/v1/enrollments",
    ringkas: "Pendaftaran, kemajuan, dan nilai peserta",
    keterangan: [
      "Siapa mengikuti kursus apa, sudah sampai mana, dan nilainya berapa.",
      "",
      CARA_BACA_NILAI,
    ].join("\n"),
    lingkup: "read",
    kueri: [
      ...HALAMAN,
      { nama: "learnerId", contoh: "", keterangan: "Saring satu peserta." },
      { nama: "courseId", contoh: "", keterangan: "Saring satu kursus." },
      { nama: "status", contoh: "completed", keterangan: "active atau completed." },
    ],
    ruas: RUAS_PENDAFTARAN,
    amplop: "halaman",
  },
  {
    id: "daftarkanPeserta",
    nama: "Daftarkan peserta ke kursus",
    metode: "POST",
    jalur: "/api/v1/enrollments",
    ringkas: "Daftarkan peserta ke kursus",
    keterangan: [
      "Memerlukan kunci berlingkup write.",
      "",
      "Peserta yang belum punya akun TIDAK dibuatkan otomatis: alamat yang",
      "tidak dikenal dijawab 404. Satu salah ketik tidak boleh memunculkan",
      "orang dengan riwayat belajar yang tidak bisa diklaim siapa pun.",
    ].join("\n"),
    lingkup: "write",
    badan: {
      /*
       * Id contohnya nol semua, bukan "<id kursus>".
       *
       * Bentuknya UUID yang sah, jadi tombol "Try it out" di Swagger tidak
       * terisi nilai yang sudah cacat sebelum dikirim; nol semua juga jelas
       * terbaca sebagai nilai yang harus diganti, dan kalau terlanjur dikirim
       * jawabannya 404 yang menjelaskan dirinya sendiri.
       */
      contoh: { learnerEmail: "peserta@perusahaan.co.id", courseId: "00000000-0000-0000-0000-000000000000" },
      ruas: [
        { nama: "learnerEmail", tipe: "string", format: "email", keterangan: "Surel peserta yang SUDAH punya akun." },
        { nama: "courseId", tipe: "string", format: "uuid", keterangan: "Kursus yang akan diikuti." },
      ],
    },
    ruas: RUAS_PENDAFTARAN,
    amplop: "halaman",
  },
  {
    id: "daftarSertifikat",
    nama: "Daftar sertifikat",
    metode: "GET",
    jalur: "/api/v1/certificates",
    ringkas: "Daftar sertifikat terbit",
    keterangan: "Sertifikat yang sudah terbit, beserta nomor serinya.",
    lingkup: "read",
    kueri: HALAMAN,
    ruas: RUAS_SERTIFIKAT,
    amplop: "halaman",
  },
]

/**
 * Statistik publik, dipisah dari KATALOG_API karena beda sifat.
 *
 * Ia tidak perlu kunci, tidak berhalaman, dan tidak pernah boleh ikut ke
 * koleksi Postman yang seluruh permintaannya membawa header Authorization.
 * Di Swagger ia justru yang paling berguna: satu-satunya yang bisa ditekan
 * "Try it out" oleh orang yang belum punya kunci apa pun.
 */
export const OPERASI_PUBLIK: Operasi = {
  id: "statistikPublik",
  nama: "Statistik publik",
  metode: "GET",
  jalur: "/api/public/stats",
  ringkas: "Ringkasan publik tanpa kunci",
  keterangan: [
    "Terbuka tanpa kunci, dan boleh dipanggil dari peramban mana pun.",
    "",
    "Isinya sengaja hanya angka agregat dan keterangan kursus. Tidak ada nama,",
    "surel, atau id orang -- batas itu ditegakkan di basis data lewat view",
    "khusus, bukan hanya oleh kode rutenya. Kursus draf dan privat tidak ikut.",
    "",
    "Pakai ini untuk menempelkan jumlah kursus atau peserta ke situs perusahaan",
    "tanpa perlu menaruh kunci API di dalam halaman yang bisa dibaca siapa pun.",
  ].join("\n"),
  lingkup: null,
  ruas: [],
  amplop: "sendiri",
}

/** Prosa pembuka yang dipakai koleksi Postman maupun dokumentasi Swagger. */
export function pembukaApi(): string[] {
  return [
    "API Sanggabiz Academy untuk sistem internal perusahaan.",
    "",
    "CARA MASUK",
    "Setiap permintaan ke /api/v1 membawa header:",
    "    Authorization: Bearer sgb_...",
    "Kunci diberikan oleh pengelola Sanggabiz dan punya lingkup sendiri:",
    "kunci read hanya bisa membaca, kunci write bisa mendaftarkan peserta.",
    "",
    "Seluruh data dibaca langsung dari basis data saat permintaan datang,",
    "bukan dari salinan berkala.",
    "",
    `Kejadian webhook yang tersedia: ${KEJADIAN_WEBHOOK.join(", ")}.`,
  ]
}
