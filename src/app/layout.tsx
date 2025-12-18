import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import AIChatPopup from "@/components/ai/AIChatPopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vincons Quản lý máy",
  description: "Hệ thống quản lý tài sản và thiết bị Vincons",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vincons",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo-192.png" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} antialiased`}
        suppressHydrationWarning
      >
        <AppShell>
          {children}
        </AppShell>
        <Toaster />
        <InstallPrompt />
        <AIChatPopup />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(reg => console.log('SW registered'))
                  .catch(err => console.log('SW error:', err))
              })
            }
          `
        }} />
      </body>
    </html>
  );
}
