'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, CheckCircle, AlertTriangle, Image as ImageIcon, GripVertical } from 'lucide-react';
import styles from './page.module.css';
import ActionLoader from '@/components/ui/ActionLoader/ActionLoader';

interface GalleryItem {
  id: number;
  imageUrl: string;
  caption: string;
  content?: string;
  designation?: string;
  personName?: string;
  createdAt: string;
}

export default function AdminGalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form fields
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [content, setContent] = useState('');
  const [designation, setDesignation] = useState('');
  const [personName, setPersonName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess('');
    setError('');
    setActionLoading('Uploading photo...');

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload photo');

      setImageUrl(data.url);
      setUploadSuccess(file.name);
    } catch (err: any) {
      setError(err.message || 'Photo upload failed.');
    } finally {
      setIsUploading(false);
      setActionLoading(null);
    }
  };

  // Drag-and-drop / display limit states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [displayLimit, setDisplayLimit] = useState(25);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reordered = [...items];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    setItems(reordered);
    setDraggedIndex(null);

    const orderedIds = reordered.map(item => item.id);
    setActionLoading('Reordering photos...');
    try {
      const res = await fetch('/api/admin/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'gallery_items', orderedIds })
      });
      if (!res.ok) throw new Error('Failed to update display order.');
    } catch (err: any) {
      console.error(err);
      loadGallery(); // Revert on failure
    } finally {
      setActionLoading(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to load gallery items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);
    setActionLoading('Adding photo to gallery...');

    if (!imageUrl || !caption) {
      setError('Image URL and Caption are required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, caption, content, designation, personName })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setImageUrl('');
        setCaption('');
        setContent('');
        setDesignation('');
        setPersonName('');
        setUploadSuccess('');
        loadGallery();
      } else {
        throw new Error(data.error || 'Failed to add gallery item.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving item.');
    } finally {
      setIsSubmitting(false);
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this gallery item? This action is irreversible.')) {
      return;
    }

    setActionLoading('Deleting gallery photo...');
    try {
      const res = await fetch(`/api/admin/gallery?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        loadGallery();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete gallery item.');
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('An error occurred during deletion.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Photo Gallery CMS</h1>
        <p className={styles.subtitle}>Upload deployment photographs and write captions for the public gallery showcase.</p>
      </div>

      <div className={styles.grid}>
        {/* Left Column: Form Card */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Add New Photo</h3>
          
          <form onSubmit={handleAddPhoto} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Image URL</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Paste image link or upload a file"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  required
                />
                <div style={{ position: 'relative' }}>
                  <input
                    type="file"
                    accept="image/*"
                    id="gallery-photo-upload"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="gallery-photo-upload"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      height: '38px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      backgroundColor: '#121824',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.backgroundColor = '#1e293b';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.backgroundColor = '#121824';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                  </label>
                </div>
              </div>
              {uploadSuccess && (
                <span style={{ fontSize: '11px', color: '#10b981', display: 'block', marginTop: '2px' }}>
                  ✓ Uploaded: <strong>{uploadSuccess}</strong>
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Caption / Title</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Early Warning Installation"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Designation (Optional)</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Lead Researcher, Coordinator"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Person Name (Optional)</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Dr. Jane Smith"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Description Content (Optional)</label>
              <textarea
                className={styles.textarea}
                placeholder="Describe details regarding this field deployment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {error && (
              <div className={styles.errorText}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{ color: 'var(--accessible-green)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} />
                <span>Photo added to gallery database!</span>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Photo to Gallery
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Gallery List */}
        <div className={styles.gallerySection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Staged Photographs</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Show limit:</span>
              <select 
                value={displayLimit} 
                onChange={(e) => setDisplayLimit(e.target.value === 'all' ? 9999 : Number(e.target.value))}
                style={{
                  backgroundColor: '#121824',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value={10}>10 photos</option>
                <option value={25}>25 photos</option>
                <option value={50}>50 photos</option>
                <option value="all">All photos</option>
              </select>
            </div>
          </div>
          
          {isLoading && items.length === 0 ? (
            <div className={styles.loadingWrapper}>
              <Loader2 size={24} className={styles.spinner} />
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <ImageIcon size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No photographs found in the database.</p>
            </div>
          ) : (
            <div className={styles.photoGrid}>
              {items.slice(0, displayLimit).map((item, index) => (
                <div 
                  key={item.id} 
                  className={styles.photoCard}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    opacity: draggedIndex === index ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                    cursor: 'grab'
                  }}
                >
                  <div className={styles.photoWrapper}>
                    <img
                      src={item.imageUrl}
                      alt={item.caption}
                      className={styles.photo}
                    />
                  </div>
                  <div className={styles.photoInfo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 className={styles.photoCaption} style={{ margin: 0 }}>{item.caption}</h4>
                      <GripVertical size={14} style={{ color: 'rgba(255, 255, 255, 0.3)', cursor: 'grab' }} />
                    </div>
                    {(item.designation || item.personName) && (
                      <p style={{ margin: '0 0 8px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', textAlign: 'left' }}>
                        {item.designation && <strong style={{ color: '#ef4444' }}>{item.designation}</strong>}
                        {item.designation && item.personName && ' · '}
                        {item.personName && <span>{item.personName}</span>}
                      </p>
                    )}
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className={styles.deleteBtn}
                    >
                      <Trash2 size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Delete Image
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ActionLoader message={actionLoading} />
    </div>
  );
}
