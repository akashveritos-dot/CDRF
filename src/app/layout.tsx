import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast/ToastContext';
import { TelemetryProvider } from '@/context/TelemetryContext';
import ClientLayoutWrapper from '@/components/layout/ClientLayoutWrapper';
import '../bones/registry';


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
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
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
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9798737451337349"
          crossOrigin="anonymous"
        />
      </head>
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
