'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Radio, 
  Trash2, 
  CheckSquare, 
  Globe, 
  Clock, 
  X, 
  Loader2, 
  AlertCircle,
  Newspaper,
  BookOpen,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import styles from './page.module.css';

export default function AdminScrapeQueue() {
  const [activeTab, setActiveTab] = useState<'Pending' | 'Published' | 'Rejected'>('Pending');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [publishingItem, setPublishingItem] = useState<any>(null);
  const [pubType, setPubType] = useState<'News' | 'Report'>('News');
  const [formData, setFormData] = useState({
    headline: '',
    excerpt: '',
    category: 'disasters',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    source: '',
    externalLink: '',
    author: '',
    // Report specific
    pageCount: '12',
    year: new Date().getFullYear().toString(),
    downloadUrl: '#'
  });
  
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/scrape?status=${activeTab}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load scraper queue:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleOpenPublish = (item: any) => {
    setPublishingItem(item);
    
    // Attempt to match standard categories
    const suggestedCategory = item.category || 'disasters';
    
    setFormData({
      headline: item.headline || '',
      excerpt: item.excerpt || '',
      category: suggestedCategory,
      imageUrl: item.image_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      source: item.source || 'Scraped Alert',
      externalLink: item.url || '',
      author: '',
      pageCount: '12',
      year: new Date().getFullYear().toString(),
      downloadUrl: item.url || '#'
    });
    setPubType('News');
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishingItem) return;
    
    setIsProcessing(true);
    try {
      const payload = {
        scrapedId: publishingItem.id,
        action: 'publish',
        publishType: pubType,
        ...formData
      };

      const res = await fetch('/api/admin/scrape/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to publish');
      
      setPublishingItem(null);
      fetchQueue();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error publishing content item.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to reject this item? It will be removed from the review queue.')) return;

    try {
      const res = await fetch('/api/admin/scrape/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrapedId: id,
          action: 'reject'
        })
      });

      if (!res.ok) throw new Error('Failed to reject');
      fetchQueue();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error rejecting queue item.');
    }
  };

  const handleUnpublish = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to unpublish this item? It will be removed from the live website and restored to the review queue.')) return;

    try {
      const res = await fetch('/api/admin/scrape/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrapedId: id,
          action: 'unpublish'
        })
      });

      if (!res.ok) throw new Error('Failed to unpublish');
      fetchQueue();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error unpublishing item.');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await fetch('/api/admin/scrape/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrapedId: id,
          action: 'restore'
        })
      });

      if (!res.ok) throw new Error('Failed to restore');
      fetchQueue();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error restoring item.');
    }
  };

  const handleDeletePermanently = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to permanently delete this item from the database? This action is irreversible.')) return;

    try {
      const res = await fetch('/api/admin/scrape/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrapedId: id,
          action: 'delete'
        })
      });

      if (!res.ok) throw new Error('Failed to delete');
      fetchQueue();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error deleting item.');
    }
  };

  return (
    <div className={styles.page}>
      {/* Title */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <Radio className={styles.headerIcon} size={28} />
          <div>
            <h1>Web Scraper Review Queue</h1>
            <p>Inspect warnings and alerts retrieved by automated indexing, categorize text, and deploy to live feeds.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button 
          onClick={() => setActiveTab('Pending')} 
          className={`${styles.tabButton} ${activeTab === 'Pending' ? styles.tabButtonActive : ''}`}
        >
          <Clock size={15} />
          Pending Review ({items.length && activeTab === 'Pending' ? items.length : '0'})
        </button>
        <button 
          onClick={() => setActiveTab('Published')} 
          className={`${styles.tabButton} ${activeTab === 'Published' ? styles.tabButtonActive : ''}`}
        >
          <CheckSquare size={15} />
          Published Live ({items.length && activeTab === 'Published' ? items.length : '0'})
        </button>
        <button 
          onClick={() => setActiveTab('Rejected')} 
          className={`${styles.tabButton} ${activeTab === 'Rejected' ? styles.tabButtonActive : ''}`}
        >
          <Trash2 size={15} />
          Rejected List ({items.length && activeTab === 'Rejected' ? items.length : '0'})
        </button>
      </div>

      {/* Main Staged Grid */}
      {loading ? (
        <div className={styles.loadingBlock}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Refreshing scraper telemetry queue...</span>
        </div>
      ) : items.length > 0 ? (
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.feedSource}>
                  <Globe size={13} />
                  <span>{item.source}</span>
                </div>
                {activeTab === 'Pending' && (
                  <span className={styles.suggestedCat}>
                    Suggested: {item.category}
                  </span>
                )}
                {activeTab === 'Published' && (
                  <span className={styles.liveBadge}>
                    Live: {item.published_type}
                  </span>
                )}
                {activeTab === 'Rejected' && (
                  <span className={styles.rejectedBadge}>
                    Rejected
                  </span>
                )}
              </div>
              
              <div className={styles.cardBody} style={{ minHeight: '85px' }}>
                {item.image_url && (
                  // eslint-disable-next-line
                  <img 
                    src={item.image_url} 
                    alt="scraped thumbnail" 
                    style={{ width: '100px', height: '68px', objectFit: 'cover', borderRadius: '6px', float: 'right', marginLeft: '12px', border: '1px solid rgba(255,255,255,0.06)' }} 
                  />
                )}
                <h3>{item.headline}</h3>
                <p>{item.excerpt?.substring(0, 240)}...</p>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.scrapeDate}>
                  <Clock size={12} />
                  <span>
                    Staged {new Date(item.scrape_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {/* Dynamic Actions Based on activeTab */}
                <div className={styles.actionRow}>
                  {activeTab === 'Pending' && (
                    <>
                      <button 
                        onClick={() => handleReject(item.id)} 
                        className={styles.rejectBtn}
                        title="Reject and discard"
                      >
                        <Trash2 size={13} /> Reject
                      </button>
                      <button 
                        onClick={() => handleOpenPublish(item)} 
                        className={styles.approveBtn}
                        title="Publish to Live feeds"
                      >
                        <CheckSquare size={13} /> Publish...
                      </button>
                    </>
                  )}

                  {activeTab === 'Published' && (
                    <button 
                      onClick={() => handleUnpublish(item.id)} 
                      className={styles.rejectBtn}
                      title="Unpublish item and restore to queue"
                    >
                      <X size={13} /> Unpublish
                    </button>
                  )}

                  {activeTab === 'Rejected' && (
                    <>
                      <button 
                        onClick={() => handleDeletePermanently(item.id)} 
                        className={styles.rejectBtn}
                        title="Delete permanently from database"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                      <button 
                        onClick={() => handleRestore(item.id)} 
                        className={styles.approveBtn}
                        title="Restore to pending review queue"
                      >
                        <RotateCcw size={13} /> Restore
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <AlertCircle size={36} />
          <h3>No articles found in this status.</h3>
          <p>
            {activeTab === 'Pending' 
              ? 'Go to the Dashboard page and trigger the scraper engine manually to harvest live articles.' 
              : `There are currently no articles marked as ${activeTab.toLowerCase()}.`}
          </p>
        </div>
      )}

      {/* Publish Wizard Drawer/Modal */}
      {publishingItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Approve & Deploy Staged Content</h2>
              <button onClick={() => setPublishingItem(null)} className={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className={styles.modalForm}>
              
              {/* Deploy Target Selection */}
              <div className={styles.deployTargetSelector}>
                <label>Select Deployment Feed Target</label>
                <div className={styles.radioGroup}>
                  <button
                    type="button"
                    className={`${styles.radioBtn} ${pubType === 'News' ? styles.radioBtnActive : ''}`}
                    onClick={() => setPubType('News')}
                  >
                    <Newspaper size={16} />
                    <span>Deploy as News Story</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.radioBtn} ${pubType === 'Report' ? styles.radioBtnActive : ''}`}
                    onClick={() => setPubType('Report')}
                  >
                    <BookOpen size={16} />
                    <span>Deploy as PDF Report</span>
                  </button>
                </div>
              </div>

              {/* Form Input fields */}
              <div className={styles.inputGroup}>
                <label>{pubType === 'News' ? 'Headline Title' : 'Report Title'}</label>
                <input
                  type="text"
                  required
                  value={formData.headline}
                  onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                  className={styles.inputField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>{pubType === 'News' ? 'Excerpt Teaser' : 'Executive Summary Description'}</label>
                <textarea
                  rows={3}
                  required
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  className={styles.textareaField}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>{pubType === 'News' ? 'Category Tag' : 'Report Category'}</label>
                  {pubType === 'News' ? (
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className={styles.selectField}
                    >
                      <option value="breaking">Breaking</option>
                      <option value="environment">Environment</option>
                      <option value="health">Health Crisis</option>
                      <option value="climate">Climate</option>
                      <option value="disasters">Disasters</option>
                      <option value="sustainability">Sustainability</option>
                      <option value="policy">Policy</option>
                    </select>
                  ) : (
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className={styles.selectField}
                    >
                      <option value="Annual">Annual Report</option>
                      <option value="Policy">Policy Brief</option>
                      <option value="CSR">CSR Report</option>
                      <option value="Technical">Technical Audit</option>
                    </select>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label>Origin Attribution Source</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    className={styles.inputField}
                  />
                </div>
              </div>

              {/* News Specific Inputs */}
              {pubType === 'News' && (
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Author</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Editor Desk, disastersnews"
                      className={styles.inputField}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>External URL Link</label>
                    <input
                      type="text"
                      value={formData.externalLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, externalLink: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>
                </div>
              )}

              {/* Report Specific Inputs */}
              {pubType === 'Report' && (
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Release Year</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Page Count</label>
                    <input
                      type="number"
                      value={formData.pageCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, pageCount: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>
                </div>
              )}

              {pubType === 'Report' && (
                <div className={styles.inputGroup}>
                  <label>PDF Download Destination URL</label>
                  <input
                    type="text"
                    value={formData.downloadUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, downloadUrl: e.target.value }))}
                    className={styles.inputField}
                  />
                </div>
              )}

              {/* Image URL Cover */}
              <div className={styles.inputGroup}>
                <label>Visual Cover Image URL</label>
                <div className={styles.iconInputWrap}>
                  <ImageIcon size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className={styles.inputFieldWithIcon}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setPublishingItem(null)} className={styles.cancelBtn}>
                  Discard Review
                </button>
                <button type="submit" disabled={isProcessing} className={styles.saveBtn}>
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className={styles.spinner} />
                      Deploying...
                    </>
                  ) : (
                    'Deploy to Live Feed'
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
