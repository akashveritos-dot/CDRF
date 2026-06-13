'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Newspaper, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  Image as ImageIcon,
  Calendar,
  User,
  Globe,
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

export default function AdminNews() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    tag: 'Breaking',
    source: 'disastersnews.com',
    headline: '',
    excerpt: '',
    full_content: '',
    published_date: '',
    author: 'disastersnews.com',
    external_link: '',
    thumbnail_emoji: '📰',
    image_url: '',
    category: 'disasters'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchStories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      setStories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Check query string parameters to trigger New Form instantly (e.g. from Dashboard shortcut)
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
      tag: 'Alert',
      source: 'dcrf.org',
      headline: '',
      excerpt: '',
      full_content: '',
      published_date: new Date().toISOString().split('T')[0],
      author: 'Editor Desk, DCRF',
      external_link: '',
      thumbnail_emoji: '🚨',
      image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      category: 'disasters'
    });
    setError('');
    setIsFormOpen(true);
  };

  const handleEdit = (story: any) => {
    setEditingId(story.id);
    
    // Map backend published_date format
    let dateStr = '';
    if (story.published_date) {
      dateStr = new Date(story.published_date).toISOString().split('T')[0];
    }

    setFormData({
      tag: story.tag || 'Breaking',
      source: story.source || 'disastersnews.com',
      headline: story.headline || '',
      excerpt: story.excerpt || '',
      full_content: story.full_content || '',
      published_date: dateStr,
      author: story.author || 'disastersnews.com',
      external_link: story.external_link || '',
      thumbnail_emoji: story.thumbnail_emoji || '📰',
      image_url: story.image_url || '',
      category: story.category || 'disasters'
    });
    setError('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this news story?')) return;

    try {
      const res = await fetch(`/api/news/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete');
      fetchStories();
    } catch (err) {
      alert('Error deleting news story');
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
      const url = editingId ? `/api/news/${editingId}` : '/api/news';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save news story');

      setIsFormOpen(false);
      fetchStories();
    } catch (err: any) {
      setError(getFriendlyError(err, 'Error occurred while saving news. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['breaking', 'environment', 'health', 'climate', 'disasters', 'sustainability', 'policy'];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <Newspaper className={styles.headerIcon} size={28} />
          <div>
            <h1>Dynamic News Editor</h1>
            <p>Publish emergency alerts, climate bulletins, and syndicate partner feeds.</p>
          </div>
        </div>
        <button onClick={handleAddNew} className={styles.addBtn}>
          <Plus size={16} />
          Create News Story
        </button>
      </div>

      {/* Main List Table */}
      {loading ? (
        <div className={styles.loadingBlock}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Syncing news feed articles...</span>
        </div>
      ) : stories.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Emoji</th>
                <th>Headline</th>
                <th>Author & Source</th>
                <th>Category</th>
                <th>Published Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((story) => (
                <tr key={story.id} className={styles.tableRow}>
                  <td className={styles.emojiCell}>{story.thumbnail_emoji || '📰'}</td>
                  <td>
                    <div className={styles.headlineCell}>
                      <span className={styles.headlineText}>{story.headline}</span>
                      <span className={styles.excerptText}>{story.excerpt?.substring(0, 120)}...</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.sourceCell}>
                      <span className={styles.authorName}>{story.author}</span>
                      <span className={styles.sourceName}>{story.source}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.categoryBadge} ${styles['cat' + story.category]}`}>
                      {story.category}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {story.date}
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button 
                        onClick={() => handleEdit(story)} 
                        className={styles.editBtn}
                        title="Edit Article"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(story.id)} 
                        className={styles.deleteBtn}
                        title="Delete Article"
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
          <h3>No stories registered in the feed database.</h3>
          <p>Click "Create News Story" to write an editorial piece manually, or trigger the scraping engine.</p>
        </div>
      )}

      {/* Form Overlay Modal */}
      {isFormOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'Edit News Story' : 'Create New News Story'}</h2>
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
                {/* Headline */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
                  <label htmlFor="headline">Headline Title</label>
                  <input
                    id="headline"
                    type="text"
                    name="headline"
                    required
                    value={formData.headline}
                    onChange={handleInputChange}
                    placeholder="e.g. 5.6 Magnitude Earthquake Strikes Himalayan Region..."
                    className={styles.inputField}
                  />
                </div>

                {/* Excerpt */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
                  <label htmlFor="excerpt">Short Excerpt / Summary</label>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    required
                    rows={2}
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    placeholder="Brief 2-3 sentence teaser summarizing the incident..."
                    className={styles.textareaField}
                  />
                </div>

                {/* Tag & Category */}
                <div className={styles.inputGroup}>
                  <label htmlFor="tag">Badge Tag</label>
                  <input
                    id="tag"
                    type="text"
                    name="tag"
                    value={formData.tag}
                    onChange={handleInputChange}
                    placeholder="e.g. Breaking, Alert, Climate"
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="category">Resilience Category</label>
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

                {/* Author & Source */}
                <div className={styles.inputGroup}>
                  <label htmlFor="author">Author Attribution</label>
                  <div className={styles.iconInputWrap}>
                    <User size={16} className={styles.inputIcon} />
                    <input
                      id="author"
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      className={styles.inputFieldWithIcon}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="source">Source Website</label>
                  <div className={styles.iconInputWrap}>
                    <Globe size={16} className={styles.inputIcon} />
                    <input
                      id="source"
                      type="text"
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      className={styles.inputFieldWithIcon}
                    />
                  </div>
                </div>

                {/* Date & Emoji */}
                <div className={styles.inputGroup}>
                  <label htmlFor="published_date">Publish Date</label>
                  <div className={styles.iconInputWrap}>
                    <Calendar size={16} className={styles.inputIcon} />
                    <input
                      id="published_date"
                      type="date"
                      name="published_date"
                      value={formData.published_date}
                      onChange={handleInputChange}
                      className={styles.inputFieldWithIcon}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="thumbnail_emoji">Cover Emoji</label>
                  <input
                    id="thumbnail_emoji"
                    type="text"
                    name="thumbnail_emoji"
                    value={formData.thumbnail_emoji}
                    onChange={handleInputChange}
                    placeholder="🚨, 🌋, 🌊"
                    className={styles.inputField}
                  />
                </div>

                {/* Image URL */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
                  <label htmlFor="image_url">Visual Cover Image URL (Unsplash/Static)</label>
                  <div className={styles.iconInputWrap}>
                    <ImageIcon size={16} className={styles.inputIcon} />
                    <input
                      id="image_url"
                      type="text"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      placeholder="https://images.unsplash.com/photo-..."
                      className={styles.inputFieldWithIcon}
                    />
                  </div>
                </div>

                {/* External Link */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
                  <label htmlFor="external_link">Full Story External Link (Optional)</label>
                  <input
                    id="external_link"
                    type="text"
                    name="external_link"
                    value={formData.external_link}
                    onChange={handleInputChange}
                    placeholder="https://disastersnews.com/story-details"
                    className={styles.inputField}
                  />
                </div>

                {/* Full HTML Content */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
                  <label htmlFor="full_content">Full Detailed Article Content (Markdown/Text)</label>
                  <textarea
                    id="full_content"
                    name="full_content"
                    rows={4}
                    value={formData.full_content}
                    onChange={handleInputChange}
                    placeholder="Complete detailed updates on safety advisories, statistics, relief numbers..."
                    className={styles.textareaField}
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
                      Publishing...
                    </>
                  ) : (
                    editingId ? 'Save Changes' : 'Publish Story'
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
