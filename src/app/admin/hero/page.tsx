'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Save, Plus, Trash2, CheckCircle, AlertTriangle, Edit3, X, Upload } from 'lucide-react';
import styles from './page.module.css';

interface HeroSettings {
  eyebrow: string;
  title: string;
  subtitle: string;
  image_url: string;
  video_url: string | null;
  button_text: string;
  button_url: string;
}

interface StripStat {
  id?: number;
  label: string;
  count: number;
  suffix: string;
  display_order: number;
}

export default function AdminHeroPage() {
  const [role, setRole] = useState<string>('ADMIN');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Hero settings form state
  const [settings, setSettings] = useState<HeroSettings>({
    eyebrow: '',
    title: '',
    subtitle: '',
    image_url: '',
    video_url: null,
    button_text: '',
    button_url: ''
  });

  // Strip stats state
  const [stats, setStats] = useState<StripStat[]>([]);
  const [editingStat, setEditingStat] = useState<StripStat | null>(null);
  const [showStatForm, setShowStatForm] = useState(false);
  const [statLabel, setStatLabel] = useState('');
  const [statCount, setStatCount] = useState<number>(0);
  const [statSuffix, setStatSuffix] = useState('+');
  const [statOrder, setStatOrder] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch session
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        if (authData.authenticated && authData.user) {
          setRole(authData.user.role);
        }

        // Fetch Hero settings & stats
        const res = await fetch('/api/admin/hero');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
          setStats(data.stats);
        } else {
          setErrorMsg('Failed to load Hero settings.');
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

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSettings',
          eyebrow: settings.eyebrow,
          title: settings.title,
          subtitle: settings.subtitle,
          imageUrl: settings.image_url,
          videoUrl: settings.video_url,
          buttonText: settings.button_text,
          buttonUrl: settings.button_url
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setSuccessMsg('Hero Section text and styling updated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveStat',
          id: editingStat?.id,
          label: statLabel,
          count: Number(statCount),
          suffix: statSuffix,
          displayOrder: Number(statOrder)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save statistics card');

      // Refresh list
      const refreshRes = await fetch('/api/admin/hero');
      const refreshData = await refreshRes.json();
      setStats(refreshData.stats);

      setSuccessMsg(`Statistic card "${statLabel}" saved successfully!`);
      setShowStatForm(false);
      setEditingStat(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStat = (stat: StripStat) => {
    setEditingStat(stat);
    setStatLabel(stat.label);
    setStatCount(stat.count);
    setStatSuffix(stat.suffix);
    setStatOrder(stat.display_order);
    setShowStatForm(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleNewStat = () => {
    setEditingStat(null);
    setStatLabel('');
    setStatCount(0);
    setStatSuffix('+');
    setStatOrder(stats.length);
    setShowStatForm(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleDeleteStat = async (id: number, label: string) => {
    if (role !== 'SUPERADMIN') {
      alert('Forbidden: Only Super Admins can delete statistics cards.');
      return;
    }

    if (!confirm(`Are you sure you want to delete the statistic card: "${label}"?`)) {
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/admin/hero?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete stat card');

      setStats(prev => prev.filter(s => s.id !== id));
      setSuccessMsg(`Statistic card "${label}" deleted successfully.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSettings(prev => ({ ...prev, image_url: data.url }));
      setSuccessMsg('Background image uploaded successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Loading Hero Management configurations...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 id="hero-admin-title">Manage Hero Section</h1>
          <p className={styles.subtitle}>Configure the homepage Hero titles, backgrounds, buttons, and metrics strip numbers.</p>
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
        {/* Settings Form */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Hero Presentation & Call to Action</h2>
          <form onSubmit={handleSettingsSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="eyebrow">Hero Eyebrow Text</label>
              <input
                id="eyebrow"
                type="text"
                value={settings.eyebrow}
                onChange={e => setSettings(prev => ({ ...prev, eyebrow: e.target.value }))}
                className={styles.input}
                placeholder="e.g. Founded 2026 • New Delhi, India"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="title">Hero Title (Press Enter for line breaks. "Resilience" is automatically italicized)</label>
              <textarea
                id="title"
                rows={3}
                value={settings.title}
                onChange={e => setSettings(prev => ({ ...prev, title: e.target.value }))}
                className={styles.textarea}
                required
                placeholder={"Building Resilience\nThrough Knowledge,\nConvergence & Action"}
              />
              <p className={styles.hint}>
                Press Enter naturally for line breaks. The word "Resilience" will be automatically highlighted and italicized on the homepage.
              </p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="subtitle">Hero Subtitle</label>
              <textarea
                id="subtitle"
                rows={3}
                value={settings.subtitle}
                onChange={e => setSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                className={styles.textarea}
                required
                placeholder="Description of the federation's mission..."
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Background Image URL / Upload</label>
              <div className={styles.uploadRow}>
                <input
                  type="text"
                  value={settings.image_url}
                  onChange={e => setSettings(prev => ({ ...prev, image_url: e.target.value }))}
                  className={styles.input}
                  placeholder="/hero_background.jpg"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  id="bg-image-upload-btn"
                >
                  {uploading ? <Loader2 size={14} className={styles.spinner} /> : <Upload size={14} />}
                  <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                </button>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label htmlFor="btn-text">CTA Button Text</label>
                <input
                  id="btn-text"
                  type="text"
                  value={settings.button_text || ''}
                  onChange={e => setSettings(prev => ({ ...prev, button_text: e.target.value }))}
                  className={styles.input}
                  placeholder="Join the Resilience Movement"
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="btn-url">CTA Button Link</label>
                <input
                  id="btn-url"
                  type="text"
                  value={settings.button_url || ''}
                  onChange={e => setSettings(prev => ({ ...prev, button_url: e.target.value }))}
                  className={styles.input}
                  placeholder="/membership#join"
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} className={styles.submitBtn} id="hero-settings-save-btn">
              {submitting ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
              <span>Save Hero Presentation</span>
            </button>
          </form>
        </div>

        {/* Stats Strip List */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>Hero Strip Statistics</h2>
            <button onClick={handleNewStat} className={styles.addBtn} id="add-hero-stat-btn">
              <Plus size={14} />
              <span>Add Stat</span>
            </button>
          </div>

          <p className={styles.hint}>Configure the 4 numeric badges shown horizontally directly under the homepage Hero section.</p>

          <div className={styles.statsList}>
            {stats.map(stat => (
              <div key={stat.id} className={styles.statItem}>
                <div className={styles.statDetails}>
                  <span className={styles.statBadge}>
                    {stat.count}
                    {stat.suffix}
                  </span>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <span className={styles.statOrder}>Order: {stat.display_order}</span>
                </div>
                <div className={styles.statActions}>
                  <button onClick={() => handleEditStat(stat)} className={styles.editBtn} aria-label={`Edit ${stat.label}`}>
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteStat(stat.id!, stat.label)}
                    className={`${styles.deleteBtn} ${role !== 'SUPERADMIN' ? styles.disabledBtn : ''}`}
                    disabled={role !== 'SUPERADMIN'}
                    title={role !== 'SUPERADMIN' ? 'Only Super Admin can delete stats' : `Delete ${stat.label}`}
                    aria-label={`Delete ${stat.label}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {stats.length === 0 && (
              <div className={styles.emptyState}>No statistics registered. Click "Add Stat" to create one.</div>
            )}
          </div>

          {/* Edit/New Stat Form popup */}
          {showStatForm && (
            <div className={styles.modalOverlay} onClick={() => setShowStatForm(false)}>
              <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                <button className={styles.modalClose} onClick={() => setShowStatForm(false)}>
                  <X size={18} />
                </button>
                <h3>{editingStat ? 'Edit Stat Card' : 'New Stat Card'}</h3>
                <form onSubmit={handleStatSubmit} className={styles.modalForm}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="stat-label">Stat Label</label>
                    <input
                      id="stat-label"
                      type="text"
                      required
                      value={statLabel}
                      onChange={e => setStatLabel(e.target.value)}
                      className={styles.input}
                      placeholder="e.g. Active Incidents"
                    />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="stat-count">Count (Number)</label>
                      <input
                        id="stat-count"
                        type="number"
                        required
                        value={statCount}
                        onChange={e => setStatCount(Number(e.target.value))}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor="stat-suffix">Suffix</label>
                      <input
                        id="stat-suffix"
                        type="text"
                        value={statSuffix}
                        onChange={e => setStatSuffix(e.target.value)}
                        className={styles.input}
                        placeholder="e.g. +"
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="stat-order">Display Order</label>
                    <input
                      id="stat-order"
                      type="number"
                      required
                      value={statOrder}
                      onChange={e => setStatOrder(Number(e.target.value))}
                      className={styles.input}
                    />
                  </div>

                  <button type="submit" disabled={submitting} className={styles.submitBtn} id="stat-save-submit-btn">
                    {submitting ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
                    <span>Save Badges</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
