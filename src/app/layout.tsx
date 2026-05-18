import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StoreCraft AI - Voice-to-Website Builder",
  description: "Transform your voice into a professional storefront website. AI-powered website generation for small businesses — bakeries, salons, restaurants, boutiques, and more.",
  keywords: ["voice-to-website", "AI website builder", "small business", "storefront", "bakery website", "salon website", "restaurant website", "boutique website", "AI website generator", "no-code website builder", "StoreCraft AI"],
  authors: [{ name: "StoreCraft AI" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "StoreCraft AI - Voice-to-Website Builder",
    description: "Transform your voice into a professional storefront website. AI-powered website generation for small businesses — bakeries, salons, restaurants, boutiques, and more.",
    url: "https://storecraft.ai",
    siteName: "StoreCraft AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StoreCraft AI - Voice-to-Website Builder",
    description: "Transform your voice into a professional storefront website. AI-powered website generation for small businesses.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
