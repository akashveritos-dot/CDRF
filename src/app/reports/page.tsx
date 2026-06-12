'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { reports as fallbackReports } from '@/data/dataStore';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { Search, Download, BookOpen, Thermometer, Waves, Compass, Mountain, Cpu } from 'lucide-react';
import { useToast } from '@/components/ui/Toast/ToastContext';

const tabs = ['All', 'Annual', 'Policy', 'CSR', 'Technical'];

const getReportIcon = (iconEmoji: string) => {
  switch (iconEmoji) {
    case '📙':
      return <BookOpen size={20} style={{ color: 'var(--red-primary)' }} />;
    case '🌡️':
      return <Thermometer size={20} style={{ color: 'var(--orange-primary)' }} />;
    case '🌊':
      return <Waves size={20} style={{ color: 'var(--blue-primary)' }} />;
    case '🌀':
      return <Compass size={20} style={{ color: 'var(--purple-primary)' }} />;
    case '🏔️':
      return <Mountain size={20} style={{ color: 'var(--navy-light)' }} />;
    case '📡':
      return <Cpu size={20} style={{ color: 'var(--teal-primary)' }} />;
    default:
      return <BookOpen size={20} style={{ color: 'var(--red-primary)' }} />;
  }
};

const getReportIconBgClass = (iconEmoji: string) => {
  switch (iconEmoji) {
    case '📙': return styles.bgRed;
    case '🌡️': return styles.bgOrange;
    case '🌊': return styles.bgBlue;
    case '🌀': return styles.bgPurple;
    case '🏔️': return styles.bgNavy;
    case '📡': return styles.bgTeal;
    default: return styles.bgRed;
  }
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { download } = useToast();

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setReportsList(data);
          }
        }
      } catch (err) {
        console.warn('Failed to load dynamic reports.', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  // Handle Filtering
  const filteredReports = reportsList.filter((report) => {
    const matchesTab = activeTab === 'All' || report.category.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <span className="pulse-dot sonar-emitter" style={{ width: '12px', height: '12px' }}>
            <span className="sonar-pulse" />
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>Retrieving live policy briefs & reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <h1 className={styles.title}>Research & Publications</h1>
          <p className={styles.subtitle}>
            Explore DCRF’s comprehensive repository of disaster risk assessments, heat action briefs, climate finance reports, and geospatial audits.
          </p>
        </div>
      </ScrollReveal>

      {/* Library Controls */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className={styles.controlsPanel}>
          {/* Search bar */}
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search reports or topics..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Tabs */}
          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Reports Grid */}
      <div className={styles.grid}>
        {filteredReports.length > 0 ? (
          filteredReports.map((report, idx) => (
            <ScrollReveal
              key={report.id}
              direction="up"
              delay={0.05 * (idx % 3)}
            >
              <div className={styles.card}>
                {report.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={report.image_url} 
                    alt={report.title} 
                    className={styles.cardImg}
                  />
                )}
                <div className={styles.cardHeaderRow}>
                  {!report.image_url && (
                    <div className={`${styles.iconWrapper} ${getReportIconBgClass(report.icon)}`}>
                      {getReportIcon(report.icon)}
                    </div>
                  )}
                  <span className={styles.categoryBadge}>{report.category}</span>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{report.title}</h3>
                  <p className={styles.description}>{report.description}</p>
                </div>
                <div className={styles.footer}>
                  <span className={styles.metaText}>
                    {report.year} • {report.page_count || report.pageCount} pages
                  </span>
                  <a
                    href={report.download_url || report.downloadUrl || '#'}
                    target={(report.download_url && report.download_url !== '#') ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={styles.downloadBtn}
                    onClick={(e) => {
                      const url = report.download_url || report.downloadUrl;
                      if (!url || url === '#') {
                        e.preventDefault();
                        download(
                          'Download started',
                          `"${report.title}" PDF is being prepared…`
                        );
                      }
                    }}
                  >
                    <Download size={14} />
                    View Source
                  </a>
                </div>
              </div>
            </ScrollReveal>
          ))
        ) : (
          <ScrollReveal direction="none" className={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
            <h3>No reports found matching your search.</h3>
            <p style={{ marginTop: '8px' }}>Try adjusting your keywords or category filters.</p>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
