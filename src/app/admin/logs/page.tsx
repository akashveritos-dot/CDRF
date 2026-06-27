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
import ConfirmModal from '@/components/ui/ConfirmModal/ConfirmModal';

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

  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'logs' | 'trash'>('logs');
  const [deletedRecords, setDeletedRecords] = useState<any[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [restoreTarget, setRestoreTarget] = useState<{ id: number; tableName: string } | null>(null);

  const fetchDeletedRecords = useCallback(async () => {
    setTrashLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/audit-logs/restore');
      if (res.ok) {
        const data = await res.json();
        setDeletedRecords(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch deleted records:', err);
    } finally {
      setTrashLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'trash') {
      fetchDeletedRecords();
    }
  }, [activeTab, fetchDeletedRecords]);

  const handleRestore = (backupId: number, tableName: string) => {
    setRestoreTarget({ id: backupId, tableName });
  };

  const triggerRestore = async (backupId: number, tableName: string) => {
    setRestoreTarget(null);
    setRestoringId(backupId);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/audit-logs/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Record restored successfully!');
        fetchDeletedRecords();
      } else {
        setErrorMsg(data.error || 'Failed to restore record');
      }
    } catch (err: any) {
      setErrorMsg('Failed to restore record due to network error.');
    } finally {
      setRestoringId(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated) {
          setCurrentUserRole(data.user.role);
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (currentUserRole && currentUserRole !== 'SUPERADMIN') return;
    const delayDebounce = setTimeout(() => {
      fetchLogs();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [fetchLogs, currentUserRole]);

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

  if (currentUserRole && currentUserRole !== 'SUPERADMIN') {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 20px', gap: '16px', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ color: 'var(--wine-red-primary)' }} />
          <h2 style={{ color: 'var(--wine-red-primary)', fontSize: '24px', fontWeight: 700 }}>Access Denied</h2>
          <p>Only SUPERADMIN users can view system audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Title */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <FileText className={styles.headerIcon} size={28} />
          <div>
            <h1>Administrative Console</h1>
            <p>System activity audit monitoring and transactional database recovery system.</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation Controls */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'logs' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('logs');
            setSuccessMsg('');
            setErrorMsg('');
          }}
        >
          Audit Logs
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'trash' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('trash');
            setSuccessMsg('');
            setErrorMsg('');
          }}
        >
          Trash Bin & Restore
        </button>
      </div>

      {successMsg && (
        <div className={styles.successAlert}>
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className={styles.errorAlert}>
          <span>⚠</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === 'logs' ? (
        <>
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
                      <td style={{ fontWeight: '600', color: '#1e293b' }}>
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
        </>
      ) : (
        <>
          {/* Trash Bin Table */}
          {trashLoading ? (
            <div className={styles.loadingBlock}>
              <Loader2 size={32} className={styles.spinner} />
              <span>Checking backup vault...</span>
            </div>
          ) : deletedRecords.length > 0 ? (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Table Name</th>
                    <th>Record ID/Slug</th>
                    <th>Deleted By</th>
                    <th>Deleted Date</th>
                    <th>Data Snapshot</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedRecords.map((record) => {
                    const parsedData = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
                    const previewText = parsedData.title || parsedData.headline || parsedData.name || parsedData.caption || parsedData.eyebrow || record.record_id;
                    return (
                      <tr key={record.id}>
                        <td style={{ fontWeight: '600', color: 'var(--wine-red-primary)' }}>{record.table_name}</td>
                        <td><code>{record.record_id}</code></td>
                        <td>
                          <div className={styles.userBadge}>
                            <span className={styles.userName}>{record.deleted_by_email}</span>
                            <span className={styles.userRole}>{record.deleted_by_role}</span>
                          </div>
                        </td>
                        <td>{new Date(record.deleted_at).toLocaleString()}</td>
                        <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(parsedData)}>
                          <strong>{previewText}</strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            disabled={restoringId === record.id}
                            onClick={() => handleRestore(record.id, record.table_name)}
                            className={styles.restoreBtn}
                          >
                            {restoringId === record.id ? <Loader2 size={12} className={styles.spinner} style={{ marginRight: '6px' }} /> : null}
                            <span>Restore Record</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <AlertCircle size={36} />
              <h3>The Trash Bin is empty.</h3>
              <p>No recently deleted database records exist in the backup vault.</p>
            </div>
          )}
        </>
      )}
      <ConfirmModal
        isOpen={restoreTarget !== null}
        title="Confirm Restoration"
        message={`Are you sure you want to restore this deleted record back to the "${restoreTarget?.tableName}" table?`}
        onConfirm={() => restoreTarget && triggerRestore(restoreTarget.id, restoreTarget.tableName)}
        onCancel={() => setRestoreTarget(null)}
        confirmText="Restore Record"
        isDanger={false}
      />
    </div>
  );
}
