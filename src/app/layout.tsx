import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast/ToastContext';
import { TelemetryProvider } from '@/context/TelemetryContext';
import ClientLayoutWrapper from '@/components/layout/ClientLayoutWrapper';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export const metadata: Metadata = {
  title: 'DCRF — Disaster & Climate Resilience Federation',
  description: 'India\'s premier multi-stakeholder federation unifying corporates, NGOs, academia and government to advance disaster preparedness and climate resilience — from early warning to recovery.',
  keywords: 'Disaster Management, Climate Resilience, India Climate Index, India Disaster Dashboard, CSR Climate Adaptation, DCRC Conclave',
  authors: [{ name: 'DCRF Secretariat' }],
  icons: {
    icon: '/dcrf_icon-Photoroom.png',
    shortcut: '/dcrf_icon-Photoroom.png',
    apple: '/dcrf_icon-Photoroom.png',
  },
  openGraph: {
    title: 'Disaster & Climate Resilience Federation (DCRF)',
    description: 'Building resilience through knowledge, convergence and action.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'DCRF India'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ToastProvider>
          <TelemetryProvider>
            <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          </TelemetryProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
