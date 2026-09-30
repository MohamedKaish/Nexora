import type { Metadata } from "next";
import "../styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from 'sonner'
import { AuthProvider } from '@/providers/AuthProvider'
import { getUser } from '@/lib/supabase/server'
import { HydrationProvider } from '@/providers/HydrationProvider'
import { CompanionOverlay } from '@/components/companion/CompanionOverlay'



export const metadata: Metadata = {
  title: "Nexora - Personal Productivity OS",
  description: "A Personal Productivity Operating System designed to help you execute meaningful work.",
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport = {
  themeColor: '#6366F1'
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';
  const { data: { user } } = await getUser();

  return (
    <html
      lang="en"
      className={`font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider initialUser={user}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <HydrationProvider>
              {children}
              <CompanionOverlay />
            </HydrationProvider>
            <Toaster richColors position="top-right" theme="system" />
          </ThemeProvider>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: isDev
              ? `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var i = 0; i < registrations.length; i++) {
                      registrations[i].unregister();
                    }
                  });
                  if (window.caches) {
                    caches.keys().then(function(names) {
                      for (var i = 0; i < names.length; i++) {
                        caches.delete(names[i]);
                      }
                    });
                  }
                }
              `
              : `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(err) {
                      console.error('Service Worker registration failed: ', err);
                    });
                  });
                }
              `,
          }}
        />
      </body>
    </html>
  );
}
