'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, CheckCircle, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import styles from './page.module.css';

interface GalleryItem {
  id: number;
  imageUrl: string;
  caption: string;
  content?: string;
  createdAt: string;
}

export default function AdminGalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form fields
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [content, setContent] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

    if (!imageUrl || !caption) {
      setError('Image URL and Caption are required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, caption, content })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setImageUrl('');
        setCaption('');
        setContent('');
        loadGallery();
      } else {
        throw new Error(data.error || 'Failed to add gallery item.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this gallery item? This action is irreversible.')) {
      return;
    }

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
              <input
                type="url"
                className={styles.input}
                placeholder="e.g. https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
              />
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
          <h2 className={styles.sectionTitle}>Staged Photographs</h2>
          
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
              {items.map((item) => (
                <div key={item.id} className={styles.photoCard}>
                  <div className={styles.photoWrapper}>
                    <img
                      src={item.imageUrl}
                      alt={item.caption}
                      className={styles.photo}
                    />
                  </div>
                  <div className={styles.photoInfo}>
                    <h4 className={styles.photoCaption}>{item.caption}</h4>
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
    </div>
  );
}
