'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { Search, Download, BookOpen, Thermometer, Waves, Compass, Mountain, X, Loader2, AlertTriangle } from 'lucide-react';

import PageHero from '@/components/ui/PageHero/PageHero';

const tabs = ['All', 'Annual', 'Policy', 'CSR', 'Technical'];

const getReportIcon = (iconEmoji: string) => {
  switch (iconEmoji) {
    case '📙':
    case '📡':
      return <BookOpen size={20} style={{ color: 'var(--red-primary)' }} />;
    case '🌡️':
      return <Thermometer size={20} style={{ color: 'var(--orange-primary)' }} />;
    case '🌊':
      return <Waves size={20} style={{ color: 'var(--blue-primary)' }} />;
    case '🌀':
      return <Compass size={20} style={{ color: 'var(--purple-primary)' }} />;
    case '🏔️':
      return <Mountain size={20} style={{ color: 'var(--navy-light)' }} />;
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

interface ReportsPageClientProps {
  initialReports: any[];
}

export default function ReportsPageClient({ initialReports }: ReportsPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportsList] = useState<any[]>(initialReports);

  // ── Modal state ─────────────────────────────────────────────────────
  const [modalReport, setModalReport] = useState<any>(null);
  const [modalName, setModalName] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalReport(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalReport) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalReport]);

  const openModal = (report: any) => {
    setModalReport(report);
    setModalName('');
    setModalEmail('');
    setModalError('');
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalReport) return;
    setModalError('');
    setModalSubmitting(true);

    try {
      const res = await fetch('/api/reports/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: modalReport.id,
          name: modalName.trim(),
          email: modalEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      // Close modal and navigate to the PDF viewer
      setModalReport(null);
      router.push(`/reports/view/${modalReport.id}?token=${encodeURIComponent(data.token)}`);
    } catch (err: any) {
      setModalError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setModalSubmitting(false);
    }
  };


  const sortedReports = React.useMemo(() => {
    return [...reportsList].sort((a, b) => {
      const yearA = parseInt(a.year, 10) || 0;
      const yearB = parseInt(b.year, 10) || 0;
      if (yearB !== yearA) {
        return yearB - yearA;
      }
      return (b.id || 0) - (a.id || 0);
    });
  }, [reportsList]);

  const filteredReports = React.useMemo(() => {
    return sortedReports.filter((report) => {
      const matchesTab = activeTab === 'All' || report.category.toLowerCase() === activeTab.toLowerCase();
      const matchesSearch =
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.disaster_type && report.disaster_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (report.region && report.region.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [sortedReports, activeTab, searchQuery]);

  return (
    <div className={styles.page}>
      <ScrollReveal direction="down">
        <PageHero
          theme="reports"
          eyebrow="DCRF Research Library"
          line1="RESEARCH"
          line2="/ PUBLICATIONS"
          subtitle="Explore DCRF's comprehensive repository of disaster risk assessments, heat action briefs, climate finance reports, and geospatial audits."
        />
      </ScrollReveal>

      {/* Library Controls */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className={styles.controlsPanel}>
          {/* Search bar */}
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search reports, states, or hazards..."
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
              <div className={styles.card} style={{ position: 'relative', overflow: 'hidden', paddingTop: '24px' }}>
                <div className={styles.cardHeaderRow}>
                  <div className={`${styles.iconWrapper} ${getReportIconBgClass(report.icon)}`}>
                    {getReportIcon(report.icon)}
                  </div>
                  <span className={styles.categoryBadge}>{report.category}</span>
                </div>
                
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{report.title}</h3>
                  <p className={styles.description}>{report.description}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '14px' }}>
                    <div>
                      <strong style={{ color: 'var(--text-default)' }}>Source:</strong> <span>{report.source || 'DCRF'}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-default)' }}>Region:</strong> <span>{report.region || 'National'}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-default)' }}>Hazard:</strong> <span>{report.disaster_type || 'General'}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-default)' }}>Severity:</strong> <span>{report.severity_level || 'Medium'}</span>
                    </div>
                    {report.affected_population && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <strong style={{ color: 'var(--text-default)' }}>Impact:</strong> <span>{report.affected_population}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.footer} style={{ borderTop: '1px solid var(--border-color)', marginTop: '14px', paddingTop: '14px' }}>
                  <span className={styles.metaText}>
                    {report.year} • {report.page_count || report.pageCount} pages
                  </span>
                  <button
                    onClick={() => openModal(report)}
                    className={styles.downloadBtn}
                  >
                    <Download size={14} />
                    View Report
                  </button>
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

      {/* ── Name & Email Popup Modal ────────────────────────────────────── */}
      {modalReport && (
        <div className={styles.modalOverlay} onClick={() => setModalReport(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button className={styles.modalClose} onClick={() => setModalReport(null)}>
              <X size={18} />
            </button>

            {/* Report title */}
            <h3 className={styles.modalTitle}>{modalReport.title}</h3>
            <p className={styles.modalSub}>
              {modalReport.category} • {modalReport.year} • {modalReport.page_count || modalReport.pageCount} pages
            </p>

            {/* Error */}
            {modalError && (
              <div className={styles.modalError}>
                <AlertTriangle size={14} />
                {modalError}
              </div>
            )}

            {/* Simple form */}
            <form onSubmit={handleModalSubmit} className={styles.modalForm}>
              <input
                type="text"
                required
                value={modalName}
                onChange={(e) => setModalName(e.target.value)}
                placeholder="Your name"
                className={styles.modalInput}
                autoComplete="name"
                autoFocus
              />
              <input
                type="email"
                required
                value={modalEmail}
                onChange={(e) => setModalEmail(e.target.value)}
                placeholder="Email address"
                className={styles.modalInput}
                autoComplete="email"
              />
              <button type="submit" disabled={modalSubmitting} className={styles.modalSubmitBtn}>
                {modalSubmitting ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    Opening...
                  </>
                ) : (
                  'Proceed'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
