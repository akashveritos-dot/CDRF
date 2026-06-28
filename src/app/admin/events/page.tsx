'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Trash2, 
  Check, 
  X, 
  Loader2, 
  Building,
  Mail,
  Briefcase,
  AlertCircle,
  QrCode
} from 'lucide-react';
import styles from './page.module.css';
import ActionLoader from '@/components/ui/ActionLoader/ActionLoader';

export default function AdminEvents() {
  const [role, setRole] = useState<string>('ADMIN');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRole, setFilterRole] = useState('All'); // Attendance Mode
  
  // Fetch user role on mount
  useEffect(() => {
    (async () => {
      try {
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.authenticated && authData.user) {
            setRole(authData.user.role);
          }
        }
      } catch (err) {
        console.error('Failed to load user session role:', err);
      }
    })();
  }, []);

  // Action State
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'All') params.set('status', filterStatus);
      if (filterRole !== 'All') params.set('role', filterRole);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/events?${params.toString()}`);
      const data = await res.json();
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load conclave registrations:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterRole, search]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRegistrations();
    }, 300); // Debounce search changes

    return () => clearTimeout(delayDebounce);
  }, [search, filterStatus, filterRole, fetchRegistrations]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    setActionLoading('Updating attendee status...');
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');
      fetchRegistrations();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error updating attendee status');
    } finally {
      setUpdatingId(null);
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to permanently delete this event registration record?')) return;

    setActionLoading('Deleting registration record...');
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete');
      }
      fetchRegistrations();
    } catch (err: any) {
      // eslint-disable-next-line no-alert
      alert(err.message || 'Error deleting registration record');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Approved': return styles.badgeSuccess;
      case 'Checked-In': return styles.badgeInfo;
      case 'Rejected': return styles.badgeDanger;
      default: return styles.badgeWarning;
    }
  };

  return (
    <div className={styles.page}>
      {/* Title */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <Calendar className={styles.headerIcon} size={28} />
          <div>
            <h1>Conclave Registrations</h1>
            <p>Review delegate registrations for the Dcrc Conclave 2026, approve passes, and manage check-ins.</p>
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
            placeholder="Search attendees by name, company, email, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Filter Selection Grid */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Attendance Mode</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={styles.select}>
              <option value="All">All Modes</option>
              <option value="In-Person Delegate">In-Person</option>
              <option value="Virtual Delegate">Virtual / Live Stream</option>
              <option value="Sponsor / Exhibition partner">Exhibitor / Partner</option>
              <option value="Media representative">Media / Press</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Registration Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={styles.select}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Review</option>
              <option value="Approved">Approved / Issued</option>
              <option value="Checked-In">Checked-In</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Output List Table */}
      {loading ? (
        <div className={styles.loadingBlock}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Syncing delegate database...</span>
        </div>
      ) : registrations.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Attendee / Company</th>
                <th>Designation</th>
                <th>Attendance Mode</th>
                <th>Status</th>
                <th>Registered Date</th>
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
                        <Building size={11} /> {item.company}
                      </span>
                      <span className={styles.subMeta}>
                        <Mail size={11} /> {item.email}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.designationCell}>
                      {item.designation ? (
                        <span className={styles.designationText}>
                          <Briefcase size={12} style={{ marginRight: '4px' }} />
                          {item.designation}
                        </span>
                      ) : (
                        <em style={{ color: 'var(--text-muted, #64748b)' }}>Not specified</em>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${
                      item.role.includes('In-Person') ? styles.roleInPerson :
                      item.role.includes('Virtual') ? styles.roleVirtual : styles.rolePartner
                    }`}>
                      {item.role}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
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
                    <div className={styles.actionCell}>
                      {/* Approve button */}
                      {item.status === 'Pending' && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'Approved')}
                          disabled={updatingId === item.id}
                          className={styles.approveBtn}
                          title="Approve & Issue Pass"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      
                      {/* Check-In button */}
                      {item.status === 'Approved' && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'Checked-In')}
                          disabled={updatingId === item.id}
                          className={styles.checkinBtn}
                          title="Mark Checked-In at Venue"
                        >
                          <QrCode size={14} />
                        </button>
                      )}

                      {/* Reject button */}
                      {(item.status === 'Pending' || item.status === 'Approved') && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'Rejected')}
                          disabled={updatingId === item.id}
                          className={styles.rejectBtn}
                          title="Reject Application"
                        >
                          <X size={14} />
                        </button>
                      )}

                      {/* Reset to Pending button */}
                      {(item.status === 'Approved' || item.status === 'Rejected' || item.status === 'Checked-In') && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'Pending')}
                          disabled={updatingId === item.id}
                          className={styles.resetBtn}
                          title="Revert to Pending"
                        >
                          Revert
                        </button>
                      )}

                      <button 
                        onClick={() => handleDelete(item.id)} 
                        disabled={updatingId === item.id || (role !== 'SUPERADMIN' && role !== 'ADMIN')}
                        className={`${styles.deleteBtn} ${(role !== 'SUPERADMIN' && role !== 'ADMIN') ? styles.disabledBtn : ''}`}
                        title={role !== 'SUPERADMIN' && role !== 'ADMIN' ? 'Only administrators can delete registrations' : 'Delete Record'}
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
          <h3>No conclave registrations found.</h3>
          <p>Modify filters or register test attendees on the public Conclave site.</p>
        </div>
      )}
      <ActionLoader message={actionLoading} />
    </div>
  );
}
