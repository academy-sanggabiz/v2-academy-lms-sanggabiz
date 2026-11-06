import type { Metadata } from "next";
import { Poppins, Oswald, Geist_Mono } from "next/font/google";
import "./globals.css";

import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { DisplayProvider } from "@/components/preferences/DisplayProvider";
import { getTranslations } from "@/lib/i18n/server";
import { getDisplayPreferences } from "@/lib/preferences/server";
import { displayAttributes } from "@/lib/preferences/display";
import { alamatKanonik } from "@/lib/site-url";
import { getSeo } from "@/lib/seo-server";
import { seoTerpakai } from "@/lib/seo";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/**
 * Huruf judul halaman depan saja.
 *
 * Poppins bulat dan ramah -- bagus untuk membaca lama di layar belajar, tetapi
 * pada judul besar ia melebar dan terbaca lembut. Halaman pemasaran butuh yang
 * sebaliknya: padat, berat, dan rapat, supaya satu baris kapital terasa tegas
 * tanpa harus diperbesar lagi.
 *
 * Lingkupnya SENGAJA cuma halaman depan (`--font-display`, dipakai
 * LandingBlocks). Token `--font-heading` yang dipakai judul dialog dan kartu di
 * seluruh aplikasi tidak disentuh: mengganti huruf di sana berarti mengganti
 * huruf layar belajar dan layar pengelola juga, dan keduanya bukan tempat
 * bereksperimen dengan merek.
 */
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Judul dan keterangan situs dibaca dari basis data, bukan ditulis di sini.
 *
 * `generateMetadata`, bukan `metadata` tetap, karena nilainya kini bisa diubah
 * pemilik lewat /admin/seo tanpa menyentuh kode atau menunggu deploy. Yang
 * dibaca hanya kolom TERBIT -- draf tidak pernah sampai ke mesin pencari
 * (lihat getSeo di lib/seo-server.ts).
 *
 * Judul mengikuti bahasa pengunjung; `template` membiarkan tiap halaman
 * menambahkan namanya sendiri di depan.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [{ locale }, seo] = await Promise.all([getTranslations(), getSeo()])
  const { title, description } = seoTerpakai(seo, locale)

  return {
    metadataBase: new URL(alamatKanonik()),
    title: { default: title, template: `%s · ${title}` },
    description,
    openGraph: {
      title,
      description,
      // Gambar kosong lebih baik daripada gambar yang tidak ada: alamat
      // kosong di openGraph.images membuat beberapa pengurai menampilkan
      // kotak rusak, bukan melewatinya.
      ...(seo.ogImageUrl ? { images: [{ url: seo.ogImageUrl }] } : {}),
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `lang` harus ikut berganti, bukan hanya teksnya: pembaca layar memilih
  // suara dan aturan pelafalan dari atribut ini (WCAG 2.2 SC 3.1.1). Halaman
  // berbahasa Inggris dengan lang="id" akan dibacakan dengan pelafalan
  // Indonesia.
  const [{ locale, t }, display] = await Promise.all([getTranslations(), getDisplayPreferences()]);

  return (
    <html
      lang={locale}
      {...displayAttributes(display)}
      className={`${poppins.variable} ${oswald.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-md bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t.common.skipToContent}
        </a>
        <LocaleProvider locale={locale}>
          <DisplayProvider preferences={display}>{children}</DisplayProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
