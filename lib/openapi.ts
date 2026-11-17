import { KATALOG_API, OPERASI_PUBLIK, pembukaApi, type Operasi, type RuasJawaban } from "@/lib/api-katalog"

/**
 * Dokumen OpenAPI 3.1 untuk API Sanggabiz.
 *
 * Dibangkitkan dari lib/api-katalog, sama seperti koleksi Postman. Tidak ada
 * berkas openapi.yaml yang ditulis tangan di repositori ini, dan itu
 * disengaja: berkas seperti itu benar sehari lalu perlahan berbohong, karena
 * tidak ada yang memaksanya ikut berubah saat rutenya berubah.
 *
 * Alamat server diisi dari alamat kanonik saat permintaan datang, bukan
 * ditulis mati -- supaya tombol "Try it out" di Swagger menembak lingkungan
 * yang sedang dibuka, bukan selalu produksi.
 */

type Skema = Record<string, unknown>

/**
 * OpenAPI 3.1 memakai JSON Schema penuh, jadi "boleh null" ditulis sebagai
 * tipe gabungan `["string", "null"]` -- bukan `nullable: true`, yang milik
 * 3.0 dan diam-diam diabaikan oleh perkakas 3.1.
 */
function skemaRuas(r: RuasJawaban): Skema {
  const s: Skema = {
    type: r.nullable ? [r.tipe, "null"] : r.tipe,
    description: r.keterangan,
  }
  if (r.format) s.format = r.format
  if (r.contoh !== undefined) s.examples = [r.contoh]
  return s
}

function objekDari(ruas: RuasJawaban[]): Skema {
  return {
    type: "object",
    properties: Object.fromEntries(ruas.map((r) => [r.nama, skemaRuas(r)])),
    // Yang tidak boleh null disebut wajib: klien yang dibangkitkan dari
    // dokumen ini lalu menolak jawaban cacat di tempatnya, bukan tiga lapis
    // kemudian saat ruasnya dipakai.
    required: ruas.filter((r) => !r.nullable).map((r) => r.nama),
  }
}

const SKEMA_HALAMAN: Skema = {
  type: "object",
  properties: {
    limit: { type: "integer", description: "Baris per halaman yang dipakai." },
    offset: { type: "integer", description: "Baris yang dilewati." },
    total: {
      type: ["integer", "null"],
      description: "Seluruh baris yang cocok, melintasi semua halaman.",
    },
  },
  required: ["limit", "offset"],
}

const SKEMA_GALAT: Skema = {
  type: "object",
  properties: {
    error: { type: "string", description: "Kode galat yang tetap, aman dibandingkan di kode Anda.", examples: ["unauthorized"] },
    message: { type: "string", description: "Kalimat untuk manusia. Boleh berubah; jangan dibandingkan." },
  },
  required: ["error", "message"],
}

function jawabanGalat(keterangan: string) {
  return {
    description: keterangan,
    content: { "application/json": { schema: { $ref: "#/components/schemas/Galat" } } },
  }
}

function operasiOpenApi(op: Operasi): Skema {
  const jawaban: Record<string, unknown> = {
    "200": {
      description: "Berhasil.",
      content: {
        "application/json": {
          schema:
            op.amplop === "halaman"
              ? {
                  type: "object",
                  properties: {
                    data: { type: "array", items: objekDari(op.ruas) },
                    pagination: SKEMA_HALAMAN,
                  },
                  required: ["data", "pagination"],
                }
              : { $ref: "#/components/schemas/StatistikPublik" },
        },
      },
    },
  }

  // Rute publik pun bisa gagal: ia membaca view di basis data, dan basis data
  // bisa tidak menjawab. Klien yang dokumentasinya hanya menjanjikan 200 akan
  // menampilkan "0 kursus" saat yang sebenarnya terjadi adalah gangguan.
  if (!op.lingkup) {
    jawaban["500"] = jawabanGalat("Angkanya gagal dibaca dari basis data. Coba lagi beberapa saat kemudian.")
  }

  if (op.lingkup) {
    jawaban["401"] = jawabanGalat("Kunci tidak ada atau tidak dikenal.")
    jawaban["403"] = jawabanGalat(`Kunci ini tidak punya lingkup \`${op.lingkup}\`.`)
  }
  if (op.badan) {
    jawaban["400"] = jawabanGalat("Badan permintaan bukan JSON, atau ada ruas wajib yang kosong.")
    jawaban["404"] = jawabanGalat("Pesertanya belum punya akun, atau kursusnya tidak ada.")
    jawaban["409"] = jawabanGalat("Kursusnya masih draf, jadi belum bisa diikuti siapa pun.")
  }

  return {
    operationId: op.id,
    summary: op.ringkas,
    description: op.keterangan,
    tags: [op.lingkup ? "API v1" : "Publik"],
    // `security: []` menimpa keamanan global: inilah yang membuat Swagger
    // membiarkan "Try it out" ditekan tanpa kunci pada rute publik.
    ...(op.lingkup ? {} : { security: [] }),
    ...(op.kueri && op.kueri.length > 0
      ? {
          parameters: op.kueri.map((q) => ({
            name: q.nama,
            in: "query",
            required: false,
            description: q.keterangan,
            /*
             * Tipe sesungguhnya, bukan "string" untuk semuanya.
             *
             * Dari sinilah Swagger memutuskan bentuk isiannya: integer
             * dengan batas menjadi kotak angka yang menolak huruf sebelum
             * permintaan dikirim, dan `pilihan` menjadi daftar pilihan.
             * Selama semuanya string, setiap isian adalah kotak teks bebas
             * yang menerima apa saja -- dan itu yang membuat "digital"
             * bisa masuk ke kolom offset tanpa satu pun peringatan.
             */
            schema: {
              type: q.tipe ?? "string",
              ...(q.format ? { format: q.format } : {}),
              ...(q.pilihan ? { enum: q.pilihan } : {}),
              ...(q.minimum !== undefined ? { minimum: q.minimum } : {}),
              ...(q.maximum !== undefined ? { maximum: q.maximum } : {}),
              /*
               * Contohnya ikut tipenya: "50" pada skema integer adalah
               * contoh yang TIDAK SAH menurut skemanya sendiri, dan
               * perkakas pembuat kode klien membacanya sebagai cacat.
               */
              ...(q.contoh
                ? { examples: [q.tipe === "integer" ? Number(q.contoh) : q.contoh] }
                : {}),
            },
          })),
        }
      : {}),
    ...(op.badan
      ? {
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: objekDari(op.badan.ruas),
                examples: { contoh: { value: op.badan.contoh } },
              },
            },
          },
        }
      : {}),
    responses: jawaban,
  }
}

const SKEMA_STATISTIK_PUBLIK: Skema = {
  type: "object",
  description: "Angka agregat saja. Tidak memuat nama, surel, atau id orang.",
  properties: {
    generated_at: { type: "string", format: "date-time", description: "Kapan angka ini dihitung." },
    totals: {
      type: "object",
      properties: {
        learners: { type: "integer", description: "Jumlah peserta." },
        courses: { type: "integer", description: "Jumlah kursus terbit." },
        enrollments: { type: "integer", description: "Jumlah pendaftaran." },
      },
      required: ["learners", "courses", "enrollments"],
    },
    courses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Id kursus." },
          title: { type: "string", description: "Judul kursus." },
          description: { type: ["string", "null"], description: "Ringkasan isi kursus." },
          level: { type: ["string", "null"], description: "beginner, intermediate, atau advanced." },
          language: { type: ["string", "null"], description: "Bahasa pengantar." },
          lessons: { type: ["integer", "null"], description: "Jumlah pelajaran." },
          duration_hours: { type: ["number", "null"], description: "Perkiraan lama belajar, dalam jam." },
          learners: {
            type: ["integer", "null"],
            description:
              "Jumlah peserta kursus itu. null berarti di bawah ambang dan sengaja disembunyikan -- bukan nol.",
          },
          is_demo: { type: "boolean", description: "Kursus contoh, bukan kelas sungguhan." },
        },
        required: ["id", "title", "is_demo"],
      },
    },
    notice: { type: "string", description: "Catatan pemakaian dari Sanggabiz." },
  },
  required: ["generated_at", "totals", "courses"],
}

export function dokumenOpenApi(dasar: string) {
  const jalur: Record<string, Record<string, unknown>> = {}
  for (const op of [OPERASI_PUBLIK, ...KATALOG_API]) {
    // GET dan POST berbagi /api/v1/enrollments, jadi dikumpulkan per jalur --
    // bukan satu entri per operasi, yang akan membuat yang kedua menimpa yang
    // pertama dan menghilangkan satu endpoint dari dokumentasi tanpa suara.
    jalur[op.jalur] ??= {}
    jalur[op.jalur][op.metode.toLowerCase()] = operasiOpenApi(op)
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Sanggabiz Academy API",
      version: "1.0.0",
      description: pembukaApi().join("\n"),
    },
    servers: [{ url: dasar, description: "Lingkungan yang sedang Anda buka." }],
    tags: [
      { name: "Publik", description: "Terbuka tanpa kunci. Bisa langsung dicoba di halaman ini." },
      { name: "API v1", description: "Perlu kunci API dari pengelola Sanggabiz." },
    ],
    components: {
      securitySchemes: {
        kunciApi: {
          type: "http",
          scheme: "bearer",
          description: "Kunci dari pengelola Sanggabiz, diawali `sgb_`. Dikirim sebagai `Authorization: Bearer sgb_...`.",
        },
      },
      schemas: {
        Galat: SKEMA_GALAT,
        StatistikPublik: SKEMA_STATISTIK_PUBLIK,
      },
    },
    security: [{ kunciApi: [] }],
    paths: jalur,
  }
}
