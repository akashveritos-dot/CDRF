'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Building,
  Mail,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Bell,
  AlertTriangle,
  Calendar,
  Shield
} from 'lucide-react';
import styles from './page.module.css';
import ActionLoader from '@/components/ui/ActionLoader/ActionLoader';

export default function AdminMemberships() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, expiringSoon: 0, expired: 0 });
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPay, setFilterPay] = useState('All');
  const [filterMemberStatus, setFilterMemberStatus] = useState('All');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // Modal State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    status: 'Pending',
    pay_status: 'Unpaid',
    membership_status: 'Active',
    payment_details: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reminder state
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/memberships?stats=1');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTier !== 'All') params.set('tier', filterTier);
      if (filterStatus !== 'All') params.set('status', filterStatus);
      if (filterPay !== 'All') params.set('pay_status', filterPay);
      if (filterMemberStatus !== 'All') params.set('membership_status', filterMemberStatus);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/memberships?${params.toString()}`);
      const data = await res.json();
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  }, [filterTier, filterStatus, filterPay, filterMemberStatus, search]);

  useEffect(() => {
    fetchStats();
    
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
  }, [fetchStats]);

  const handleExportCSV = () => {
    const start = exportStartDate ? new Date(exportStartDate + 'T00:00:00') : null;
    const end = exportEndDate ? new Date(exportEndDate + 'T23:59:59') : null;

    const dataToExport = registrations.filter((item) => {
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

    const headers = ['ID', 'User ID', 'Name', 'Email', 'Organization', 'Title', 'Tier', 'Message', 'Status', 'Pay Status', 'Payment Details', 'Starts At', 'Expires At', 'Membership Status', 'Created At'];
    const rows = dataToExport.map((item) => [
      item.id,
      item.user_id || '',
      item.name || '',
      item.email || '',
      item.organization || '',
      item.title || '',
      item.tier || '',
      item.message || '',
      item.status || '',
      item.pay_status || '',
      item.payment_details || '',
      item.starts_at ? new Date(item.starts_at).toISOString() : '',
      item.expires_at ? new Date(item.expires_at).toISOString() : '',
      item.membership_status || 'Active',
      item.created_at ? new Date(item.created_at).toISOString() : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `memberships_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRegistrations();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, filterTier, filterStatus, filterPay, filterMemberStatus, fetchRegistrations]);

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setFormData({
      status: item.status,
      pay_status: item.pay_status,
      membership_status: item.membership_status || 'Active',
      payment_details: item.payment_details || ''
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    setActionLoading('Saving changes...');
    try {
      const res = await fetch(`/api/admin/memberships/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to update');
      setEditingItem(null);
      fetchRegistrations();
      fetchStats();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error updating application details');
    } finally {
      setIsSaving(false);
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to permanently delete this registration record?')) return;
    setIsSaving(true);
    setActionLoading('Deleting registration record...');
    try {
      const res = await fetch(`/api/admin/memberships/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await Promise.all([fetchRegistrations(), fetchStats()]);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error deleting application record');
    } finally {
      setIsSaving(false);
      setActionLoading(null);
    }
  };

  const handleSendReminders = async () => {
    setIsSendingReminders(true);
    setReminderResult(null);
    setActionLoading('Sending reminders...');
    try {
      const res = await fetch('/api/admin/send-reminders', { method: 'POST' });
      const data = await res.json();
      setReminderResult(data);
    } catch (err) {
      setReminderResult({ success: false, message: 'Failed to send reminders' });
    } finally {
      setIsSendingReminders(false);
      setActionLoading(null);
    }
  };

  const getEffectiveStatus = (item: any) => {
    if (item.expires_at && new Date(item.expires_at) < new Date()) return 'Expired';
    return item.membership_status || 'Active';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Approved': return styles.badgeSuccess;
      case 'Rejected': return styles.badgeDanger;
      default: return styles.badgeWarning;
    }
  };

  const getPayStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Paid': return styles.badgeSuccess;
      case 'Waived': return styles.badgeInfo;
      default: return styles.badgeDanger;
    }
  };

  const getMemberStatusClass = (status: string) => {
    switch (status) {
      case 'Active': return styles.badgeSuccess;
      case 'Expired': return styles.badgeDanger;
      case 'Cancelled': return styles.badgeWarning;
      case 'Renewed': return styles.badgeInfo;
      default: return styles.badgeWarning;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className={styles.page}>
      {/* Title */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <Users className={styles.headerIcon} size={28} />
          <div>
            <h1>Membership Applications</h1>
            <p>Review organization submissions, approve tiers, manage lifecycles, and dispatch renewal reminders.</p>
          </div>
        </div>
        <button
          onClick={handleSendReminders}
          disabled={isSendingReminders}
          className={styles.reminderBtn}
          title="Send renewal reminders to members expiring in 30, 7, or 0 days"
        >
          {isSendingReminders ? (
            <><Loader2 size={14} className={styles.spinner} /> Sending...</>
          ) : (
            <><Bell size={14} /> Send Expiry Reminders</>
          )}
        </button>
      </div>

      {/* Reminder Result */}
      {reminderResult && (
        <div className={`${styles.reminderResult} ${reminderResult.success ? styles.reminderSuccess : styles.reminderError}`}>
          {reminderResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{reminderResult.message}</span>
        </div>
      )}

      {/* Stats Dashboard */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#3b82f6' }}><Shield size={20} /></div>
          <div>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Paid Members</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#10b981' }}><CheckCircle size={20} /></div>
          <div>
            <div className={styles.statValue}>{stats.active}</div>
            <div className={styles.statLabel}>Active Members</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#f59e0b' }}><Clock size={20} /></div>
          <div>
            <div className={styles.statValue}>{stats.expiringSoon}</div>
            <div className={styles.statLabel}>Expiring in 30 Days</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#ef4444' }}><AlertTriangle size={20} /></div>
          <div>
            <div className={styles.statValue}>{stats.expired}</div>
            <div className={styles.statLabel}>Expired Members</div>
          </div>
        </div>
      </div>

      {/* Superadmin Export panel */}
      {currentUser?.role === 'SUPERADMIN' && (
        <div className={styles.exportSection}>
          <div className={styles.exportTitle}>
            <Users size={16} />
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
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search organizations, names, or corporate emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Tier</label>
            <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className={styles.select}>
              <option value="All">All Tiers</option>
              <option value="Basic">Basic</option>
              <option value="Prime">Prime</option>
              <option value="Premium">Premium</option>
              <option value="Gold">Gold</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Approval Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={styles.select}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Payment</label>
            <select value={filterPay} onChange={(e) => setFilterPay(e.target.value)} className={styles.select}>
              <option value="All">All Payments</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Waived">Waived</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Membership Status</label>
            <select value={filterMemberStatus} onChange={(e) => setFilterMemberStatus(e.target.value)} className={styles.select}>
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Renewed">Renewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loadingBlock}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Searching registry database...</span>
        </div>
      ) : registrations.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Applicant / Organization</th>
                <th>Tier</th>
                <th>Membership Status</th>
                <th>Submitted</th>
                <th>Expires</th>
                <th>Approval</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((item) => {
                const effectiveStatus = getEffectiveStatus(item);
                const daysLeft = getDaysUntilExpiry(item.expires_at);
                const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

                return (
                  <tr key={item.id} className={styles.tableRow}>
                    <td>
                      <div className={styles.applicantInfo}>
                        <span className={styles.name}>{item.name}</span>
                        <span className={styles.subMeta}><Building size={11} /> {item.organization}</span>
                        <span className={styles.subMeta}><Mail size={11} /> {item.email}</span>
                        {item.title && <span className={styles.subMeta}><Briefcase size={11} /> {item.title}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.tierBadge} ${styles['tier' + item.tier]}`}>{item.tier}</span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getMemberStatusClass(effectiveStatus)}`}>
                        {effectiveStatus}
                      </span>
                      {isExpiringSoon && effectiveStatus === 'Active' && (
                        <div className={styles.expiryWarning}>
                          <Clock size={10} /> {daysLeft}d left
                        </div>
                      )}
                    </td>
                    <td className={styles.dateCell}>{formatDate(item.created_at)}</td>
                    <td className={styles.dateCell}>
                      {item.expires_at ? (
                        <span style={{ color: daysLeft !== null && daysLeft < 0 ? '#ef4444' : daysLeft !== null && daysLeft <= 30 ? '#f59e0b' : '#94a3b8' }}>
                          {formatDate(item.expires_at)}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getPayStatusBadgeClass(item.pay_status)}`}>
                        {item.pay_status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button onClick={() => handleEditClick(item)} disabled={isSaving} className={styles.editBtn} title="Edit Registration">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} disabled={isSaving} className={styles.deleteBtn} title="Delete Record">
                          <Trash2 size={14} />
                        </button>
                      </div>
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
          <h3>No applications found.</h3>
          <p>Modify search filters or submit test applications from the public frontend.</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit Application Details</h2>
              <button onClick={() => setEditingItem(null)} className={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.modalForm}>
              <div className={styles.modalMetaInfo}>
                <div><strong>Applicant:</strong> {editingItem.name}</div>
                <div><strong>Organization:</strong> {editingItem.organization}</div>
                <div><strong>Target Tier:</strong> {editingItem.tier}</div>
                <div><strong>Email:</strong> {editingItem.email}</div>
                {editingItem.expires_at && (
                  <div><strong>Expires:</strong> {formatDate(editingItem.expires_at)}</div>
                )}
                {editingItem.message && (
                  <div className={styles.messageBox}>
                    <strong>Description:</strong>
                    <p>{editingItem.message}</p>
                  </div>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label>Review Approval Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className={styles.selectField}
                >
                  <option value="Pending">Pending Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Membership Lifecycle Status</label>
                <select
                  value={formData.membership_status}
                  onChange={(e) => setFormData(prev => ({ ...prev, membership_status: e.target.value }))}
                  className={styles.selectField}
                >
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Renewed">Renewed</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Payment Reconciliation</label>
                <select
                  value={formData.pay_status}
                  onChange={(e) => setFormData(prev => ({ ...prev, pay_status: e.target.value }))}
                  className={styles.selectField}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Waived">Waived</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Payment Reference Logs</label>
                <textarea
                  rows={3}
                  value={formData.payment_details}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_details: e.target.value }))}
                  placeholder="e.g. Transaction ID: TXN983248234, Bank ref, date verified..."
                  className={styles.textareaField}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setEditingItem(null)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <><Loader2 size={14} className={styles.spinner} /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ActionLoader message={actionLoading} />
    </div>
  );
}
