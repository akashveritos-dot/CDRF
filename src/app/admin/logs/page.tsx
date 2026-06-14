'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Loader2, 
  AlertCircle,
  Network,
  Clock
} from 'lucide-react';
import styles from './page.module.css';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');
  
  const sections = [
    'All',
    'News',
    'Reports',
    'Memberships',
    'Event Registrations',
    'Alert Ticker',
    'Scraper Queue',
    'CMS Pages',
    'Gallery',
    'Users'
  ];

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sectionFilter !== 'All') {
        params.append('section', sectionFilter);
      }
      if (searchTerm.trim() !== '') {
        params.append('search', searchTerm.trim());
      }
      
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [sectionFilter, searchTerm]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLogs();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [fetchLogs]);

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'ADD': return styles.actionAdd;
      case 'UPDATE': return styles.actionUpdate;
      case 'DELETE': return styles.actionDelete;
      case 'PUBLISH': return styles.actionPublish;
      case 'UNPUBLISH': return styles.actionUnpublish;
      case 'RESTORE': return styles.actionRestore;
      default: return styles.actionOther;
    }
  };

  return (
    <div className={styles.page}>
      {/* Title */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <FileText className={styles.headerIcon} size={28} />
          <div>
            <h1>Administrative Audit Logs</h1>
            <p>Read-only monitoring of all administrative actions, data edits, and telemetry updates.</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search by user email, name, details, IP, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchField}
        />
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className={styles.selectField}
        >
          {sections.map(sec => (
            <option key={sec} value={sec}>{sec === 'All' ? 'All Sections' : sec}</option>
          ))}
        </select>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className={styles.loadingBlock}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Retrieving system change logs...</span>
        </div>
      ) : logs.length > 0 ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User Details</th>
                <th>Action</th>
                <th>Section</th>
                <th>Details of Change</th>
                <th>Network & Location</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  {/* User Profile Info */}
                  <td>
                    <div className={styles.userBadge}>
                      <span className={styles.userName}>{log.user_name}</span>
                      <span className={styles.userEmail}>{log.user_email}</span>
                      <span className={`${styles.userRole} ${log.user_role === 'ADMIN' ? styles.userRoleAdmin : ''}`}>
                        {log.user_role}
                      </span>
                    </div>
                  </td>
                  
                  {/* Action Badge */}
                  <td>
                    <span className={`${styles.actionBadge} ${getActionBadgeClass(log.action_type)}`}>
                      {log.action_type}
                    </span>
                  </td>
                  
                  {/* Section Label */}
                  <td style={{ fontWeight: '600', color: '#ffffff' }}>
                    {log.section}
                  </td>
                  
                  {/* Details Description */}
                  <td className={styles.detailsCol}>
                    {log.details}
                  </td>
                  
                  {/* IP Address and Smart Geolocation Location */}
                  <td>
                    <div className={styles.networkCol}>
                      <span className={styles.ipAddress}>{log.ip_address}</span>
                      <span className={styles.location}>{log.location}</span>
                    </div>
                  </td>
                  
                  {/* Timestamp */}
                  <td>
                    <div className={styles.timestamp}>
                      {new Date(log.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <AlertCircle size={36} />
          <h3>No audit logs match your search.</h3>
          <p>Try refining your filters or search keywords.</p>
        </div>
      )}
    </div>
  );
}
