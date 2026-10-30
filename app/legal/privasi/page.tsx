import Link from "next/link"

export const metadata = {
  title: "Kebijakan Privasi · Sanggabiz Academy",
  description: "Data apa saja yang Sanggabiz Academy simpan tentang Anda, dan untuk apa.",
}

/**
 * Isi halaman ini diturunkan dari skema database yang benar-benar berjalan,
 * bukan dari templat umum: setiap butir di bawah menyebut data yang memang
 * tersimpan di tabel terkait. Kalau skemanya berubah, halaman ini ikut
 * diperbarui -- pemberitahuan privasi yang tidak cocok dengan kenyataan lebih
 * buruk daripada tidak ada.
 */
export default function PrivasiPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Kebijakan Privasi</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Halaman ini menjelaskan data apa yang kami simpan tentang Anda, untuk apa, dan apa hak
        Anda atasnya.
      </p>

      <div className="lesson-prose mt-10 space-y-8">
        <section>
          <h2 className="text-xl font-bold">Data yang kami simpan</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <strong>Identitas akun:</strong> alamat email dan nama lengkap yang Anda isi saat
              mendaftar.
            </li>
            <li>
              <strong>Kegiatan belajar:</strong> kursus yang Anda ikuti, pelajaran yang Anda
              tandai selesai beserta waktunya, dan posisi terakhir Anda pada pelajaran video.
            </li>
            <li>
              <strong>Kuis dan studi kasus:</strong> jawaban yang Anda kirim, jawaban sementara
              yang belum dikirim, nilai, status kelulusan, dan waktu setiap percobaan.
            </li>
            <li>
              <strong>Catatan pribadi Anda:</strong> catatan yang Anda tulis di dalam pelajaran.
              Catatan ini <strong>tidak dapat dibaca admin maupun instruktur</strong>; hanya Anda
              yang bisa membukanya.
            </li>
            <li>
              <strong>Ulasan kursus:</strong> bintang dan komentar yang Anda kirim, beserta
              identitas Anda sebagai pengirimnya.
            </li>
            <li>
              <strong>Sertifikat:</strong> nomor seri dan tanggal terbit, serta berkas PDF-nya.
            </li>
            <li>
              <strong>Pemberitahuan:</strong> isi notifikasi yang dikirimkan kepada Anda dan
              kapan Anda membacanya.
            </li>
            <li>
              <strong>Transaksi:</strong> nominal, mata uang, dan status, bila kursus berbayar.
              Kami tidak menyimpan nomor kartu atau data pembayaran Anda.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">Untuk apa data ini dipakai</h2>
          <p className="mt-3 text-sm">
            Menjalankan kelas Anda: menyimpan progres, menilai kuis, menerbitkan sertifikat, dan
            memberi tahu Anda hal yang penting. Admin kursus yang Anda ikuti dapat melihat
            progres dan nilai Anda untuk keperluan penilaian. Kami tidak menjual data Anda, dan
            tidak memakainya untuk iklan.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Siapa yang bisa melihat apa</h2>
          <p className="mt-3 text-sm">
            Pembatasan ini ditegakkan di tingkat database, bukan hanya di tampilan. Peserta lain
            tidak dapat melihat data Anda. Statistik publik yang kami terbitkan hanya berupa
            angka gabungan tanpa nama, dan jumlah peserta di bawah lima sengaja disembunyikan
            supaya tidak bisa ditelusuri ke orang tertentu.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Hak Anda</h2>
          <p className="mt-3 text-sm">
            Anda dapat mengubah nama Anda di halaman Profil, dan menghapus akun Anda di halaman
            Pengaturan. Penghapusan akun bersifat permanen dan ikut menghapus progres, jawaban
            kuis, catatan, serta sertifikat Anda. Untuk meminta salinan data Anda, hubungi kami.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Hubungi kami</h2>
          <p className="mt-3 text-sm">
            Pertanyaan tentang data Anda bisa dikirim ke pengelola Sanggabiz Academy melalui
            kanal resmi yang Anda pakai saat mendaftar.
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm">
        <Link href="/" className="text-ring underline underline-offset-4">
          Kembali ke halaman depan
        </Link>
      </p>
    </main>
  )
}
