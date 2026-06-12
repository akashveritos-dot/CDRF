'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  DollarSign, 
  Loader2, 
  ArrowUpDown,
  Building,
  Mail,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import styles from './page.module.css';

export default function AdminMemberships() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPay, setFilterPay] = useState('All');

  // Modal State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    status: 'Pending',
    pay_status: 'Unpaid',
    payment_details: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTier !== 'All') params.set('tier', filterTier);
      if (filterStatus !== 'All') params.set('status', filterStatus);
      if (filterPay !== 'All') params.set('pay_status', filterPay);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/memberships?${params.toString()}`);
      const data = await res.json();
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  }, [filterTier, filterStatus, filterPay, search]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRegistrations();
    }, 300); // Debounce search changes

    return () => clearTimeout(delayDebounce);
  }, [search, filterTier, filterStatus, filterPay, fetchRegistrations]);

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setFormData({
      status: item.status,
      pay_status: item.pay_status,
      payment_details: item.payment_details || ''
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/memberships/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to update');
      
      setEditingItem(null);
      fetchRegistrations();
    } catch (err) {
      alert('Error updating application details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this registration record?')) return;

    try {
      const res = await fetch(`/api/admin/memberships/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete');
      fetchRegistrations();
    } catch (err) {
      alert('Error deleting application record');
    }
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

  return (
    <div className={styles.page}>
      {/* Title */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <Users className={styles.headerIcon} size={28} />
          <div>
            <h1>Membership Applications</h1>
            <p>Review organization submissions, approve tiers, and log payment records.</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Dashboard */}
      <div className={styles.controls}>
        {/* Search */}
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

        {/* Filter Selection Grid */}
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
        </div>
      </div>

      {/* Database Output List */}
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
                <th>Target Tier</th>
                <th>Submitted Date</th>
                <th>Approval</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((item) => (
                <tr key={item.id} className={styles.tableRow}>
                  <td>
                    <div className={styles.applicantInfo}>
                      <span className={styles.name}>{item.name}</span>
                      <span className={styles.subMeta}>
                        <Building size={11} /> {item.organization}
                      </span>
                      <span className={styles.subMeta}>
                        <Mail size={11} /> {item.email}
                      </span>
                      {item.title && (
                        <span className={styles.subMeta}>
                          <Briefcase size={11} /> {item.title}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.tierBadge} ${styles['tier' + item.tier]}`}>
                      {item.tier}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
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
                      <button 
                        onClick={() => handleEditClick(item)} 
                        className={styles.editBtn}
                        title="Edit Registration Properties"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className={styles.deleteBtn}
                        title="Delete Record"
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
          <h3>No applications found.</h3>
          <p>Modify search filters or submit test applications from the public frontend.</p>
        </div>
      )}

      {/* Editing Application Modal Form */}
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
                <label>Payment Reference logs</label>
                <textarea
                  rows={3}
                  value={formData.payment_details}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_details: e.target.value }))}
                  placeholder="e.g. Transaction ID: TXN983248234, Bank ref, date verified..."
                  className={styles.textareaField}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setEditingItem(null)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className={styles.spinner} />
                      Saving changes...
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
