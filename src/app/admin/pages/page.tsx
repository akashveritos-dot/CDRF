'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Save, FilePlus, CheckCircle, AlertTriangle } from 'lucide-react';
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
          <h3 className={styles.sidebarTitle}>Seeded Pages</h3>
          <div className={styles.pageList}>
            {pages.map((p) => (
              <button
                key={p.slug}
                onClick={() => handleSelectPage(p)}
                className={`${styles.pageItem} ${selectedPage?.slug === p.slug ? styles.pageItemActive : ''}`}
              >
                {p.title}
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                  {p.category} • /{p.slug}
                </div>
              </button>
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
                  onChange={(e) => setTitle(e.target.value)}
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
                <input
                  type="url"
                  className={styles.input}
                  placeholder="e.g. https://images.unsplash.com/photo-XXXX"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
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
