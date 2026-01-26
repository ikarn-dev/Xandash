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
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Optimize font loading - swap ensures text is visible immediately
// Only preload the main font, defer mono font completely
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Defer mono font - not critical for LCP
  adjustFontFallback: true,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
});

export const metadata: Metadata = {
  title: {
    default: "XanDash - Xandeum pNode Dashboard & Analytics",
    template: "%s | XanDash"
  },
  description: "XanDash: Monitor Xandeum pNodes in real-time. Track performance, uptime, storage, credits & network stats with AI-powered analytics.",
  keywords: ["xandeum dashboard", "xandash dashboard", "xandeum pnodes dashboard", "pnode dashboard", "xandeum pnode dashboard", "xandash", "xandash pnode", "xandeum pnodes", "XanDash", "Xandeum", "Xandeum network", "Xandeum network dashboard", "pNodes", "pNode monitor", "pNode tracker", "Xandeum monitor", "Xandeum analytics", "blockchain dashboard", "node tracker", "XAND token", "STOINC", "xandeum node status", "pnode stats", "xandeum mainnet", "xandeum devnet"],
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
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon.png",
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
    description: "XanDash is a comprehensive Xandeum dashboard. Monitor pNodes in real-time, track performance, uptime, storage, and credits with AI-powered analytics.",
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
  viewportFit: "cover", // Better mobile viewport handling
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-black">
      <head>
        {/* Favicon - Using PNG since favicon.ico is actually a PNG */}
        <link rel="icon" href="/icon.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon.png" sizes="180x180" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://www.xandash.online" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
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
        {/* Only preconnect to truly critical origins that are needed for initial render */}
        <link rel="preconnect" href="https://www.xandash.online" />
        {/* Preconnect for fonts with crossorigin for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for less critical but still important origins */}
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
        <link rel="dns-prefetch" href="https://unpkg.com" />
        <link rel="dns-prefetch" href="https://api.coingecko.com" />
        <link rel="dns-prefetch" href="https://stats.xandeum.network" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />
        <link rel="dns-prefetch" href="https://podcredits.xandeum.network" />
        <link rel="dns-prefetch" href="https://ipwho.is" />
        <link rel="dns-prefetch" href="https://a.basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://b.basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://c.basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://d.basemaps.cartocdn.com" />

        {/* Leaflet Map - defer loading completely, not critical for initial render */}
        {/* Loaded via dynamic import in InteractiveMap component */}

        {/* Critical CSS inline - prevents render blocking and speeds LCP */}
        <style dangerouslySetInnerHTML={{
          __html: `
          *{box-sizing:border-box}
          html,body{background:#000!important;margin:0;padding:0;min-height:100vh;font-family:system-ui,-apple-system,sans-serif;color:#fff}
          .gradient-bg{background:radial-gradient(ellipse at center top,#2a2a2a 0%,#222 15%,#1a1a1a 35%,#111 60%,#0a0a0a 80%,#000 100%);background-attachment:fixed;min-height:100vh}
          .dark{color-scheme:dark}
          html,body,div,main,section{-ms-overflow-style:none;scrollbar-width:none}
          html::-webkit-scrollbar,body::-webkit-scrollbar,div::-webkit-scrollbar,main::-webkit-scrollbar,section::-webkit-scrollbar{display:none}
          .leaflet-container,.leaflet-container *{-ms-overflow-style:auto;scrollbar-width:auto}
          @media(max-width:640px){body{font-size:14px}.container{padding-left:12px;padding-right:12px}}
          /* Critical above-the-fold styles for LCP optimization */
          .bg-black{background-color:#000}
          .text-white{color:#fff}
          .border-white\\/10{border-color:rgba(255,255,255,0.1)}
          .bg-white\\/5{background-color:rgba(255,255,255,0.05)}
          .rounded-xl{border-radius:0.75rem}
          .p-3{padding:0.75rem}
          .p-4{padding:1rem}
          .space-y-6>*+*{margin-top:1.5rem}
          .flex{display:flex}
          .grid{display:grid}
          .h-12{height:3rem}
          .w-full{width:100%}
          /* Prevent layout shift for loading states */
          .min-h-\\[300px\\]{min-height:300px}
          .min-h-\\[400px\\]{min-height:400px}
          .min-h-\\[500px\\]{min-height:500px}
          @media(min-width:640px){.sm\\:min-h-\\[400px\\]{min-height:400px}}
          @media(min-width:768px){.md\\:min-h-\\[500px\\]{min-height:500px}}
          /* Skeleton loading styles for faster perceived performance - remove pulse animation for LCP */
          .skeleton-static{background-color:rgba(255,255,255,0.1);border-radius:0.25rem}
          /* Prevent layout shift during route transitions - main content minimum height */
          .min-h-\\[calc\\(100vh-180px\\)\\]{min-height:calc(100vh - 180px)}
          /* Prevent FOUC */
          .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}
        `.replace(/\s+/g, ' ').trim()
        }} />

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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
