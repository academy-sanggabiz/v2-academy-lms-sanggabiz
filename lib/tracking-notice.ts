/**
 * Isi pemberitahuan pelacakan perilaku, di satu tempat.
 *
 * UU PDP mewajibkan pemberitahuan yang **spesifik** sebelum pengumpulan:
 * data apa, untuk tujuan apa, disimpan berapa lama, dan siapa yang bisa
 * melihatnya. Satu kalimat umum di kebijakan privasi tidak memenuhi itu
 * (docs/STANDAR-PELACAKAN.md §4).
 *
 * Versinya ikut dicatat bersama tiap keputusan. Mengubah daftar di bawah
 * berarti pemberitahuannya berubah, jadi **naikkan versinya** -- persetujuan
 * atas teks lama tidak mencakup pengumpulan yang baru.
 */
export const TRACKING_NOTICE_VERSION = "2026-11-02"

export const TRACKING_NOTICE = {
  dikumpulkan: [
    "Pelajaran yang Anda buka, dan berapa lama halamannya terbuka.",
    "Kursus yang sedang Anda kerjakan beserta waktunya.",
  ],
  tujuan: [
    "Mengetahui bagian materi mana yang paling sering ditinggalkan, supaya materinya diperbaiki.",
    "Membandingkan satu angkatan dengan angkatan berikutnya.",
  ],
  tidakDilakukan: [
    "Tidak dipakai untuk menilai Anda, dan tidak memengaruhi nilai maupun kelulusan.",
    "Tidak dipakai membuat keputusan otomatis tentang Anda.",
    "Tidak dibagikan ke pihak di luar Sanggabiz Academy.",
  ],
  penyimpanan: "Disimpan paling lama 12 bulan, lalu dihapus otomatis.",
  siapaMelihat: "Hanya superadmin Sanggabiz Academy, dan Anda sendiri.",
  penarikan:
    "Anda boleh menolak sekarang dan tetap memakai seluruh fitur LMS tanpa terkecuali. Bila sudah menyetujui, Anda bisa menariknya kapan saja — pengumpulan langsung berhenti, dan Anda bisa menghapus data yang sudah terkumpul.",
} as const
