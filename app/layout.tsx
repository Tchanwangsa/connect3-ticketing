import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { NotFoundProvider } from "@/components/providers/NotFoundProvider";
import { NavbarWrapper } from "@/components/layout/NavbarWrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Connect3 | Ticketing",
  description:
    "The all-in-one ticketing solution for clubs. Simple, flexible, and powerful.",
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
      </body>
    </html>
  );
}
