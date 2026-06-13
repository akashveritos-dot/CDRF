'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Search, Shield, Loader2, ArrowUpDown } from 'lucide-react';
import styles from './page.module.css';

interface Registration {
  id: number;
  name: string;
  email: string;
  organization: string | null;
  interest: string;
  created_at: string;
}

export default function LaunchRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInterest, setFilterInterest] = useState('');

  useEffect(() => {
    fetchCurrentUser();
    fetchRegistrations();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        setCurrentUserRole(data.user.role);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const res = await fetch('/api/soon');
      const data = await res.json();
      if (res.ok) {
        setRegistrations(data.registrations || []);
      } else {
        setError(data.error || 'Failed to fetch registrations');
      }
    } catch (err) {
      setError('Failed to fetch registrations due to a connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and Search computations
  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch = 
      reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.organization && reg.organization.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = filterInterest ? reg.interest === filterInterest : true;

    return matchesSearch && matchesFilter;
  });

  // Extract unique interest options for filter dropdown
  const interestOptions = Array.from(
    new Set(registrations.map((r) => r.interest))
  ).filter(Boolean);

  if (currentUserRole && currentUserRole !== 'SUPERADMIN') {
    return (
      <div className={styles.container}>
        <div className={styles.accessDenied}>
          <Shield size={48} />
          <h2>Access Denied</h2>
          <p>Only SUPERADMIN users can access the Launching Soon registrations directory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Globe size={32} />
          <div>
            <h1>Launch Registrations</h1>
            <p>Monitor early-access registrations and interested partners from the Launching Soon landing page.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <span>⚠</span>
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Controls: Search, Filter, Stats */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search by name, email, or organization..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <select
          className={styles.filterSelect}
          value={filterInterest}
          onChange={(e) => setFilterInterest(e.target.value)}
        >
          <option value="">All Areas of Interest</option>
          {interestOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        
        <span className={styles.statsText}>
          Showing {filteredRegistrations.length} of {registrations.length} records
        </span>
      </div>

      {/* Main List Table */}
      {loading ? (
        <div className={styles.loading}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
          Loading registrations...
        </div>
      ) : filteredRegistrations.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Organization</th>
                <th>Area of Interest</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id}>
                  <td>#{reg.id}</td>
                  <td style={{ fontWeight: 600 }}>{reg.name}</td>
                  <td>{reg.email}</td>
                  <td>{reg.organization || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>None</span>}</td>
                  <td>
                    <span 
                      className={`${styles.badge} ${
                        reg.interest === 'Volunteer' ? styles.badgeVolunteer :
                        reg.interest === 'Organization' ? styles.badgeOrganization :
                        reg.interest === 'Partner' ? styles.badgePartner : ''
                      }`}
                    >
                      {reg.interest}
                    </span>
                  </td>
                  <td>{new Date(reg.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.loading}>
          <h3>No matching launching-soon registrations found.</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Try clearing your search query or filter options.</p>
        </div>
      )}
    </div>
  );
}
