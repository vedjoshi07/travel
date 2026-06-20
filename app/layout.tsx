import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { BottomNav } from '@/components/bottom-nav/BottomNav';
import { DemoControlPanel } from '@/components/demo-panel/DemoControlPanel';
import { ThemeInit } from './theme-init';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'NEXUS — Real-Time City Intelligence',
  description: 'What\'s the smartest thing to do right now, near you? NEXUS gives you live crowd levels, AI-powered itineraries, and real-time city intelligence.',
  keywords: ['city intelligence', 'crowd levels', 'AI travel planner', 'local guide'],
  openGraph: {
    title: 'NEXUS — Real-Time City Intelligence',
    description: 'AI-powered city intelligence for smarter decisions.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A0E1A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${inter.variable} bg-nexus`}>
        <ThemeInit />
        <Providers>
          <DemoControlPanel />
          <main id="main-content" style={{ minHeight: '100dvh' }}>
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
