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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XanDash - Xandeum Network Dashboard",
  description: "Real-time monitoring dashboard for Xandeum network validators and nodes with offline support",
  manifest: "/manifest.json",
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
    title: "XanDash - Xandeum Network Dashboard",
    description: "Real-time monitoring dashboard for Xandeum network validators and nodes",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "XanDash - Xandeum Network Dashboard",
    description: "Real-time monitoring dashboard for Xandeum network validators and nodes",
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
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="XanDash" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#000!important}` }} />
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
