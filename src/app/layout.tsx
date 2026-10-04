import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'
import { PwaProvider } from '@/components/pwa/PwaProvider'
import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner'

export const metadata: Metadata = {
  title: 'Nexora — Living Productivity OS',
  description: 'A living digital productivity habitat with an AI companion, deep focus chamber, habit momentum, and quest matrix.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nexora',
  },
  applicationName: 'Nexora',
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#0C0A09',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground antialiased selection:bg-amber-400 selection:text-stone-950">
        <PwaProvider>
          {children}
          <PwaInstallBanner />
        </PwaProvider>
      </body>
    </html>
  )
}
