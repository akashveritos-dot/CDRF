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
  X,
  UserCog,
  Mail,
  Award,
  Calendar,
  Megaphone,
  BookOpen,
  Image,
  MessageSquare,
  FileText
} from 'lucide-react';
import styles from './layout.module.css';
import './admin-theme.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCounts, setSidebarCounts] = useState<any>({
    queries: 0,
    memberships: 0,
    registrations: 0,
    subscriptions: 0,
    scraper: 0
  });

  // If the path is /admin/login, don't show the dashboard layout framework
  const isLoginPage = pathname === '/admin/login';

  const fetchCounts = async () => {
    try {
      const res = await fetch('/api/admin/sidebar-counts');
      if (res.ok) {
        const data = await res.json();
        setSidebarCounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch sidebar counts:', err);
    }
  };

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
          // Fetch counts once authenticated
          fetchCounts();
        }
      } catch (err) {
        router.push('/admin/login');
      }
    }
    checkSession();
  }, [pathname, isLoginPage, router]);

  // Poll for counts every 15s to keep sidebar badges real-time
  useEffect(() => {
    if (isLoginPage || !adminUser) return;
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [isLoginPage, adminUser]);

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
    { name: 'Manage CMS Pages', path: '/admin/pages', icon: <BookOpen size={18} /> },
    { name: 'Manage Gallery', path: '/admin/gallery', icon: <Image size={18} /> },
    { name: 'Query Messages', path: '/admin/contacts', icon: <MessageSquare size={18} />, countKey: 'queries' },
    { name: 'Manage News', path: '/admin/news', icon: <Newspaper size={18} /> },
    { name: 'Manage Reports', path: '/admin/reports', icon: <FileArchive size={18} /> },
    { name: 'Manage Councils', path: '/admin/councils', icon: <Award size={18} /> },
    { name: 'Conclave Registrations', path: '/admin/events', icon: <Calendar size={18} />, countKey: 'registrations' },
    { name: 'Live Alert Ticker', path: '/admin/alerts', icon: <Megaphone size={18} /> },
    { name: 'Memberships', path: '/admin/memberships', icon: <Users size={18} />, countKey: 'memberships' },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: <Mail size={18} />, countKey: 'subscriptions' },
    { name: 'Scraper Queue', path: '/admin/scrape', icon: <Radio size={18} />, countKey: 'scraper' },
    { name: 'Audit Logs', path: '/admin/logs', icon: <FileText size={18} /> }
  ];

  // Add Users and Launch Registrations menu items only for SUPERADMIN
  if (adminUser?.role === 'SUPERADMIN') {
    // Keep 'Launch Registrations' and 'Users' next to Audit Logs
    menuItems.splice(12, 0, { name: 'Launch Registrations', path: '/admin/soon', icon: <Globe size={18} /> });
    menuItems.splice(13, 0, { name: 'Users', path: '/admin/users', icon: <UserCog size={18} /> });
  }

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
          <div className={styles.avatar}>
            {adminUser?.name ? adminUser.name[0] : 'A'}
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{adminUser?.name || 'DCRF Administrator'}</div>
            <div className={styles.profileRole}>{adminUser?.role || 'SUPERADMIN'}</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {menuItems.map(item => {
            const isActive = pathname === item.path;
            const count = item.countKey ? sidebarCounts[item.countKey] : 0;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <div className={styles.navLinkContent}>
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {count > 0 && (
                  <span className={styles.badge}>{count}</span>
                )}
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
