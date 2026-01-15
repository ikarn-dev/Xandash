import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RPCProvider } from "@/libs";
import { QueryProvider } from "@/libs/providers";
import { Toaster } from "sonner";
import { NetworkProvider } from "@/libs/context/network-context";
import { NodesDataProvider } from "@/libs/context/nodes-data-context";
import { StructuredData } from "@/libs/seo";
import { AppCaptchaGate } from "@/components/ui/AppCaptchaGate";
import { AIAssistantLoader } from "@/components/ui/AIAssistantLoader";

// Optimize font loading - swap ensures text is visible immediately
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    default: "XanDash - Xandeum Dashboard | pNode Monitor & Network Analytics",
    template: "%s | XanDash"
  },
  description: "XanDash is the official Xandeum dashboard for monitoring pNodes. Track node performance, uptime, storage, credits, and network statistics in real-time with AI-powered analytics.",
  keywords: ["xandeum dashboard", "pnode dashboard", "xandeum pnode dashboard", "xandash", "XanDash", "Xandeum", "pNodes", "pNode monitor", "pNode tracker", "Xandeum network", "Xandeum monitor", "blockchain dashboard", "node tracker", "XAND token", "STOINC"],
  applicationName: "XanDash",
  authors: [{ name: "XanDash", url: "https://www.xandash.online" }],
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  creator: "XanDash",
  publisher: "XanDash",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  metadataBase: new URL('https://www.xandash.online'),
  alternates: {
    canonical: 'https://www.xandash.online',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "XanDash",
  },
  openGraph: {
    title: "XanDash - Xandeum Dashboard | pNode Monitor",
    description: "XanDash is the official Xandeum dashboard. Monitor pNodes in real-time, track performance, uptime, storage, and credits with AI-powered analytics.",
    type: "website",
    locale: "en_US",
    url: "https://www.xandash.online",
    siteName: "XanDash",
    images: [
      {
        url: "https://www.xandash.online/icon.png",
        width: 512,
        height: 512,
        alt: "XanDash - Xandeum Dashboard",
        type: "image/png",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XanDash - Xandeum Dashboard | pNode Monitor",
    description: "Monitor Xandeum pNodes in real-time with AI-powered analytics and performance tracking.",
    site: "@xandeum",
    creator: "@xandeum",
    images: ["https://www.xandash.online/icon.png"],
  },
  category: "technology",
  other: {
    "google-site-verification": "your-verification-code-here",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
        {/* Favicon - Critical for Google Search display */}
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon.png" sizes="180x180" />
        
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://www.xandash.online" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="XanDash" />
        <meta name="author" content="XanDash" />
        <meta name="copyright" content="© 2026 XanDash. All rights reserved." />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="1 days" />
        <meta name="distribution" content="global" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Preconnect to critical origins - reduces connection latency */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="preconnect" href="https://www.xandash.online" />
        
        {/* DNS prefetch for API endpoints - reduces DNS lookup time */}
        <link rel="dns-prefetch" href="https://api.coingecko.com" />
        <link rel="dns-prefetch" href="https://stats.xandeum.network" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />
        <link rel="dns-prefetch" href="https://podcredits.xandeum.network" />
        <link rel="dns-prefetch" href="https://ipwho.is" />
        
        {/* Leaflet Map - preconnect to tile server and load CSS */}
        <link rel="preconnect" href="https://a.basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://b.basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://c.basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://d.basemaps.cartocdn.com" />
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
          crossOrigin=""
        />
        
        {/* Preload critical assets for faster LCP */}
        <link rel="preload" href="/logo/xandash.png" as="image" type="image/png" fetchPriority="high" />
        
        {/* Critical CSS inline - prevents render blocking (620ms savings) */}
        <style dangerouslySetInnerHTML={{ __html: `
          html,body{background:#000!important;margin:0;padding:0;min-height:100vh}
          .gradient-bg{background:radial-gradient(ellipse at center top,#2a2a2a 0%,#222 15%,#1a1a1a 35%,#111 60%,#0a0a0a 80%,#000 100%);background-attachment:fixed;min-height:100vh}
          .dark{color-scheme:dark}
          html,body,div,main,section{-ms-overflow-style:none;scrollbar-width:none}
          html::-webkit-scrollbar,body::-webkit-scrollbar,div::-webkit-scrollbar,main::-webkit-scrollbar,section::-webkit-scrollbar{display:none}
          .leaflet-container,.leaflet-container *{-ms-overflow-style:auto;scrollbar-width:auto}
        `.replace(/\s+/g, '') }} />
        
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
                  <AIAssistantLoader />
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
