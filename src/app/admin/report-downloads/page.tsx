'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Loader2,
  AlertCircle,
  Search,
  Mail,
  User,
  FileText,
  Calendar,
  Filter
} from 'lucide-react';
import styles from './page.module.css';

export default function AdminReportDownloads() {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReport, setFilterReport] = useState('all');
  const [reports, setReports] = useState<any[]>([]);

  const fetchDownloads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/report-downloads');
      const data = await res.json();
      setDownloads(Array.isArray(data.downloads) ? data.downloads : []);

      // Extract unique reports for the filter dropdown
      const uniqueReports: any[] = [];
      const seen = new Set<number>();
      for (const d of data.downloads || []) {
        if (d.report_id && !seen.has(d.report_id)) {
          seen.add(d.report_id);
          uniqueReports.push({ id: d.report_id, title: d.report_title || `Report #${d.report_id}` });
        }
      }
      setReports(uniqueReports);
    } catch (err) {
      console.error('Failed to load report downloads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  const filteredDownloads = downloads.filter((d) => {
    const matchesSearch =
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.report_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterReport === 'all' || d.report_id?.toString() === filterReport;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <Download className={styles.headerIcon} size={28} />
          <div>
            <h1>Report Download Logs</h1>
            <p>Track who accessed research publications and when they were viewed.</p>
          </div>
        </div>
        <div className={styles.statBadge}>
          <span className={styles.statNumber}>{downloads.length}</span>
          <span className={styles.statLabel}>Total Downloads</span>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, email, or report title..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.filterWrapper}>
          <Filter size={14} className={styles.filterIcon} />
          <select
            value={filterReport}
            onChange={(e) => setFilterReport(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Reports</option>
            {reports.map((r) => (
              <option key={r.id} value={r.id.toString()}>
                {r.title.length > 40 ? r.title.substring(0, 40) + '...' : r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loadingBlock}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Loading download records...</span>
        </div>
      ) : filteredDownloads.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={12} />
                    Name
                  </div>
                </th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={12} />
                    Email
                  </div>
                </th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={12} />
                    Report
                  </div>
                </th>
                <th>Category</th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} />
                    Downloaded At
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDownloads.map((d, idx) => (
                <tr key={d.id} className={styles.tableRow}>
                  <td className={styles.indexCell}>{idx + 1}</td>
                  <td>
                    <span className={styles.nameText}>{d.name}</span>
                  </td>
                  <td>
                    <a href={`mailto:${d.email}`} className={styles.emailLink}>
                      {d.email}
                    </a>
                  </td>
                  <td>
                    <span className={styles.reportTitle}>
                      {d.report_title || `Report #${d.report_id}`}
                    </span>
                  </td>
                  <td>
                    {d.report_category && (
                      <span className={`${styles.categoryBadge} ${styles['cat' + d.report_category]}`}>
                        {d.report_category}
                      </span>
                    )}
                  </td>
                  <td className={styles.dateCell}>
                    {formatDate(d.downloaded_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <AlertCircle size={36} />
          <h3>No download records found.</h3>
          <p>
            {searchQuery || filterReport !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Download records will appear here when users access reports.'}
          </p>
        </div>
      )}
    </div>
  );
}
