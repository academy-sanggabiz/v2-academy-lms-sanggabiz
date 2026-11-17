import { KEJADIAN_WEBHOOK } from "@/lib/api-keys"

/**
 * Koleksi Postman untuk API Sanggabiz.
 *
 * Dibuat di sini, bukan disimpan sebagai berkas JSON statis, supaya alamat
 * dasarnya ikut lingkungan: koleksi yang menunjuk localhost tidak berguna
 * bagi tim IT pelanggan, dan koleksi yang menunjuk produksi tidak berguna
 * saat menguji di pratinjau.
 *
 * Kuncinya TIDAK pernah ikut di dalam berkas. Ia variabel koleksi yang kosong
 * (`apiKey`), diisi sendiri oleh yang memakainya. Menyematkan kunci ke dalam
 * berkas yang lalu dikirim lewat surel dan disimpan di repositori pelanggan
 * adalah cara paling mudah membocorkannya.
 */
export function koleksiPostman(dasar: string) {
  const minta = (
    nama: string,
    metode: "GET" | "POST",
    jalur: string,
    keterangan: string,
    kueri: { key: string; value: string; description: string; disabled?: boolean }[] = [],
    badan?: Record<string, string>
  ) => ({
    name: nama,
    request: {
      method: metode,
      header: [
        { key: "Authorization", value: "Bearer {{apiKey}}" },
        ...(badan ? [{ key: "Content-Type", value: "application/json" }] : []),
      ],
      ...(badan ? { body: { mode: "raw", raw: JSON.stringify(badan, null, 2) } } : {}),
      url: {
        raw: `{{baseUrl}}${jalur}`,
        host: ["{{baseUrl}}"],
        path: jalur.replace(/^\//, "").split("/"),
        query: kueri.map((q) => ({ ...q, disabled: q.disabled ?? true })),
      },
      description: keterangan,
    },
  })

  const halaman = [
    { key: "limit", value: "50", description: "Jumlah baris per halaman, maksimal 200." },
    { key: "offset", value: "0", description: "Baris yang dilewati, untuk halaman berikutnya." },
  ]

  return {
    info: {
      name: "Sanggabiz Academy API v1",
      description: [
        "API Sanggabiz Academy untuk sistem internal perusahaan.",
        "",
        "CARA MEMAKAI",
        "1. Buka tab Variables pada koleksi ini.",
        "2. Isi `apiKey` dengan kunci yang diberikan Sanggabiz (diawali sgb_).",
        "3. Jalankan permintaan mana pun.",
        "",
        "Kunci tidak ikut tersimpan di dalam berkas ini. Setiap orang mengisi",
        "kuncinya sendiri.",
        "",
        "Seluruh data dibaca langsung dari basis data saat permintaan datang,",
        "bukan dari salinan berkala.",
        "",
        `Kejadian webhook yang tersedia: ${KEJADIAN_WEBHOOK.join(", ")}.`,
      ].join("\n"),
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    variable: [
      { key: "baseUrl", value: dasar, type: "string" },
      { key: "apiKey", value: "", type: "string" },
    ],
    item: [
      minta(
        "Daftar kursus",
        "GET",
        "/api/v1/courses",
        "Kursus yang terbit. Kursus privat dan draf tidak ikut.",
        halaman
      ),
      minta(
        "Daftar peserta",
        "GET",
        "/api/v1/learners",
        "Peserta beserta id karyawan, departemen, dan jabatannya bila sudah diisi.",
        [
          ...halaman,
          { key: "email", value: "", description: "Saring berdasarkan alamat surel." },
          { key: "externalId", value: "", description: "Saring berdasarkan id karyawan dari sistem Anda." },
        ]
      ),
      minta(
        "Daftar pendaftaran, kemajuan, dan nilai",
        "GET",
        "/api/v1/enrollments",
        [
          "Siapa mengikuti kursus apa, sudah sampai mana, dan nilainya berapa.",
          "",
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
        ].join("\n"),
        [
          ...halaman,
          { key: "learnerId", value: "", description: "Saring satu peserta." },
          { key: "courseId", value: "", description: "Saring satu kursus." },
          { key: "status", value: "completed", description: "active atau completed." },
        ]
      ),
      minta(
        "Daftarkan peserta ke kursus",
        "POST",
        "/api/v1/enrollments",
        [
          "Memerlukan kunci berlingkup write.",
          "",
          "Peserta yang belum punya akun TIDAK dibuatkan otomatis: alamat yang",
          "tidak dikenal dijawab 404. Satu salah ketik tidak boleh memunculkan",
          "orang dengan riwayat belajar yang tidak bisa diklaim siapa pun.",
        ].join("\n"),
        [],
        { learnerEmail: "peserta@perusahaan.co.id", courseId: "<id kursus>" }
      ),
      minta(
        "Daftar sertifikat",
        "GET",
        "/api/v1/certificates",
        "Sertifikat yang sudah terbit, beserta nomor serinya.",
        halaman
      ),
    ],
  }
}
