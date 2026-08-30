import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "HanziBank — Master Mandarin Chinese Vocabulary",
  description:
    "Personal Mandarin Chinese vocabulary practice web app with flip cards, matching games, tone diacritics, and cross-device sync.",
  manifest: "/manifest.json",
  icons: {
    icon: "/brand/Hanzibank monocol logomark_yellow.svg",
    shortcut: "/brand/Hanzibank monocol logomark_yellow.svg",
    apple: "/brand/Hanzibank Logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HanziBank",
  },
};

export const viewport: Viewport = {
  themeColor: "#6c2ece",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        <Providers>
          <div className="min-h-screen flex flex-col bg-background text-foreground">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
