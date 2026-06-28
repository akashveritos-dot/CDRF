'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Save, Plus, Trash2, CheckCircle, AlertTriangle, Edit3, X } from 'lucide-react';
import styles from './page.module.css';
import ActionLoader from '@/components/ui/ActionLoader/ActionLoader';

interface MapMetadata {
  id: string;
  title: string;
  overview: string;
  info_source: string;
}

interface StateHazard {
  id: string; // state code, e.g. 'dl', 'mh'
  name: string;
  hazard_level: 'High' | 'Medium' | 'Low';
  primary_disaster: string | null;
  affected_count: string | null;
  description: string | null;
}

export default function AdminMapsPage() {
  const [role, setRole] = useState<string>('ADMIN');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Map metadata state
  const [meta, setMeta] = useState<MapMetadata>({
    id: 'india-disaster-risk',
    title: '',
    overview: '',
    info_source: ''
  });

  // State hazards state
  const [hazards, setHazards] = useState<StateHazard[]>([]);
  const [editingHazard, setEditingHazard] = useState<StateHazard | null>(null);
  const [showHazardForm, setShowHazardForm] = useState(false);

  // Individual hazard form fields
  const [stateId, setStateId] = useState('');
  const [stateName, setStateName] = useState('');
  const [hazardLevel, setHazardLevel] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [primaryDisaster, setPrimaryDisaster] = useState('');
  const [affectedCount, setAffectedCount] = useState('');
  const [stateDesc, setStateDesc] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch session
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        if (authData.authenticated && authData.user) {
          setRole(authData.user.role);
        }

        // Fetch Maps metadata & hazards list
        const res = await fetch('/api/admin/maps');
        if (res.ok) {
          const data = await res.json();
          setMeta(data.metadata);
          setHazards(data.hazards);
        } else {
          setErrorMsg('Failed to load Maps configuration.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to connect to database API.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleMetadataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    setActionLoading('Saving map metadata...');

    try {
      const res = await fetch('/api/admin/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveMetadata',
          title: meta.title,
          overview: meta.overview,
          infoSource: meta.info_source
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update map metadata');

      setSuccessMsg('Map details and overview information updated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
      setActionLoading(null);
    }
  };

  const handleHazardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    setActionLoading('Saving hazard record...');

    try {
      const res = await fetch('/api/admin/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveHazard',
          id: stateId.toLowerCase().trim(),
          name: stateName.trim(),
          hazardLevel,
          primaryDisaster: primaryDisaster.trim() || null,
          affectedCount: affectedCount.trim() || null,
          description: stateDesc.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save state hazard details');

      // Refresh list
      const refreshRes = await fetch('/api/admin/maps');
      const refreshData = await refreshRes.json();
      setHazards(refreshData.hazards);

      setSuccessMsg(`Hazard details for "${stateName}" saved successfully!`);
      setShowHazardForm(false);
      setEditingHazard(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
      setActionLoading(null);
    }
  };

  const handleEditHazard = (hazard: StateHazard) => {
    setEditingHazard(hazard);
    setStateId(hazard.id);
    setStateName(hazard.name);
    setHazardLevel(hazard.hazard_level);
    setPrimaryDisaster(hazard.primary_disaster || '');
    setAffectedCount(hazard.affected_count || '');
    setStateDesc(hazard.description || '');
    setShowHazardForm(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleNewHazard = () => {
    setEditingHazard(null);
    setStateId('');
    setStateName('');
    setHazardLevel('Medium');
    setPrimaryDisaster('');
    setAffectedCount('');
    setStateDesc('');
    setShowHazardForm(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleDeleteHazard = async (id: string, name: string) => {
    if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
      alert('Forbidden: Only administrators can delete state hazard details.');
      return;
    }

    if (!confirm(`Are you sure you want to delete the hazard details for state: "${name}"?`)) {
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    setActionLoading('Deleting hazard details...');

    try {
      const res = await fetch(`/api/admin/maps?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete state hazard details');

      setHazards(prev => prev.filter(h => h.id !== id));
      setSuccessMsg(`State "${name}" hazard mappings deleted successfully.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Loading Hazard Map settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 id="maps-admin-title">Manage Hazard Maps</h1>
          <p className={styles.subtitle}>Configure details of interactive disaster maps and individual state telemetry stats.</p>
        </div>
      </div>

      {successMsg && (
        <div className={styles.successAlert}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className={styles.errorAlert}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className={styles.grid}>
        {/* Map Metadata Form */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Map Page Metadata</h2>
          <form onSubmit={handleMetadataSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="map-title">Map Title</label>
              <input
                id="map-title"
                type="text"
                required
                value={meta.title}
                onChange={e => setMeta(prev => ({ ...prev, title: e.target.value }))}
                className={styles.input}
                placeholder="Composite Disaster Risk · India"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="map-overview">Map Overview Description</label>
              <textarea
                id="map-overview"
                rows={4}
                required
                value={meta.overview}
                onChange={e => setMeta(prev => ({ ...prev, overview: e.target.value }))}
                className={styles.textarea}
                placeholder="Overview description shown in the hero header..."
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="map-info-source">Information Source</label>
              <input
                id="map-info-source"
                type="text"
                value={meta.info_source}
                onChange={e => setMeta(prev => ({ ...prev, info_source: e.target.value }))}
                className={styles.input}
                placeholder="e.g. ISRO RISAT, IMD Stations, CWC Streams"
              />
            </div>

            <button type="submit" disabled={submitting} className={styles.submitBtn} id="save-map-metadata-btn">
              {submitting ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
              <span>Save Map Details</span>
            </button>
          </form>
        </div>

        {/* State Hazards Table */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>State Telemetry Records</h2>
            <button onClick={handleNewHazard} className={styles.addBtn} id="add-state-hazard-btn">
              <Plus size={14} />
              <span>Add State</span>
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>State Name</th>
                  <th>Risk</th>
                  <th>Primary Threat</th>
                  <th>Affected</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hazards.map(hazard => (
                  <tr key={hazard.id}>
                    <td>
                      <code className={styles.stateCode}>{hazard.id.toUpperCase()}</code>
                    </td>
                    <td className={styles.stateName}>{hazard.name}</td>
                    <td>
                      <span className={`${styles.riskBadge} ${styles[`risk${hazard.hazard_level}`]}`}>
                        {hazard.hazard_level}
                      </span>
                    </td>
                    <td>{hazard.primary_disaster || 'N/A'}</td>
                    <td>{hazard.affected_count || 'N/A'}</td>
                    <td>
                      <div className={styles.statActions}>
                        <button onClick={() => handleEditHazard(hazard)} disabled={submitting} className={styles.editBtn} aria-label={`Edit ${hazard.name}`}>
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteHazard(hazard.id, hazard.name)}
                          className={`${styles.deleteBtn} ${(role !== 'SUPERADMIN' && role !== 'ADMIN') ? styles.disabledBtn : ''}`}
                          disabled={submitting || role !== 'SUPERADMIN' && role !== 'ADMIN'}
                          title={role !== 'SUPERADMIN' && role !== 'ADMIN' ? 'Only administrators can delete states' : `Delete ${hazard.name}`}
                          aria-label={`Delete ${hazard.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {hazards.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.tableEmpty}>
                      No state telemetry records registered. Click "Add State" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Edit/New State Hazard Form Popup */}
          {showHazardForm && (
            <div className={styles.modalOverlay} onClick={() => setShowHazardForm(false)}>
              <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                <button className={styles.modalClose} onClick={() => setShowHazardForm(false)}>
                  <X size={18} />
                </button>
                <h3>{editingHazard ? `Edit ${stateName}` : 'New State Hazard'}</h3>
                <form onSubmit={handleHazardSubmit} className={styles.modalForm}>
                  <div className={styles.row}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="state-code">State Code (ISO/2-char)</label>
                      <input
                        id="state-code"
                        type="text"
                        required
                        disabled={!!editingHazard}
                        value={stateId}
                        onChange={e => setStateId(e.target.value)}
                        className={styles.input}
                        placeholder="e.g. mh"
                        maxLength={5}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor="state-name-input">State Name</label>
                      <input
                        id="state-name-input"
                        type="text"
                        required
                        value={stateName}
                        onChange={e => setStateName(e.target.value)}
                        className={styles.input}
                        placeholder="e.g. Maharashtra"
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="hazard-level-select">Hazard Level</label>
                      <select
                        id="hazard-level-select"
                        value={hazardLevel}
                        onChange={e => setHazardLevel(e.target.value as any)}
                        className={styles.input}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor="primary-threat-input">Primary Threat</label>
                      <input
                        id="primary-threat-input"
                        type="text"
                        value={primaryDisaster}
                        onChange={e => setPrimaryDisaster(e.target.value)}
                        className={styles.input}
                        placeholder="e.g. Cyclone Tauktae"
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="affected-count-input">Affected / Economic Metric</label>
                    <input
                      id="affected-count-input"
                      type="text"
                      value={affectedCount}
                      onChange={e => setAffectedCount(e.target.value)}
                      className={styles.input}
                      placeholder="e.g. 1.2M affected / $240M loss"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="state-desc-input">Hazard Description</label>
                    <textarea
                      id="state-desc-input"
                      rows={3}
                      value={stateDesc}
                      onChange={e => setStateDesc(e.target.value)}
                      className={styles.textarea}
                      placeholder="Brief details about state alerts, forecasts, and warning systems..."
                    />
                  </div>

                  <button type="submit" disabled={submitting} className={styles.submitBtn} id="state-hazard-save-submit-btn">
                    {submitting ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
                    <span>Save Hazard Record</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      <ActionLoader message={actionLoading} />
    </div>
  );
}
