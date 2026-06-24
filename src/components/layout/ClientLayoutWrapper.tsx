'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import TickerBar from '@/components/layout/Ticker/TickerBar';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import SocialSidebar from '@/components/layout/SocialSidebar/SocialSidebar';
import ChatAssistant from '@/components/layout/ChatAssistant/ChatAssistant';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isSoonRoute = pathname?.startsWith('/soon');

  // ── Media Asset Protection ─────────────────────────────────────────────
  // Blocks right-click save, drag-to-desktop, and keyboard save shortcuts
  // on all public pages (admin is excluded)
  useEffect(() => {
    if (isAdminRoute) return;

    // Block right-click context menu on images and videos
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (tagName === 'img' || tagName === 'video' || tagName === 'canvas') {
        e.preventDefault();
        return false;
      }
    };

    // Block drag on images and videos
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (tagName === 'img' || tagName === 'video') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [isAdminRoute]);

  if (isSoonRoute) {
    return <main>{children}</main>;
  }

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
