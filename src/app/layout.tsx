import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Nexora — Personal Productivity OS',
  description: 'A living digital productivity world with an AI companion.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground antialiased selection:bg-amber-400 selection:text-stone-950">
        {children}
      </body>
    </html>
  )
}
