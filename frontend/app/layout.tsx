import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { Footer } from "@/components/layout/footer";
import { InitialLoader } from "@/components/layout/initial-loader";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "TruthLens AI | Authenticity Verification",
    template: "%s | TruthLens AI"
  },
  description: "Detect deepfake videos and AI voices with confidence through a premium authenticity verification platform.",
  metadataBase: new URL("https://truthlens.ai"),
  icons: {
    icon: "/favicon.svg",
    apple: "/app-icon.svg"
  },
  openGraph: {
    title: "TruthLens AI",
    description: "AI-powered authenticity verification for video and voice analysis.",
    type: "website",
    images: ["/app-icon.svg"]
  }
};

export const viewport: Viewport = {
  themeColor: "#05070D",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <InitialLoader />
        <div className="noise" />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
