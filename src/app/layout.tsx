import type { Metadata, Viewport } from "next";
import { Inter, Host_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import { ThemeProvider } from "@/components/providers/theme-context";
import { UserProvider } from "@/components/providers/user";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/custom-ui/navbar";
import { wagmiConfig } from "@/lib/client/config";
import { WagmiProvider } from "wagmi";
import { AppReactQueryProvider } from "@/components/providers/query-client";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Cronos402: First MCP Payment Gateway for Cronos",
  description: "The first MCP payment gateway built exclusively for Cronos blockchain. Pay for AI services with USDC.e (gasless) or native CRO. Powering the future of agentic payments on Cronos.",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "Cronos402: First MCP Payment Gateway for Cronos",
    description: "The first MCP payment gateway built exclusively for Cronos blockchain. Pay for AI services with USDC.e (gasless) or native CRO.",
    type: "website",
    url: "https://cronos402.dev",
    siteName: "Cronos402",
    images: [
      {
        url: '/cronos402-og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cronos402: First MCP Payment Gateway for Cronos',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Cronos402: First MCP Payment Gateway for Cronos",
    description: "The first MCP payment gateway built exclusively for Cronos blockchain. Pay for AI services with USDC.e (gasless) or native CRO.",
    images: ['/cronos402-og-image.png'],
    creator: '@cronos402',
    site: '@cronos402',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem("cronos402-theme");
                  let isDark = false;
                  
                  if (savedTheme === "dark" || savedTheme === "light") {
                    isDark = savedTheme === "dark";
                  } else {
                    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  }
                  
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html:not(.dark) body {
                background-color: white;
              }
              html.dark body {
                background-color: black;
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${hostGrotesk.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <WagmiProvider config={wagmiConfig}>
            <AppReactQueryProvider>
              <RainbowKitProvider>
                <UserProvider>
                  <Navbar />
                  {children}
                  <Toaster />
                </UserProvider>
              </RainbowKitProvider>
            </AppReactQueryProvider>
          </WagmiProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
