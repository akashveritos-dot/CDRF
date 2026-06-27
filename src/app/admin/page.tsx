'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Users, 
  Newspaper, 
  FileArchive, 
  Radio, 
  Play, 
  AlertTriangle,
  Loader2,
  CheckCircle,
  Clock,
  MessageSquare,
  Mail,
  Calendar
} from 'lucide-react';
import styles from './page.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    newsCount: 0,
    reportsCount: 0,
    queriesPending: 0,
    membershipsPending: 0,
    registrationsPending: 0,
    subscriptionsCount: 0,
    scrapedPending: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const fetchDashboardStats = async () => {
    try {
      const [newsRes, reportsRes, countsRes] = await Promise.all([
        fetch('/api/news'),
        fetch('/api/reports'),
        fetch('/api/admin/sidebar-counts')
      ]);

      const newsData = await newsRes.json();
      const reportsData = await reportsRes.json();
      const countsData = await countsRes.json();

      setStats({
        newsCount: Array.isArray(newsData) ? newsData.length : 0,
        reportsCount: Array.isArray(reportsData) ? reportsData.length : 0,
        queriesPending: countsData.queries || 0,
        membershipsPending: countsData.memberships || 0,
        registrationsPending: countsData.registrations || 0,
        subscriptionsCount: countsData.subscriptions || 0,
        scrapedPending: countsData.scraper || 0
      });
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleRunSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/telemetry/sync');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Telemetry synchronization failed');
      
      setSyncResult({
        success: true,
        temps: data.results.cityTemps,
        anomaly: data.results.warmingAnomaly,
        events: data.results.disasterEvents
      });
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'Telemetry synchronization failed'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunScraper = async () => {
    setIsScraping(true);
    setScrapeResult(null);
    try {
      const res = await fetch('/api/scrape', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scraper failed');
      
      setScrapeResult({
        success: true,
        itemsScraped: data.itemsScraped,
        errors: data.errors
      });
      
      // Refresh statistics
      fetchDashboardStats();
    } catch (err: any) {
      setScrapeResult({
        success: false,
        message: err.message || 'Scraper trigger failed'
      });
    } finally {
      setIsScraping(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 size={36} className={styles.spinner} />
        <span>Loading Command Telemetry...</span>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Title Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Crisis Center Dashboard</h1>
          <p className={styles.subtitle}>Welcome to DCRF Central Command. Operations telemetry is fully operational.</p>
        </div>
        <div className={styles.systemStatus}>
          <div className="pulse-dot" />
          <span>SYSTEM ACTIVE • LIVE TELEMETRY</span>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className={styles.grid}>
        {/* News Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Syndicated News</span>
            <Newspaper className={styles.cardIconBlue} size={22} />
          </div>
          <div className={styles.cardValue}>{stats.newsCount}</div>
          <div className={styles.cardFooter}>
            <Link href="/admin/news" className={styles.cardLink}>Manage editorial stories ↗</Link>
          </div>
        </div>

        {/* Reports Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Research Publications</span>
            <FileArchive className={styles.cardIconTeal} size={22} />
          </div>
          <div className={styles.cardValue}>{stats.reportsCount}</div>
          <div className={styles.cardFooter}>
            <Link href="/admin/reports" className={styles.cardLink}>Manage PDF briefs ↗</Link>
          </div>
        </div>

        {/* Memberships Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Pending Memberships</span>
            <Users className={styles.cardIconGold} size={22} />
          </div>
          <div className={styles.cardValue}>{stats.membershipsPending}</div>
          <div className={styles.cardFooterSplit}>
            <span className={stats.membershipsPending > 0 ? styles.subStat : styles.cardLink}>
              <Clock size={12} className={styles.clockIcon} /> Awaiting approval
            </span>
            <Link href="/admin/memberships" className={styles.cardLink}>Review list ↗</Link>
          </div>
        </div>

        {/* Conclave Registrations Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Pending Conclave</span>
            <Calendar className={styles.cardIconGold} style={{ color: '#f59e0b' }} size={22} />
          </div>
          <div className={styles.cardValue}>{stats.registrationsPending}</div>
          <div className={styles.cardFooterSplit}>
            <span className={stats.registrationsPending > 0 ? styles.subStat : styles.cardLink}>
              <Clock size={12} className={styles.clockIcon} /> Applications staging
            </span>
            <Link href="/admin/events" className={styles.cardLink}>Verify list ↗</Link>
          </div>
        </div>

        {/* Scrape Queue Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Scrape Review Queue</span>
            <Radio className={styles.cardIconRed} size={22} />
          </div>
          <div className={styles.cardValue}>{stats.scrapedPending}</div>
          <div className={styles.cardFooterSplit}>
            <span className={stats.scrapedPending > 0 ? styles.subStatRed : styles.cardLink}>Unprocessed articles</span>
            <Link href="/admin/scrape" className={styles.cardLinkRed}>Verify queue ↗</Link>
          </div>
        </div>

        {/* Query Messages Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Query Messages</span>
            <MessageSquare className={styles.cardIconRed} style={{ color: '#ef4444' }} size={22} />
          </div>
          <div className={styles.cardValue}>{stats.queriesPending}</div>
          <div className={styles.cardFooterSplit}>
            <span className={stats.queriesPending > 0 ? styles.subStatRed : styles.cardLink}>Inbox queries</span>
            <Link href="/admin/contacts" className={styles.cardLinkRed}>Query inbox ↗</Link>
          </div>
        </div>

        {/* Subscriptions Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Subscribers</span>
            <Mail className={styles.cardIconBlue} style={{ color: '#3b82f6' }} size={22} />
          </div>
          <div className={styles.cardValue}>{stats.subscriptionsCount}</div>
          <div className={styles.cardFooter}>
            <Link href="/admin/subscriptions" className={styles.cardLink}>Manage lists ↗</Link>
          </div>
        </div>
      </div>

      {/* Operations Controls */}
      <div className={styles.panelSection}>
        <div className={styles.panelTitleBlock}>
          <ShieldAlert size={20} className={styles.panelTitleIcon} />
          <h2>Command Operations Console</h2>
        </div>

        <div className={styles.controlsGrid}>
          {/* Web Scraping Controller */}
          <div className={styles.consolePanel}>
            <h3>Automated Data Scraping Engine</h3>
            <p>
              Initiate deep extraction sequences against PIB, disastersnews, and thecsruniverse. 
              The system will categorize items and stage them in the queue.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <Clock size={14} style={{ color: 'var(--red-primary)' }} />
              <span><strong>Scheduled daily runs (IST):</strong> 8:00 AM • 12:00 PM • 4:00 PM (Automated)</span>
            </div>
            
            <div className={styles.actionRow}>
              <button 
                onClick={handleRunScraper} 
                disabled={isScraping} 
                className={styles.scrapeBtn}
              >
                {isScraping ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    Scraping Feeds...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Execute Scraping Run
                  </>
                )}
              </button>
            </div>

            {scrapeResult && (
              <div className={`${styles.scrapeResult} ${scrapeResult.success ? styles.scrapeSuccess : styles.scrapeError}`}>
                {scrapeResult.success ? (
                  <div className={styles.resultItem}>
                    <CheckCircle size={16} className={styles.successIcon} />
                    <span>Scrape run completed! <strong>{scrapeResult.itemsScraped} new entries staged</strong>.</span>
                  </div>
                ) : (
                  <div className={styles.resultItem}>
                    <AlertTriangle size={16} className={styles.errorIcon} />
                    <span>Error: {scrapeResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Telemetry Sync Controller */}
          <div className={styles.consolePanel}>
            <h3>Live Telemetry Sync Engine</h3>
            <p>
              Synchronize metrics with official live public feeds. Queries Open-Meteo for city temperatures and global indexes for temperature anomalies.
            </p>
            
            <div className={styles.actionRow}>
              <button 
                onClick={handleRunSync} 
                disabled={isSyncing} 
                className={styles.scrapeBtn}
              >
                {isSyncing ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    Syncing Telemetry...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Sync Live Databases
                  </>
                )}
              </button>
            </div>

            {syncResult && (
              <div className={`${styles.scrapeResult} ${syncResult.success ? styles.scrapeSuccess : styles.scrapeError}`}>
                {syncResult.success ? (
                  <div className={styles.resultItem}>
                    <CheckCircle size={16} className={styles.successIcon} />
                    <span>Sync successful! Anomaly: <strong>+{syncResult.anomaly}°C</strong>. City temps and disaster indices updated.</span>
                  </div>
                ) : (
                  <div className={styles.resultItem}>
                    <AlertTriangle size={16} className={styles.errorIcon} />
                    <span>Error: {syncResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Shortcuts */}
          <div className={styles.consolePanel}>
            <h3>Secretariat Action Center</h3>
            <p>Perform quick actions and access specific HQ sub-modules directly:</p>
            <div className={styles.shortcutsGrid}>
              <Link href="/admin/news?action=new" className={styles.shortcutBtn}>
                <span>Publish New Editorial</span>
              </Link>
              <Link href="/admin/reports?action=new" className={styles.shortcutBtn}>
                <span>Publish Policy Brief</span>
              </Link>
              <Link href="/admin/memberships?status=Pending" className={styles.shortcutBtn}>
                <span>Review Pending Members</span>
              </Link>
              <Link href="/admin/scrape?status=Pending" className={styles.shortcutBtn}>
                <span>Staged Queue Editor</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
