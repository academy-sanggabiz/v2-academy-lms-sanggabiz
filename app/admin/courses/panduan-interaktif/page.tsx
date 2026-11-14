import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AlertTriangle, ArrowLeft, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TombolCetak, TombolSalin } from "@/components/admin/courses/PanduanAksi"
import { requireAdmin } from "@/lib/auth/require-admin"
import { ATURAN_SISTEM, PERINTAH_AI } from "@/lib/interactive-guide"

/**
 * Panduan materi interaktif untuk tim penyusun, dibaca langsung di aplikasi.
 *
 * Alasannya sama dengan `/admin/integrations/petunjuk`: yang membacanya adalah
 * orang yang sedang memegang layar ini, dan petunjuk yang harus dicari di
 * tempat lain adalah petunjuk yang tidak dibaca.
 *
 * **Dua bentuk, dua pembaca.** Berkas `.md` yang bisa diunduh di bawah
 * ditujukan untuk ASISTEN AI penyusun -- itu format yang paling mudah
 * diunggah ke mana pun tanpa berubah bentuk, dan isinya memuat contoh HTML
 * penuh yang tidak enak dibaca manusia. Halaman ini untuk ORANGNYA: bergambar,
 * berlangkah, dan bisa disimpan jadi PDF lewat tombol Cetak. Keduanya memakai
 * sumber yang sama (`PERINTAH_AI`, `ATURAN_SISTEM`), jadi tidak bisa berbeda.
 *
 * Berbahasa Indonesia saja, mengikuti halaman petunjuk API: pembacanya tim
 * penyusun materi di sini.
 */
export default async function PanduanInteraktifPage() {
  try {
    await requireAdmin()
  } catch {
    redirect("/admin/dashboard")
  }

  return (
    <div className="panduan-cetak max-w-3xl">
      <div className="tanpa-cetak">
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 px-0"
          render={<Link href="/admin/courses" />}
          nativeButton={false}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kelola Kursus
        </Button>
      </div>

      <h1 className="text-3xl font-bold">Menyusun materi interaktif</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Untuk tim penyusun materi. Perkiraan waktu baca 6 menit.
      </p>

      <div className="tanpa-cetak mt-5 flex flex-wrap items-center gap-2">
        <TombolCetak />
        <Button
          variant="outline"
          size="sm"
          render={<a href="/admin/courses/panduan-interaktif/unduh" download />}
          nativeButton={false}
        >
          <Download className="size-4" aria-hidden="true" />
          panduan-materi-interaktif.md
        </Button>
      </div>
      <p className="tanpa-cetak mt-2 text-xs text-muted-foreground">
        Berkas <code className="text-[11px]">.md</code> itu untuk diunggah ke asisten AI Anda,
        bukan untuk dibaca. Isinya sama dengan halaman ini, ditambah contoh HTML penuh.
      </p>

      <Bagian judul="Hasilnya seperti apa">
        <p>
          Materi interaktif adalah satu berkas HTML yang bisa diklik peserta. Bagian yang
          dibuka-tutup, latihan yang langsung memberi tanggapan, daftar periksa yang menandai
          dirinya sendiri.
        </p>
        <Gambar
          src="/panduan/3-hasil.png"
          alt="Materi interaktif di layar peserta: judul, tiga kartu penjelasan, dan daftar bagian yang bisa dibuka."
          lebar={840}
          tinggi={470}
          keterangan="Yang dilihat peserta. Tiga kartu di atas, lalu bagian yang bisa dibuka satu per satu."
        />
        <Gambar
          src="/panduan/4-latihan.png"
          alt="Latihan pilih jawaban: pilihan yang dipilih tersorot, dan tanggapan hijau muncul di bawahnya."
          lebar={840}
          tinggi={330}
          keterangan="Peserta memilih jawaban, tanggapannya langsung muncul. Tanpa satu baris JavaScript."
        />
        <p>
          Anda membuatnya di luar LMS, lalu mengunggahnya ke salah satu pelajaran. Satu kursus
          boleh berisi campuran video, teks, slide, kuis, dan materi interaktif.
        </p>
      </Bagian>

      <Bagian judul="Yang membedakan materi interaktif dari kuis">
        <p>
          Ini bagian yang paling mudah salah. Pada <strong>kuis</strong>, peserta menjawab
          pertanyaan tentang bahan. Pada <strong>simulasi</strong>, peserta mengerjakan tugas di
          dalam tiruan layar, lalu melihat akibatnya.
        </p>
        <p>
          Keduanya berguna, tetapi hanya yang kedua yang tidak bisa dibuat dengan kuis biasa. Kalau
          materi interaktif Anda isinya pertanyaan berhias, pakai saja jenis Kuis: lebih sederhana,
          dan nilainya tercatat.
        </p>
        <Gambar
          src="/panduan/5-simulasi.png"
          alt="Simulasi di layar peserta: tiruan percakapan di ponsel, daftar tindakan yang bisa dipilih, dan kotak akibat di sebelahnya."
          lebar={900}
          tinggi={560}
          keterangan="Peserta memilih tindakan. Layar ponselnya berganti, dan akibatnya diceritakan — bukan dinilai benar atau salah."
        />
        <p>
          Tiga hal yang membuatnya terasa hidup: satu <strong>tugas</strong> yang jelas di awal,
          <strong> akibat</strong> yang berbeda untuk tiap tindakan, dan beberapa{" "}
          <strong>varian situasi</strong> yang bisa dipilih.
        </p>
        <p>
          Varian itu ada ujiannya, dan mudah gagal. <strong>Kalau tindakan yang menyelamatkan
          tetap sama di semua varian, variannya tidak mengajarkan apa-apa.</strong> Varian yang
          baik menghilangkan satu tanda, atau menutup salah satu jalan keluar.
        </p>
        <p>
          Versi pertama simulasi di atas punya tombol untuk mengaburkan layar dan menurunkan
          kontras. Terlihat canggih, dan tidak ada gunanya: jawaban yang benar tetap sama. Varian
          seperti itu hanya pantas kalau pelajarannya memang tentang keterbacaan.
        </p>
        <p>
          Satu hal yang tidak bisa: penghitung waktu dan penghitung salah-tekan. Keduanya menuntut
          JavaScript, dan materi interaktif berjalan tanpa itu.
        </p>
      </Bagian>

      <Bagian judul="Langkah 1 · Minta AI membuatkan berkasnya">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Buka asisten AI Anda: ChatGPT, Claude, atau Gemini.</li>
          <li>
            Unduh berkas <code className="text-xs">panduan-materi-interaktif.md</code> di atas,
            lalu unggah ke sana.
          </li>
          <li>Unggah juga bahan Anda sendiri: SOP, catatan pelatihan, salindia lama.</li>
          <li>Salin perintah di bawah ini, tempel, lalu kirim.</li>
        </ol>

        <div className="mt-3.5 rounded-lg border border-border bg-muted/30 p-3.5">
          {/*
            Kotak yang bisa digulir harus bisa dicapai papan ketik, atau
            isinya tak terjangkau bagi yang tidak memakai tetikus (axe:
            scrollable-region-focusable). `tabIndex` yang membuatnya bisa
            difokus; `role` dan nama yang membuat pembaca layar tahu ini apa.
          */}
          <pre
            tabIndex={0}
            role="region"
            aria-label="Perintah untuk asisten AI"
            className="max-h-72 overflow-auto rounded text-xs leading-relaxed whitespace-pre-wrap focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {PERINTAH_AI}
          </pre>
          <div className="tanpa-cetak mt-3">
            <TombolSalin teks={PERINTAH_AI} />
          </div>
        </div>

        <p className="mt-3.5">
          Simpan hasilnya sebagai berkas <code className="text-xs">.html</code>. Buka dulu di
          peramban Anda untuk melihat bentuknya. Kalau ada yang kurang pas, minta perbaikannya ke
          AI yang sama.
        </p>
      </Bagian>

      <Bagian judul="Langkah 2 · Unggah ke pelajaran">
        <p>
          Buka <strong>Kelola Kursus</strong>, pilih kursusnya, masuk ke tab{" "}
          <strong>Pelajaran</strong>. Buka pelajaran yang dituju, lalu pilih jenis{" "}
          <strong>Materi Interaktif</strong>.
        </p>
        <Gambar
          src="/panduan/1-pilih-jenis.png"
          alt="Daftar jenis pelajaran di penyunting, dengan pilihan Materi Interaktif di bawah Pelajaran Slide."
          lebar={660}
          tinggi={300}
          keterangan="Jenis pelajaran. Materi Interaktif ada di antara Slide dan Kuis."
        />
        <p>
          Bagian <strong>Konten</strong> di bawahnya akan berganti. Tekan{" "}
          <strong>Unggah berkas HTML</strong> dan pilih berkas Anda.
        </p>
        <Gambar
          src="/panduan/2-unggah.png"
          alt="Bagian Konten dengan tombol Unggah berkas HTML dan tautan unduh panduan di bawahnya."
          lebar={760}
          tinggi={280}
          keterangan="Tombol unggahnya. Panduan ini juga bisa dibuka lagi dari sini."
        />
      </Bagian>

      <Bagian judul="Langkah 3 · Periksa pratinjau, lalu simpan">
        <p>
          Di bawah kotak unggah ada <strong>Pratinjau</strong>. Yang Anda lihat di situ persis yang
          dilihat peserta. Coba klik bagian yang bisa dibuka dan jawab latihannya.
        </p>
        <p>
          Kalau sudah benar, simpan kursusnya seperti biasa. Kotak{" "}
          <strong>Perbaikan kecil</strong> hanya untuk mengganti satu atau dua kata. Untuk
          perubahan besar, perbaiki di berkas asli lalu unggah ulang.
        </p>
      </Bagian>

      <Bagian judul="Kalau muncul kotak kuning">
        <div className="flex gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <div className="font-semibold">Dibuang saat dibersihkan</div>
            <p className="mt-1">
              Kotak ini menyebut apa saja yang dihapus dari berkas Anda. Materinya tetap tersimpan,
              tetapi bagian yang disebut sudah tidak ada.
            </p>
          </div>
        </div>
        <p className="mt-3">
          Cara memperbaikinya: kembali ke asisten AI Anda, tempelkan isi kotak kuning itu, dan
          minta berkasnya dibuat ulang tanpa bagian tersebut. Lalu unggah lagi.
        </p>
        <p>
          Kotak abu-abu <strong>Yang perlu Anda tahu</strong> berbeda. Itu bukan penghapusan,
          melainkan hal yang sebaiknya diperbaiki: judul yang melompat, gambar tanpa keterangan,
          kotak pilihan tanpa label. Materinya tetap bisa diterbitkan. Tetapi sebagian peserta akan
          kesulitan membacanya.
        </p>
      </Bagian>

      <Bagian judul="Aturan yang ditegakkan sistem">
        <p>
          LMS membersihkan setiap berkas sebelum menyimpannya. Anda tidak perlu menghafal daftar
          ini. AI yang sudah diberi panduan akan mematuhinya sendiri.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Aturan
                </th>
                <th scope="col" className="py-2 font-semibold">
                  Kenapa
                </th>
              </tr>
            </thead>
            <tbody>
              {ATURAN_SISTEM.map((a) => (
                <tr key={a.aturan} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-4 font-medium">{a.aturan}</td>
                  <td className="py-2 text-muted-foreground">{a.kenapa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bagian>

      <Bagian judul="Kapan tidak usah memakai ini">
        <p>
          Materi interaktif bukan satu-satunya cara. Kalau bahan Anda paling pas sebagai teks biasa,
          video, atau salindia, pakailah itu. Jenis pelajaran lain tetap ada dan tetap setara.
        </p>
        <p>Satu berkas memuat satu bahasa. Kalau butuh dua bahasa, buat dua pelajaran.</p>
      </Bagian>
    </div>
  )
}

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="mb-2.5 text-xl font-bold">{judul}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground">{children}</div>
    </section>
  )
}

/**
 * Gambar langkah, dengan keterangan yang berdiri sendiri.
 *
 * `alt` menerangkan ISI gambarnya untuk yang tidak melihatnya; keterangan di
 * bawah menerangkan ARTINYA untuk semua orang. Keduanya berbeda dengan
 * sengaja -- menyalin keterangan ke dalam alt membuat pengguna pembaca layar
 * mendengar kalimat yang sama dua kali dan tetap tidak tahu gambarnya apa.
 */
function Gambar({
  src,
  alt,
  lebar,
  tinggi,
  keterangan,
}: {
  src: string
  alt: string
  lebar: number
  tinggi: number
  keterangan: string
}) {
  return (
    <figure className="mt-3.5">
      {/*
        `sizes` WAJIB di sini. Tanpanya pengoptimal gambar diminta lebar persis
        `width`, dan lebar yang tidak ada di daftar bawaan Next ditolak dengan
        400 -- keempat gambar panduan ini gagal dimuat tanpa satu pun pesan di
        konsol. Dengan `sizes`, lebarnya dipilih dari daftar itu sendiri.
      */}
      <Image
        src={src}
        alt={alt}
        width={lebar}
        height={tinggi}
        sizes="(min-width: 768px) 768px, 100vw"
        className="h-auto w-full rounded-lg border border-border"
      />
      <figcaption className="mt-1.5 text-xs text-muted-foreground">{keterangan}</figcaption>
    </figure>
  )
}
