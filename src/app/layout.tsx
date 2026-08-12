import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "AI Passport Consent Audit — What You Permit vs. What You Expose",
  description:
    "An enhanced consent audit that shows not just what permissions exist, but what your combined permissions actually reveal about you across AI systems.",
  keywords: ["AI", "consent", "privacy", "passport", "audit", "permissions", "data"],
  authors: [{ name: "Egoist Machines" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "AI Passport Consent Audit — What You Permit vs. What You Expose",
    description:
      "An exploration of cumulative consent understanding in AI Passport systems.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Passport Consent Audit",
    description: "What You Permit vs. What You Expose — A design exploration by Egoist Machines.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
