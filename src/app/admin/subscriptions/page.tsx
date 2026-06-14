'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Search,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  User
} from 'lucide-react';
import styles from '../memberships/page.module.css';

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
  }, [fetchSubscriptions]);

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

      {/* Filter and Search Dashboard */}
      <div className={styles.controls}>
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
                <th>Subscriber Details</th>
                <th>Subscribed Date (IST)</th>
                <th>Last Updated (IST)</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((item) => (
                <tr key={item.id} className={styles.tableRow}>
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
    </div>
  );
}
