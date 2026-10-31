import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";

import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { getTranslations } from "@/lib/i18n/server";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Sanggabiz Academy", template: "%s · Sanggabiz Academy" },
  description: "Belajar dan mengajar jadi mudah.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `lang` harus ikut berganti, bukan hanya teksnya: pembaca layar memilih
  // suara dan aturan pelafalan dari atribut ini (WCAG 2.2 SC 3.1.1). Halaman
  // berbahasa Inggris dengan lang="id" akan dibacakan dengan pelafalan
  // Indonesia.
  const { locale, t } = await getTranslations();

  return (
    <html
      lang={locale}
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-md bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t.common.skipToContent}
        </a>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
