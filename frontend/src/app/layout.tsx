import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ClientOnly from "@/components/ClientOnly";
import ClientNav from "@/components/ClientNav";
import ThemeProvider from "@/components/ThemeProvider";
import HeaderBar from "@/components/HeaderBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI CAMP",
  description: "Plateforme d’apprentissage alimentée par IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <div className="min-h-dvh bg-gradient-to-b from-neutral-50 to-neutral-100 text-neutral-900 dark:from-neutral-900 dark:to-neutral-800 animated-gradient">
            <HeaderBar />
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          </div>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
