import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RPCProvider } from "@/libs";
import { QueryProvider } from "@/libs/providers";
import { Toaster } from "sonner";
import { NetworkProvider } from "@/libs/context/network-context";
import { NodesDataProvider } from "@/libs/context/nodes-data-context";
import { StructuredData } from "@/libs/seo";
import { AIAssistant } from "@/components/ui/AIAssistant";
import { AppCaptchaGate } from "@/components/ui/AppCaptchaGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "XanDash - Real-Time Xandeum Network Dashboard & Node Monitor",
    template: "%s | XanDash"
  },
  description: "XanDash is the official real-time monitoring dashboard for Xandeum network. Track pNode performance, uptime, storage, credits, and network statistics with AI-powered analytics.",
  keywords: ["XanDash", "XanDash Dashboard", "Xandeum", "Xandeum dashboard", "Xandeum network", "Xandeum monitor", "Xandeum analytics", "Xandeum explorer", "pNodes", "pNode monitor", "pNode tracker", "pNode dashboard", "Xandeum pNodes", "Xandeum validators", "network monitoring", "blockchain dashboard", "validators", "node tracker", "storage network", "devnet", "mainnet", "crypto dashboard", "XAND token", "STOINC"],
  applicationName: "XanDash",
  authors: [{ name: "XanDash Team", url: "https://www.xandash.online" }],
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
    description: "XanDash is the official monitoring dashboard for Xandeum network. Track pNode performance, uptime, storage, and credits with AI-powered analytics.",
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
  category: "technology",
  // Add your actual Google verification code from Search Console
  // verification: {
  //   google: "your-actual-verification-code",
  // },
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://www.xandash.online" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="XanDash" />
        <meta name="author" content="Xandeum" />
        <meta name="copyright" content="© 2026 XanDash. All rights reserved." />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta name="format-detection" content="telephone=no" />
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for API endpoints */}
        <link rel="dns-prefetch" href="https://api.coingecko.com" />
        <link rel="dns-prefetch" href="https://stats.xandeum.network" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />
        {/* Critical CSS inline */}
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#000!important;margin:0;padding:0}` }} />
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
