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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

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
    
    async function checkRole() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setCurrentUser(data.user);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkRole();
  }, []);

  const handleExportCSV = () => {
    const start = exportStartDate ? new Date(exportStartDate + 'T00:00:00') : null;
    const end = exportEndDate ? new Date(exportEndDate + 'T23:59:59') : null;

    const dataToExport = downloads.filter((d) => {
      const dateVal = new Date(d.downloaded_at);
      if (start && dateVal < start) return false;
      if (end && dateVal > end) return false;
      return true;
    });

    if (dataToExport.length === 0) {
      alert('No records found for the selected date range.');
      return;
    }

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };

    const headers = ['ID', 'Report ID', 'Report Title', 'Report Category', 'Name', 'Email', 'Designation', 'Entity Type', 'Organization Name', 'Mobile', 'Downloaded At'];
    const rows = dataToExport.map((d) => [
      d.id,
      d.report_id,
      d.report_title || '',
      d.report_category || '',
      d.name || '',
      d.email || '',
      d.designation || '',
      d.entityType || '',
      d.organizationName || '',
      d.mobile || '',
      d.downloaded_at ? new Date(d.downloaded_at).toISOString() : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `report_downloads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
 
      {/* Superadmin Export panel */}
      {currentUser?.role === 'SUPERADMIN' && (
        <div className={styles.exportSection}>
          <div className={styles.exportTitle}>
            <Download size={16} />
            <span>Superadmin Excel Export</span>
          </div>
          <div className={styles.exportControls}>
            <div className={styles.exportField}>
              <label>From Date</label>
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className={styles.exportInput}
              />
            </div>
            <div className={styles.exportField}>
              <label>To Date</label>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className={styles.exportInput}
              />
            </div>
            <button onClick={handleExportCSV} className={styles.exportBtn}>
              Export to Excel
            </button>
          </div>
        </div>
      )}

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
                <th>Designation</th>
                <th>Entity Type</th>
                <th>Organization</th>
                <th>Mobile</th>
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
                  <td style={{ color: '#cbd5e1', fontSize: '13px' }}>{d.designation || '—'}</td>
                  <td style={{ color: '#cbd5e1', fontSize: '13px' }}>{d.entityType || '—'}</td>
                  <td style={{ color: '#cbd5e1', fontSize: '13px' }}>{d.organizationName || '—'}</td>
                  <td style={{ color: '#cbd5e1', fontSize: '13px', whiteSpace: 'nowrap' }}>{d.mobile || '—'}</td>
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
