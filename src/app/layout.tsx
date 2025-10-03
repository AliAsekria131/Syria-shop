import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bayn Bai - موقع الإعلانات المبوبة",
  description: "منصة إعلانات مبوبة لبيع وشراء المنتجات والخدمات",
  icons: {
    icon: "/icon-32x32.png",
  },
  openGraph: {
    title: "Bayn Bai",
    description: "منصة إعلانات مبوبة لبيع وشراء المنتجات والخدمات",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}