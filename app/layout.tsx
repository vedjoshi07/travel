import type { Metadata, Viewport } from 'next';
import { Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { BottomNav } from '@/components/bottom-nav/BottomNav';
import { DesktopRail } from '@/components/desktop-rail/DesktopRail';
import { DemoControlPanel } from '@/components/demo-panel/DemoControlPanel';
import { OnboardingGate } from '@/components/onboarding/OnboardingGate';
import { RailGate } from '@/components/rail-gate/RailGate';
import { themeInitScript } from '@/lib/theme-init-script';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600'],
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
  maximumScale: 5,            // allow zoom — a11y floor
  themeColor: '#0B0E14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${inter.variable} ${interTight.variable} ${jetbrains.variable}`}>
      <head>
        {/* Runs before first paint so dark/light is applied without a flash.
            Without this the page renders dark for ~1 frame then flips if the
            user has saved a light preference. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className="bg-nexus">
        <Providers>
          <RailGate>
            <DemoControlPanel />
            <main id="main-content">
              <OnboardingGate>{children}</OnboardingGate>
            </main>
            <BottomNav />
            <DesktopRail />
          </RailGate>
        </Providers>
      </body>
    </html>
  );
}