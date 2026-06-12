import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast/ToastContext';
import ClientLayoutWrapper from '@/components/layout/ClientLayoutWrapper';

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export const metadata: Metadata = {
  title: 'DCRF — Disaster & Climate Resilience Federation',
  description: 'India\'s premier multi-stakeholder federation unifying corporates, NGOs, academia and government to advance disaster preparedness and climate resilience — from early warning to recovery.',
  keywords: 'Disaster Management, Climate Resilience, India Climate Index, India Disaster Dashboard, CSR Climate Adaptation, DCRC Conclave',
  authors: [{ name: 'DCRF Secretariat' }],
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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ToastProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
