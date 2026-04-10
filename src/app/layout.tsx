import { Geist, Geist_Mono } from "next/font/google";

import { ScrollTriggerLayoutSync } from "@/components/layout/ScrollTriggerLayoutSync";
import { TextZoomNormalize } from "@/components/ui/TextZoomNormalize";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <TextZoomNormalize />
        <ScrollTriggerLayoutSync />
        {children}
      </body>
    </html>
  );
}
