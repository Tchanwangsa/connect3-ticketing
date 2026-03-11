import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { NotFoundProvider } from "@/components/providers/NotFoundProvider";
import { NavbarWrapper } from "@/components/layout/NavbarWrapper";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Connect3 | Ticketing",
    template: "%s | Connect3",
  },
  description:
    "The all-in-one ticketing solution for clubs. Create, manage and sell event tickets — simple, flexible, and powerful.",
  keywords: [
    "ticketing",
    "events",
    "club events",
    "university events",
    "event management",
    "tickets",
  ],
  openGraph: {
    type: "website",
    siteName: "Connect3 Ticketing",
    title: "Connect3 | Ticketing",
    description:
      "The all-in-one ticketing solution for clubs. Create, manage and sell event tickets.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Connect3 | Ticketing",
    description:
      "The all-in-one ticketing solution for clubs. Create, manage and sell event tickets.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <NotFoundProvider>
            <NavbarWrapper />
            {children}
          </NotFoundProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
