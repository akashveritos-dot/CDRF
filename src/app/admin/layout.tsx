'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  LayoutDashboard,
  Newspaper,
  FileArchive,
  Users,
  Radio,
  LogOut,
  Globe,
  Menu,
  X
} from 'lucide-react';
import styles from './layout.module.css';
import './admin-theme.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If the path is /admin/login, don't show the dashboard layout framework
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;

    // Check session
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.authenticated) {
          router.push('/admin/login');
        } else {
          setAdminUser(data.user);
        }
      } catch (err) {
        router.push('/admin/login');
      }
    }
    checkSession();
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isLoginPage) {
    return <div className={`${styles.loginContainer} admin-panel`}>{children}</div>;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Manage News', path: '/admin/news', icon: <Newspaper size={18} /> },
    { name: 'Manage Reports', path: '/admin/reports', icon: <FileArchive size={18} /> },
    { name: 'Memberships', path: '/admin/memberships', icon: <Users size={18} /> },
    { name: 'Scraper Queue', path: '/admin/scrape', icon: <Radio size={18} /> }
  ];

  return (
    <div className={`${styles.layout} admin-panel`}>
      {/* Top Mobile Bar */}
      <header className={styles.mobileHeader}>
        <button className={styles.menuBtn} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className={styles.mobileBrand}>
          <ShieldAlert size={20} className={styles.alertIcon} />
          <span>DCRF Control Panel</span>
        </div>
      </header>

      {/* Sidebar Frame */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <ShieldAlert size={24} className={styles.alertIcon} />
          <div>
            <div className={styles.brandTitle}>DCRF CONTROL</div>
            <div className={styles.brandSub}>Emergency Response HQ</div>
          </div>
        </div>

        <div className={styles.profile}>
          <div className={styles.avatar}>A</div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{adminUser?.name || 'Administrator'}</div>
            <div className={styles.profileRole}>Super Admin</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {menuItems.map(item => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.navLinkOuter}>
            <Globe size={18} />
            <span>Public Website</span>
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} />
            <span>HQ Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.content}>
        {/* Backdrop for mobile */}
        {isSidebarOpen && (
          <div className={styles.backdrop} onClick={() => setIsSidebarOpen(false)} />
        )}
        <div className={styles.contentInner}>
          {children}
        </div>
      </main>
    </div>
  );
}
