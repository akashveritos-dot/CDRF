'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Search,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Send
} from 'lucide-react';
import styles from '../memberships/page.module.css';
import { useToast } from '@/components/ui/Toast/ToastContext';
import EmailSenderModal from '@/components/admin/EmailSenderModal';

export default function AdminSubscriptions() {
  const toast = useToast();
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();

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
  }, [fetchSubscriptions]);

  const handleExportCSV = () => {
    const start = exportStartDate ? new Date(exportStartDate + 'T00:00:00') : null;
    const end = exportEndDate ? new Date(exportEndDate + 'T23:59:59') : null;

    const dataToExport = subscriptions.filter((item) => {
      const dateVal = new Date(item.created_at);
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

    const headers = ['ID', 'Name', 'Email', 'Created At (Subscribed Date)', 'Updated At'];
    const rows = dataToExport.map((item) => [
      item.id,
      item.name || '',
      item.email || '',
      item.created_at ? new Date(item.created_at).toISOString() : '',
      item.updated_at ? new Date(item.updated_at).toISOString() : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `subscriptions_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to permanently delete this subscription?')) return;

    try {
      const res = await fetch(`/api/subscriptions?id=${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete');
      fetchSubscriptions();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error deleting subscription record');
    }
  };

  // Filter subscriptions client-side based on search string
  const filteredSubscriptions = subscriptions.filter(sub => {
    const searchLower = search.toLowerCase();
    const matchesEmail = sub.email?.toLowerCase().includes(searchLower);
    const matchesName = sub.name ? sub.name.toLowerCase().includes(searchLower) : false;
    return matchesEmail || matchesName;
  });

  return (
    <div className={styles.page}>
      {/* Title */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <Mail className={styles.headerIcon} size={28} />
          <div>
            <h1>Email Subscriptions</h1>
            <p>Manage newsletter subscriptions captured from the public footer and subscribe dialog.</p>
          </div>
        </div>
      </div>

      {/* Superadmin Export panel */}
      {currentUser?.role === 'SUPERADMIN' && (
        <div className={styles.exportSection}>
          <div className={styles.exportTitle}>
            <Mail size={16} />
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

      {/* Filter and Search Dashboard */}
      <div className={styles.controls} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {/* Search */}
        <div className={styles.searchWrapper} style={{ flex: 1 }}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search subscriptions by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button
          onClick={() => setIsEmailModalOpen(true)}
          className={styles.exportBtn}
          style={{
            background: 'var(--wine-red-primary)',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(185, 28, 28, 0.15)'
          }}
        >
          <Send size={14} />
          <span>Send Email ({selectedEmails.length})</span>
        </button>
      </div>

      {/* Database Output List */}
      {loading ? (
        <div className={styles.loadingBlock}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Searching registry database...</span>
        </div>
      ) : filteredSubscriptions.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px', paddingLeft: '16px' }}>
                  <input
                    type="checkbox"
                    checked={filteredSubscriptions.length > 0 && selectedEmails.length === filteredSubscriptions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmails(filteredSubscriptions.map(s => s.email).filter(Boolean));
                      } else {
                        setSelectedEmails([]);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th>Subscriber Details</th>
                <th>Subscribed Date (IST)</th>
                <th>Last Updated (IST)</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((item) => (
                <tr key={item.id} className={styles.tableRow}>
                  <td style={{ verticalAlign: 'middle', paddingLeft: '16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(item.email)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmails([...selectedEmails, item.email]);
                        } else {
                          setSelectedEmails(selectedEmails.filter(email => email !== item.email));
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <div className={styles.applicantInfo}>
                      <span className={styles.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        {item.name || <em style={{ color: 'var(--text-muted)' }}>No name provided</em>}
                      </span>
                      <span className={styles.subMeta}>
                        <Mail size={11} /> {item.email}
                      </span>
                    </div>
                  </td>
                  <td className={styles.dateCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                      {item.created_at ? new Date(item.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) : 'N/A'}
                    </div>
                  </td>
                  <td className={styles.dateCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                      {item.updated_at ? new Date(item.updated_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) : 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionCell} style={{ justifyContent: 'flex-end', paddingRight: '12px' }}>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className={styles.deleteBtn}
                        title="Delete Subscription"
                      >
                        <Trash2 size={14} />
                      </button>
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
          <h3>No subscriptions found.</h3>
          <p>Modify search filters or subscribe via the public website forms.</p>
        </div>
      )}

      <EmailSenderModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        initialSelectedEmails={selectedEmails}
        allRecipients={subscriptions.map(s => ({ name: s.name, email: s.email }))}
        toast={toast}
      />
    </div>
  );
}
