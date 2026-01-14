import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RPCProvider } from "@/libs";
import { QueryProvider } from "@/libs/providers";
import { Toaster } from "sonner";
import { AIAssistant } from "@/components/ui/AIAssistant";
import { AppCaptchaGate } from "@/components/ui/AppCaptchaGate";
import { NetworkProvider } from "@/libs/context/network-context";
import { NodesDataProvider } from "@/libs/context/nodes-data-context";
import { StructuredData } from "@/libs/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XanDash - Real-Time Xandeum Network Dashboard & Node Monitor",
  description: "Monitor Xandeum pNodes in real-time. Track node performance, uptime, storage, credits, and network statistics. AI-powered analytics for devnet and mainnet validators.",
  keywords: ["Xandeum", "pNodes", "network monitoring", "dashboard", "validators", "blockchain", "storage network", "node tracker", "devnet", "mainnet"],
  manifest: "/manifest.json",
  metadataBase: new URL('https://www.xandash.online'),
  alternates: {
    canonical: 'https://www.xandash.online',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "any" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [
      { url: "/icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "XanDash",
  },
  openGraph: {
    title: "XanDash - Real-Time Xandeum Network Dashboard",
    description: "Monitor Xandeum pNodes in real-time. Track performance, uptime, storage, and credits with AI-powered analytics.",
    type: "website",
    locale: "en_US",
    url: "https://www.xandash.online",
    siteName: "XanDash",
    images: [
      {
        url: "https://www.xandash.online/icon.png",
        width: 512,
        height: 512,
        alt: "XanDash - Xandeum Network Dashboard",
        type: "image/png",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XanDash - Real-Time Xandeum Network Dashboard",
    description: "Monitor Xandeum pNodes in real-time with AI-powered analytics and performance tracking.",
    site: "@xandeum",
    creator: "@xandeum",
    images: ["https://www.xandash.online/icon.png"],
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-black">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://www.xandash.online" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="XanDash" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="author" content="Xandeum" />
        <meta name="copyright" content="© 2026 XanDash. All rights reserved." />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.coingecko.com" />
        <link rel="dns-prefetch" href="https://stats.xandeum.network" />
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#000!important}` }} />
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased gradient-bg min-h-screen bg-black`}
      >
        <QueryProvider>
          <RPCProvider>
            <NetworkProvider>
              <NodesDataProvider>
                <AppCaptchaGate>
                  {children}
                  <AIAssistant />
                </AppCaptchaGate>
              </NodesDataProvider>
            </NetworkProvider>
          </RPCProvider>
        </QueryProvider>
        <Toaster 
          theme="dark" 
          position="bottom-right"
          duration={2000}
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
            },
          }}
        />
      </body>
    </html>
  );
}
