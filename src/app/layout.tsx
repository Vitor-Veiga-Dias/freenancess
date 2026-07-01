import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { getLocale } from "@/i18n/locale";
import { Providers } from "@/ui/providers";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Freenances",
  description: "Personal and business finance management via Open Finance",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${inter.variable} dark h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
