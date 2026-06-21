'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Save, FilePlus, CheckCircle, AlertTriangle, GripVertical } from 'lucide-react';
import styles from './page.module.css';

interface PageItem {
  id?: number;
  slug: string;
  title: string;
  category: string;
  description: string;
  videoUrl?: string;
  imageUrl?: string;
  content: string;
  updatedAt?: string;
}

export default function AdminPagesManager() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Status flags
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('about');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

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

    const reordered = [...pages];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    setPages(reordered);
    setDraggedIndex(null);

    const orderedIds = reordered.map(item => item.id);
    try {
      const res = await fetch('/api/admin/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'cms_pages', orderedIds })
      });
      if (!res.ok) throw new Error('Failed to update display order.');
    } catch (err: any) {
      console.error(err);
      loadPages(selectedPage?.slug); // Revert on failure
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess('');
    setStatus(null);

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
      setStatus({ type: 'error', message: err.message || 'Photo upload failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  const loadPages = async (selectSlug?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/pages');
      if (res.ok) {
        const data = await res.json();
        setPages(data);
        if (data.length > 0) {
          const toSelect = selectSlug 
            ? data.find((p: PageItem) => p.slug === selectSlug) 
            : data[0];
          handleSelectPage(toSelect || data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load CMS pages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleSelectPage = (page: PageItem) => {
    setSelectedPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setCategory(page.category);
    setDescription(page.description || '');
    setVideoUrl(page.videoUrl || '');
    setImageUrl(page.imageUrl || '');
    setContent(page.content || '');
    setStatus(null);
    setUploadSuccess('');
  };

  const handleCreateNew = () => {
    setSelectedPage(null); // Denotes new page mode
    setTitle('');
    setSlug('');
    setCategory('about');
    setDescription('');
    setVideoUrl('');
    setImageUrl('');
    setContent('');
    setStatus(null);
    setUploadSuccess('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setIsSaving(true);

    if (!title || !slug || !category) {
      setStatus({ type: 'error', message: 'Title, Slug, and Category are required.' });
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
          category,
          description,
          videoUrl,
          imageUrl,
          content
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: 'Page content stored successfully.' });
        loadPages(slug);
      } else {
        throw new Error(data.error || 'Failed to save page contents.');
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Error occurred while saving.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && pages.length === 0) {
    return (
      <div className={styles.loadingState}>
        <Loader2 size={36} className={styles.spinner} />
        <span>Syncing Page Cache...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dynamic Page CMS</h1>
          <p className={styles.subtitle}>Modify titles, summaries, video embeds, images, and content of all submenus.</p>
        </div>
        <button className={styles.submitBtn} onClick={handleCreateNew} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FilePlus size={16} />
          Create New Page
        </button>
      </div>

      <div className={styles.workspace}>
        {/* Left: Pages list */}
        <div className={styles.sidebar}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 className={styles.sidebarTitle} style={{ margin: 0 }}>Seeded Pages</h3>
            <select 
              value={displayLimit} 
              onChange={(e) => setDisplayLimit(e.target.value === 'all' ? 9999 : Number(e.target.value))}
              style={{
                backgroundColor: '#121824',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value={10}>10 pages</option>
              <option value={25}>25 pages</option>
              <option value={50}>50 pages</option>
              <option value="all">All pages</option>
            </select>
          </div>
          <div className={styles.pageList}>
            {pages.slice(0, displayLimit).map((p, index) => (
              <div
                key={p.slug}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: draggedIndex === index ? 0.4 : 1,
                  transition: 'opacity 0.2s',
                  cursor: 'grab',
                  marginBottom: '8px'
                }}
              >
                <GripVertical size={14} style={{ color: 'rgba(255, 255, 255, 0.3)', cursor: 'grab', flexShrink: 0 }} />
                <button
                  onClick={() => handleSelectPage(p)}
                  className={`${styles.pageItem} ${selectedPage?.slug === p.slug ? styles.pageItemActive : ''}`}
                  style={{ flex: 1, textAlign: 'left', margin: 0 }}
                  type="button"
                >
                  {p.title}
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                    {p.category} • /{p.slug}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Work Editor Form */}
        <div className={styles.editorWorkspace}>
          <h2 className={styles.editorTitle}>
            {selectedPage ? `Editing: ${selectedPage.title}` : 'Create New Page Node'}
          </h2>

          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Page Title</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Mission & Vision"
                  value={title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTitle(val);
                    if (!selectedPage) {
                      setSlug(
                        val
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '')
                      );
                    }
                  }}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Slug (URL Endpoint)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. mission-vision"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={!!selectedPage} // Read-only for existing to prevent route breakage
                  required
                />
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Parent Category</label>
                <select
                  className={styles.select}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="about">About Us</option>
                  <option value="events">Upcoming Events</option>
                  <option value="insights">Insights & Map</option>
                  <option value="gallery">Gallery</option>
                  <option value="contact">Contact Us</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description / Subtitle</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Enter a brief summary displayed as the subtitle"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>YouTube Video Embed URL (Optional)</label>
                <input
                  type="url"
                  className={styles.input}
                  placeholder="e.g. https://www.youtube.com/embed/XXXXX"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Header Image URL (Optional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Paste image link or upload a file"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      type="file"
                      accept="image/*"
                      id="pages-image-upload"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="pages-image-upload"
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
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Page Content (HTML/Rich-Text Template)</label>
              <textarea
                className={styles.textarea}
                placeholder="Write structured HTML tags like <h3>, <p>, <ul>, <li> to format content beautifully."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {status && (
              <div className={`${styles.statusMessage} ${status.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
                {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span>{status.message}</span>
              </div>
            )}

            <button type="submit" disabled={isSaving} className={styles.submitBtn}>
              {isSaving ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  Saving Page...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Page Node
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
