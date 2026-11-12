import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { resolveSuperAdminProfile } from "@/lib/auth/require-admin"
import { alamatKanonik } from "@/lib/site-url"
import { Button } from "@/components/ui/button"
import { KEJADIAN_WEBHOOK, MAKS_PERCOBAAN } from "@/lib/api-keys"

/**
 * Petunjuk API untuk tim IT pelanggan.
 *
 * Sengaja satu halaman di dalam aplikasi, bukan berkas di repositori: yang
 * membacanya adalah orang yang sedang memegang layar pengelola, dan petunjuk
 * yang harus dicari di tempat lain adalah petunjuk yang tidak dibaca. Alamat
 * dasarnya diambil dari `alamatKanonik()` supaya contohnya bisa disalin apa
 * adanya, bukan ditulis dengan placeholder yang harus diganti sendiri.
 *
 * Isinya sengaja berbahasa Indonesia -- pembacanya tim IT pelanggan di sini --
 * sementara nama ruas dan parameter tetap Inggris, karena itu kontrak mesin.
 */
export default async function PetunjukApiPage() {
  const result = await resolveSuperAdminProfile()
  if (result.status !== "ok") redirect("/admin/dashboard")

  const dasar = alamatKanonik()

  return (
    <div className="max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-3 px-0" render={<Link href="/admin/integrations" />} nativeButton={false}>
        <ArrowLeft className="size-4" aria-hidden />
        Integrasi
      </Button>

      <h1 className="text-3xl font-bold">Petunjuk API Sanggabiz</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Untuk tim IT yang menghubungkan sistem lain ke LMS ini.
      </p>

      <Bagian judul="Cara masuk">
        <p>
          Setiap permintaan membawa kunci API pada tajuk <Kode>Authorization</Kode>. Kunci dibuat di
          layar Integrasi dan hanya bisa dilihat sekali.
        </p>
        <Blok>{`curl -H "Authorization: Bearer sgb_xxxxxxxx_yyyy..." \\
  ${dasar}/api/v1/courses`}</Blok>
        <p>
          Kunci tanpa hak <Kode>write</Kode> hanya bisa membaca. Permintaan tanpa kunci dijawab{" "}
          <Kode>401</Kode>, kunci tanpa hak yang cukup dijawab <Kode>403</Kode>.
        </p>
      </Bagian>

      <Bagian judul="Alamat yang tersedia">
        <Daftar
          baris={[
            ["GET", "/api/v1/courses", "Kursus yang sudah terbit."],
            ["GET", "/api/v1/learners", "Peserta. Bisa disaring ?externalId= atau ?email="],
            ["GET", "/api/v1/enrollments", "Pendaftaran beserta kemajuannya. Bisa disaring ?learnerId=, ?courseId=, ?status="],
            ["POST", "/api/v1/enrollments", "Mendaftarkan peserta ke kursus. Perlu hak write."],
            ["GET", "/api/v1/certificates", "Sertifikat yang sudah terbit."],
          ]}
        />
        <p>
          Semua daftar memakai <Kode>?limit=</Kode> (maksimal 200) dan <Kode>?offset=</Kode>, dan
          menjawab dengan bentuk yang sama:
        </p>
        <Blok>{`{
  "data": [ ... ],
  "pagination": { "limit": 50, "offset": 0, "total": 128 }
}`}</Blok>
      </Bagian>

      <Bagian judul="Mendaftarkan peserta">
        <p>
          Peserta boleh ditunjuk dengan <Kode>learnerId</Kode>, <Kode>externalId</Kode> (nomor induk
          dari sistem Anda), atau <Kode>learnerEmail</Kode>.
        </p>
        <Blok>{`curl -X POST ${dasar}/api/v1/enrollments \\
  -H "Authorization: Bearer sgb_..." \\
  -H "Content-Type: application/json" \\
  -d '{"externalId": "NIK-00417", "courseId": "..."}'`}</Blok>
        <p>
          Alamat ini <strong>tidak pernah membuat akun baru</strong>. Peserta yang belum terdaftar
          dijawab <Kode>404 learner_not_found</Kode> — satu salah ketik surel seharusnya tidak
          melahirkan orang yang tidak ada. Memanggil ulang untuk pasangan yang sama aman: jawabannya
          tetap <Kode>201</Kode>, tidak ada pendaftaran ganda.
        </p>
      </Bagian>

      <Bagian judul="Webhook">
        <p>Kabar dikirim sebagai <Kode>POST</Kode> ke alamat yang Anda daftarkan, untuk kejadian:</p>
        <Daftar
          baris={KEJADIAN_WEBHOOK.map((k) => [
            "",
            k,
            k === "enrollment.created"
              ? "Peserta baru terdaftar di sebuah kursus."
              : k === "course.completed"
                ? "Peserta menuntaskan seluruh syarat kursus."
                : "Sertifikat diterbitkan.",
          ])}
        />
        <Blok>{`{
  "event": "course.completed",
  "deliveryId": "...",
  "data": {
    "enrollmentId": "...", "learnerId": "...",
    "learnerName": "...", "learnerEmail": "...",
    "courseId": "...", "courseTitle": "...",
    "completedAt": "2026-11-12T03:21:00Z"
  }
}`}</Blok>
      </Bagian>

      <Bagian judul="Memeriksa tanda tangan">
        <p>
          Tiap kiriman membawa <Kode>X-Sanggabiz-Signature: sha256=&lt;hmac&gt;</Kode>, yaitu HMAC
          SHA-256 atas <strong>badan mentah</strong> memakai kunci tanda tangan endpoint Anda.
          Hitung ulang sebelum mempercayai isinya — tanpa langkah ini, siapa pun yang menebak alamat
          Anda bisa mengirim kabar palsu.
        </p>
        <Blok>{`import crypto from "node:crypto"

const badan = await request.text()          // mentah, sebelum JSON.parse
const diharap = crypto.createHmac("sha256", RAHASIA).update(badan).digest("hex")
const diberikan = request.headers.get("x-sanggabiz-signature")?.replace("sha256=", "")

if (!crypto.timingSafeEqual(Buffer.from(diharap), Buffer.from(diberikan ?? ""))) {
  return new Response("tanda tangan tidak cocok", { status: 401 })
}`}</Blok>
      </Bagian>

      <Bagian judul="Bila penerima sedang mati">
        <p>
          Kabar yang gagal dicoba ulang sampai {MAKS_PERCOBAAN} kali dengan jeda yang makin panjang
          (1 menit, 5, 30, 2 jam, 12 jam). Sesudah itu ia berhenti dicoba dan tercatat gagal di
          jejak pengiriman. Jawab <Kode>2xx</Kode> secepat mungkin lalu kerjakan isinya di belakang
          layar — kami berhenti menunggu setelah 10 detik.
        </p>
        <p>
          <Kode>deliveryId</Kode> tetap sama di setiap percobaan ulang, jadi pakailah untuk
          membuang kabar kembar.
        </p>
      </Bagian>
    </div>
  )
}

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">{judul}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

function Kode({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">{children}</code>
}

function Blok({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground">
      <code>{children}</code>
    </pre>
  )
}

function Daftar({ baris }: { baris: (readonly [string, string, string])[] | string[][] }) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {baris.map(([metode, jalur, ket], i) => (
        <li key={i} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 px-3 py-2">
          {metode && <span className="text-xs font-semibold text-foreground">{metode}</span>}
          <code className="text-xs text-foreground">{jalur}</code>
          <span className="text-xs">{ket}</span>
        </li>
      ))}
    </ul>
  )
}
