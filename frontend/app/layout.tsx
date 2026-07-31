/**
 * Root Layout Component.
 *
 * Defines the global HTML structure, fonts, CSS variables, and top-level
 * UI components (Navbar, Footer, InitialLoader).
 * All pages are rendered within the `main` tag of this layout.
 */

import type { Metadata, Viewport } from "next";

import { Footer } from "@/components/layout/footer";
import { InitialLoader } from "@/components/layout/initial-loader";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";

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
      <body className="font-sans antialiased">
        <InitialLoader />
        {/* Subtle animated noise texture overlay */}
        <div className="noise" aria-hidden="true" />
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
