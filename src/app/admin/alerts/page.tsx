'use client';

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  AlertCircle,
  Megaphone
} from 'lucide-react';
import styles from './page.module.css';

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    text: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/alerts');
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load ticker alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ text: '' });
    setError('');
    setIsFormOpen(true);
  };

  const handleEdit = (alertItem: any) => {
    setEditingId(alertItem.id);
    setFormData({ text: alertItem.text || '' });
    setError('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this ticker alert entry?')) return;

    try {
      const res = await fetch(`/api/admin/alerts/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete');
      }
      fetchAlerts();
    } catch (err: any) {
      alert(err.message || 'Error deleting ticker alert');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const url = editingId ? `/api/admin/alerts/${editingId}` : '/api/admin/alerts';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save ticker alert');

      setIsFormOpen(false);
      fetchAlerts();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving alert');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <Radio className={styles.headerIcon} size={28} />
          <div>
            <h1>Live Alert Ticker</h1>
            <p>Manage the emergency alert messages displayed in the rolling marquee across the top of the homepage.</p>
          </div>
        </div>
        <button onClick={handleAddNew} className={styles.addBtn}>
          <Plus size={16} />
          Publish Alert
        </button>
      </div>

      {/* Main List Table */}
      {loading ? (
        <div className={styles.loadingBlock}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Syncing live marquee alert feeds...</span>
        </div>
      ) : alerts.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Icon</th>
                <th>Alert Notification Text</th>
                <th>Published Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((item) => (
                <tr key={item.id} className={styles.tableRow}>
                  <td className={styles.iconCell}>
                    <Megaphone size={16} className={styles.megaphoneIcon} />
                  </td>
                  <td>
                    <div className={styles.alertCell}>
                      <span className={styles.alertText}>{item.text}</span>
                    </div>
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
                      <button 
                        onClick={() => handleEdit(item)} 
                        className={styles.editBtn}
                        title="Edit Alert"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className={styles.deleteBtn}
                        title="Delete Alert"
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
          <h3>No ticker alerts found.</h3>
          <p>Click "Publish Alert" to write an alert announcement to be displayed on the homepage marquee.</p>
        </div>
      )}

      {/* Form Overlay Modal */}
      {isFormOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'Edit Ticker Alert' : 'Publish New Marquee Alert'}</h2>
              <button onClick={() => setIsFormOpen(false)} className={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className={styles.modalError}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                {/* Alert Text */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
                  <label htmlFor="text">Alert Text Message</label>
                  <textarea
                    id="text"
                    name="text"
                    required
                    rows={3}
                    value={formData.text}
                    onChange={handleInputChange}
                    placeholder="e.g. Cyclone Alert: Bay of Bengal — Category 2 system tracking towards Odisha coast..."
                    className={styles.textareaField}
                  />
                  <span className={styles.fieldHelp}>
                    Keep alert text concise. Short, actionable summaries are recommended for the rolling marquee.
                  </span>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsFormOpen(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className={styles.spinner} />
                      Publishing...
                    </>
                  ) : (
                    editingId ? 'Save Changes' : 'Publish Alert'
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
