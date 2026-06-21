'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileArchive, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  Download,
  BookOpen,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import styles from './page.module.css';

function getFriendlyError(err: any, fallback: string): string {
  const msg = err?.message || '';
  if (!msg || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('typeerror') || msg.toLowerCase().includes('database') || msg.toLowerCase().includes('internal server error')) {
    return 'Unable to connect to the server. Please check your network connection and try again.';
  }
  return msg;
}

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Technical',
    description: '',
    page_count: '50',
    year: new Date().getFullYear().toString(),
    download_url: '#',
    accent_color: '#EDF2F8',
    icon: '📙',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfUploadSuccess, setPdfUploadSuccess] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadSuccess, setImageUploadSuccess] = useState('');

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    setPdfUploadSuccess('');
    setError('');

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload PDF');

      setFormData(prev => ({ ...prev, download_url: data.url }));
      setPdfUploadSuccess(file.name);
    } catch (err: any) {
      setError(err.message || 'PDF upload failed.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setImageUploadSuccess('');
    setError('');

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');

      setFormData(prev => ({ ...prev, image_url: data.url }));
      setImageUploadSuccess(file.name);
    } catch (err: any) {
      setError(err.message || 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Shortcut triggers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'new') {
        handleAddNew();
      }
    }
  }, []);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'Technical',
      description: '',
      page_count: '48',
      year: new Date().getFullYear().toString(),
      download_url: '#',
      accent_color: '#EDF2F8',
      icon: '📡',
      image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
    });
    setError('');
    setPdfUploadSuccess('');
    setImageUploadSuccess('');
    setIsFormOpen(true);
  };

  const handleEdit = (report: any) => {
    setEditingId(report.id);
    setFormData({
      title: report.title || '',
      category: report.category || 'Technical',
      description: report.description || '',
      page_count: (report.page_count || 0).toString(),
      year: (report.year || new Date().getFullYear()).toString(),
      download_url: report.download_url || '#',
      accent_color: report.accent_color || '#EDF2F8',
      icon: report.icon || '📙',
      image_url: report.image_url || ''
    });
    setError('');
    setPdfUploadSuccess('');
    setImageUploadSuccess('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to permanently delete this report brief?')) return;

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete');
      fetchReports();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error deleting report');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const url = editingId ? `/api/reports/${editingId}` : '/api/reports';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save report brief');

      setIsFormOpen(false);
      fetchReports();
    } catch (err: any) {
      setError(getFriendlyError(err, 'Error occurred while saving report. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['Annual', 'Policy', 'CSR', 'Technical'];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <FileArchive className={styles.headerIcon} size={28} />
          <div>
            <h1>Research & Publications CRUD</h1>
            <p>Publish and distribute formal policy briefs, annual risk indices, and geospatial audit reports.</p>
          </div>
        </div>
        <button onClick={handleAddNew} className={styles.addBtn}>
          <Plus size={16} />
          Publish PDF Report
        </button>
      </div>

      {/* Main List Table */}
      {loading ? (
        <div className={styles.loadingBlock}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Syncing research registry files...</span>
        </div>
      ) : reports.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Icon</th>
                <th>Report Title</th>
                <th>Category</th>
                <th>Year</th>
                <th>Telemetry Info</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className={styles.tableRow}>
                  <td className={styles.iconCell}>
                    <span className={styles.iconEm}>{report.icon || '📙'}</span>
                  </td>
                  <td>
                    <div className={styles.titleCell}>
                      <span className={styles.titleText}>{report.title}</span>
                      <span className={styles.descText}>{report.description?.substring(0, 120)}...</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.categoryBadge} ${styles['cat' + report.category]}`}>
                      {report.category}
                    </span>
                  </td>
                  <td className={styles.yearCell}>
                    {report.year}
                  </td>
                  <td>
                    <div className={styles.metaCell}>
                      <span>{report.page_count} pages</span>
                      <a href={report.download_url} target="_blank" rel="noopener noreferrer" className={styles.dlLink}>
                        <Download size={10} /> Link
                      </a>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button 
                        onClick={() => handleEdit(report)} 
                        className={styles.editBtn}
                        title="Edit Report Details"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(report.id)} 
                        className={styles.deleteBtn}
                        title="Delete Report"
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
          <h3>No research briefs registered in the database.</h3>
          <p>Click "Publish PDF Report" to log a publication manually.</p>
        </div>
      )}

      {/* Form Overlay Modal */}
      {isFormOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'Edit Research Report' : 'Publish New Research Report'}</h2>
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
                {/* Title */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
                  <label htmlFor="title">Report Title</label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. India Disaster Risk Index 2026 — Annual Report..."
                    className={styles.inputField}
                  />
                </div>

                {/* Description */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
                  <label htmlFor="description">Executive Summary Description</label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Comprehensive ranking of Indian states composite adaptive capacity..."
                    className={styles.textareaField}
                  />
                </div>

                {/* Category & Icon */}
                <div className={styles.inputGroup}>
                  <label htmlFor="category">Report Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={styles.selectField}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="icon">Representative Emoji</label>
                  <input
                    id="icon"
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    placeholder="📙, 🌊, 🌡️, 📡"
                    className={styles.inputField}
                  />
                </div>

                {/* Pages & Year */}
                <div className={styles.inputGroup}>
                  <label htmlFor="page_count">Total Page Count</label>
                  <input
                    id="page_count"
                    type="number"
                    name="page_count"
                    required
                    value={formData.page_count}
                    onChange={handleInputChange}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="year">Release Year</label>
                  <input
                    id="year"
                    type="number"
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleInputChange}
                    className={styles.inputField}
                  />
                </div>

                {/* Download URL / Local Upload */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="download_url">PDF Download URL (S3 / Static / External)</label>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>— OR —</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
                    <div className={styles.iconInputWrap} style={{ width: '100%' }}>
                      <Download size={16} className={styles.inputIcon} />
                      <input
                        id="download_url"
                        type="text"
                        name="download_url"
                        required
                        value={formData.download_url}
                        onChange={handleInputChange}
                        placeholder="https://dcrf.org/publications/risk-index-2026.pdf or uploaded path"
                        className={styles.inputFieldWithIcon}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="file"
                        accept="application/pdf"
                        id="reports-pdf-upload"
                        style={{ display: 'none' }}
                        onChange={handlePdfUpload}
                        disabled={isUploadingPdf}
                      />
                      <label
                        htmlFor="reports-pdf-upload"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '11px 16px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                          transition: 'background-color 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'; }}
                      >
                        {isUploadingPdf ? 'Uploading...' : 'Upload PDF'}
                      </label>
                    </div>
                  </div>
                  {pdfUploadSuccess && (
                    <span style={{ fontSize: '12px', color: '#10b981', display: 'block', marginTop: '2px' }}>
                      ✓ Successfully uploaded: <strong>{pdfUploadSuccess}</strong>
                    </span>
                  )}
                </div>

                {/* Cover Image URL / Local Upload */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="image_url">Visual Cover Image URL</label>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>— OR —</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
                    <div className={styles.iconInputWrap} style={{ width: '100%' }}>
                      <ImageIcon size={16} className={styles.inputIcon} />
                      <input
                        id="image_url"
                        type="text"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleInputChange}
                        placeholder="https://images.unsplash.com/photo-... or uploaded path"
                        className={styles.inputFieldWithIcon}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="file"
                        accept="image/*"
                        id="reports-image-upload"
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                      />
                      <label
                        htmlFor="reports-image-upload"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '11px 16px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                          transition: 'background-color 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'; }}
                      >
                        {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                      </label>
                    </div>
                  </div>
                  {imageUploadSuccess && (
                    <span style={{ fontSize: '12px', color: '#10b981', display: 'block', marginTop: '2px' }}>
                      ✓ Successfully uploaded: <strong>{imageUploadSuccess}</strong>
                    </span>
                  )}
                </div>

                {/* Accent Color & Background parameters */}
                <div className={styles.inputGroup}>
                  <label htmlFor="accent_color">UI Accent Color Hex (Light Tint)</label>
                  <input
                    id="accent_color"
                    type="text"
                    name="accent_color"
                    value={formData.accent_color}
                    onChange={handleInputChange}
                    placeholder="e.g. #FDECEA (Red), #EBF5FB (Blue)"
                    className={styles.inputField}
                  />
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
                      Publishing Brief...
                    </>
                  ) : (
                    editingId ? 'Save Changes' : 'Publish Report'
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
