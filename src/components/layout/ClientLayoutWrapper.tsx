'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import TickerBar from '@/components/layout/Ticker/TickerBar';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import SocialSidebar from '@/components/layout/SocialSidebar/SocialSidebar';
import ChatAssistant from '@/components/layout/ChatAssistant/ChatAssistant';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <>
        <main>{children}</main>
        <ChatAssistant />
      </>
    );
  }

  return (
    <>
      <TickerBar />
      <Navbar />
      <SocialSidebar />
      <main>{children}</main>
      <ChatAssistant />
      <Footer />
    </>
  );
}
