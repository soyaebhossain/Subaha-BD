import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SITE_NAME } from "@/lib/constants";
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
  title: `${SITE_NAME} | Marketplace`,
  description: "Shop products from Subah BD outlets and partner sellers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-slate-900`}
      >
        <div className="min-h-screen">
          <Header />
          <main id="main-content" className="site-container site-main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
