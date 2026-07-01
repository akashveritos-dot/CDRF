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
  FileText,
  Download,
  Sliders,
  MapPin
} from 'lucide-react';
import styles from './layout.module.css';
import './admin-theme.css';
import { useToast } from '@/components/ui/Toast/ToastContext';
import EmailTemplatesModal from '@/components/admin/EmailTemplatesModal';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
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

  // Poll for counts every 2 minutes (120,000ms) to keep sidebar badges real-time without slamming the server
  useEffect(() => {
    if (isLoginPage || !adminUser) return;
    const interval = setInterval(fetchCounts, 120000);
    return () => clearInterval(interval);
  }, [isLoginPage, adminUser]);

  // Close sidebar automatically on navigation
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Manage body class for sidebar open state (to hide chatbot icon)
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('admin-sidebar-open');
    } else {
      document.body.classList.remove('admin-sidebar-open');
    }
    return () => {
      document.body.classList.remove('admin-sidebar-open');
    };
  }, [isSidebarOpen]);

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
    { name: 'Manage Hero Section', path: '/admin/hero', icon: <Sliders size={18} /> },
    { name: 'Manage Hazard Maps', path: '/admin/maps', icon: <MapPin size={18} /> },
    { name: 'Manage CMS Pages', path: '/admin/pages', icon: <BookOpen size={18} /> },
    { name: 'Dynamic Forms', path: '/admin/forms', icon: <Sliders size={18} /> },
    { name: 'Manage Gallery', path: '/admin/gallery', icon: <Image size={18} /> },
    { name: 'Query Messages', path: '/admin/contacts', icon: <MessageSquare size={18} />, countKey: 'queries' },
    { name: 'Manage News', path: '/admin/news', icon: <Newspaper size={18} /> },
    { name: 'Manage Reports', path: '/admin/reports', icon: <FileArchive size={18} /> },
    { name: 'Report Downloads', path: '/admin/report-downloads', icon: <Download size={18} /> },
    { name: 'Manage Councils', path: '/admin/councils', icon: <Award size={18} /> },
    { name: 'Conclave Registrations', path: '/admin/events', icon: <Calendar size={18} />, countKey: 'registrations' },
    { name: 'Live Alert Ticker', path: '/admin/alerts', icon: <Megaphone size={18} /> },
    { name: 'Memberships', path: '/admin/memberships', icon: <Users size={18} />, countKey: 'memberships' },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: <Mail size={18} />, countKey: 'subscriptions' },
    { name: 'Scraper Queue', path: '/admin/scrape', icon: <Radio size={18} />, countKey: 'scraper' },
  ];

  // Add Users, Launch Registrations, Audit Logs, and Pricing menu items only for SUPERADMIN
  if (adminUser?.role === 'SUPERADMIN') {
    menuItems.push({ name: 'Launch Registrations', path: '/admin/soon', icon: <Globe size={18} /> });
    menuItems.push({ name: 'Users', path: '/admin/users', icon: <UserCog size={18} /> });
    menuItems.push({ name: 'Membership Pricing', path: '/admin/pricing', icon: <Award size={18} /> });
    menuItems.push({ name: 'Audit Logs', path: '/admin/logs', icon: <FileText size={18} /> });
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
          <button 
            className={styles.sidebarCloseBtn} 
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
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

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div className={styles.backdrop} onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <main className={styles.content}>
        <div className={styles.contentInner}>
          {/* Top Bar Control Desk */}
          <div className="admin-top-bar" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            background: 'rgba(10, 15, 29, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '12px 20px',
            backdropFilter: 'blur(8px)',
            boxSizing: 'border-box',
            width: '100%',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DCRF Control Desk</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Active System Operations</span>
            </div>
            
            <button
              onClick={() => setIsTemplatesModalOpen(true)}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <FileText size={14} />
              <span>Manage Templates</span>
            </button>
          </div>

          {children}
        </div>
      </main>

      <EmailTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        toast={toast}
      />
    </div>
  );
}
