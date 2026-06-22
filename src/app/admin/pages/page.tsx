'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2, Save, Plus, Trash2, CheckCircle, AlertTriangle,
  Edit3, X, Upload, ChevronDown, ChevronRight, Play, Eye
} from 'lucide-react';
import styles from './page.module.css';

/* ─── Interfaces ─────────────────────────────── */
interface CardItem {
  id?: number;
  sectionId?: number;
  sectionTitle?: string;
  displayOrder: number;
  title: string;
  description: string;
  imageUrl: string;
  linkText: string;
  linkUrl: string;
  extraData: Record<string, any>;
}

interface SectionMeta {
  id: number;
  title: string;
  description: string;
  cardCount: number;
}

interface PageMeta {
  slug: string;
  title: string;
  category: string;
  description: string;
  sections: SectionMeta[];
}

/* ─── File Upload ────────────────────────────── */
function UploadField({
  accept, value, onChange, placeholder
}: {
  accept: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onChange(data.url);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.uploadRow}>
      <input type="text" className={styles.input} placeholder={placeholder}
        value={value} onChange={(e) => onChange(e.target.value)} />
      <input type="file" accept={accept} ref={ref} style={{ display: 'none' }} onChange={handleUpload} />
      <button type="button" className={styles.uploadBtn}
        onClick={() => ref.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 size={13} className={styles.spinner} /> : <Upload size={13} />}
        <span>{uploading ? '...' : 'Upload'}</span>
      </button>
    </div>
  );
}

/* ─── Media Element Player with auto-duration ─── */
function MediaElementPlayer({ url, onDuration }: { url: string; onDuration?: (d: string) => void }) {
  const mediaRef = useRef<HTMLMediaElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurTime] = useState('0:00');
  const [totalTime, setTotalTime] = useState('0:00');
  const [vol, setVol] = useState(80);

  if (!url) return null;

  const isYoutube = url.includes('youtube') || url.includes('youtu.be') || url.includes('embed');
  const embedUrl = isYoutube ? (url.includes('embed') ? url : url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')) : '';

  if (isYoutube && embedUrl) {
    return (
      <div className={styles.videoPreview}>
        <iframe src={embedUrl} title="Video" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }

  const isAudio = url.match(/\.(mp3|wav|ogg|m4a|aac|mp4a)(\?|$)/i) || url.includes('soundhelix') || url.includes('audio');

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleLoaded = () => {
    const media = mediaRef.current;
    if (!media) return;
    const dur = media.duration;
    if (dur && isFinite(dur)) {
      const formatted = fmtTime(dur);
      setTotalTime(formatted);
      if (onDuration) onDuration(formatted);
    }
  };

  const handleTimeUpdate = () => {
    const media = mediaRef.current;
    if (!media || !media.duration) return;
    setProgress((media.currentTime / media.duration) * 100);
    setCurTime(fmtTime(media.currentTime));
  };

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused) {
      media.play().catch(() => {});
      setPlaying(true);
    } else {
      media.pause();
      setPlaying(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const media = mediaRef.current;
    if (!media) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    media.currentTime = pct * media.duration;
  };

  const handleVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVol(val);
    if (mediaRef.current) mediaRef.current.volume = val / 100;
  };

  const handleFullscreen = () => {
    const media = mediaRef.current;
    if (media instanceof HTMLVideoElement && media.requestFullscreen) {
      media.requestFullscreen();
    }
  };

  return (
    <div className={styles.videoPlayerWrap}>
      {isAudio ? (
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={url}
          onLoadedMetadata={handleLoaded}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPlaying(false)}
          className={styles.audioElement}
          style={{ width: '100%', display: 'block', outline: 'none', padding: '10px 0' }}
        />
      ) : (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={url}
          onLoadedMetadata={handleLoaded}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPlaying(false)}
          onClick={togglePlay}
          className={styles.videoElement}
        />
      )}
      <div className={styles.videoControls}>
        <button type="button" className={styles.vcBtn} onClick={togglePlay}>
          {playing ? <span>⏸</span> : <Play size={14} />}
        </button>
        <span className={styles.vcTime}>{currentTime}</span>
        <div className={styles.vcSeek} onClick={handleSeek}>
          <div className={styles.vcSeekFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.vcTime}>{totalTime}</span>
        <input type="range" min={0} max={100} value={vol} onChange={handleVol} className={styles.vcVolume} />
        {!isAudio && <button type="button" className={styles.vcBtn} onClick={handleFullscreen}>⛶</button>}
      </div>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────── */
export default function AdminPagesManager() {
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Items for selected page (all cards across all sections)
  const [items, setItems] = useState<CardItem[]>([]);
  const [sections, setSections] = useState<SectionMeta[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Add New form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addSectionId, setAddSectionId] = useState<number>(0);
  const [addFields, setAddFields] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [addMediaType, setAddMediaType] = useState<'audio' | 'video'>('audio');
  const [editMediaType, setEditMediaType] = useState<'audio' | 'video'>('audio');

  // Filter
  const [filterSection, setFilterSection] = useState<string>('all');

  // Status
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  /* ── Load page list ─────────── */
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/pages');
        if (res.ok) {
          const data = await res.json();
          const pageMetas: PageMeta[] = data.map((p: any) => ({
            slug: p.slug, title: p.title, category: p.category, description: p.description || '',
            sections: (p.sections || []).map((s: any) => ({
              id: s.id, title: s.title, description: s.description || '',
              cardCount: (s.cards || []).length
            }))
          }));
          const filteredPages = pageMetas.filter(p => p.sections.reduce((sum, s) => sum + s.cardCount, 0) > 0);
          setPages(filteredPages);
          if (filteredPages.length > 0 && !selectedSlug) {
            selectPage(filteredPages[0].slug, data);
          }
        }
      } catch (err) {
        console.error('Load pages failed:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const selectPage = (slug: string, rawData?: any[]) => {
    setSelectedSlug(slug);
    setEditingId(null);
    setShowAddForm(false);
    setFilterSection('all');
    setStatus(null);
    loadItems(slug, rawData);
  };

  const loadItems = async (slug: string, rawData?: any[]) => {
    setIsLoadingItems(true);
    try {
      let pageData: any;
      if (rawData) {
        pageData = rawData.find((p: any) => p.slug === slug);
      } else {
        const res = await fetch('/api/admin/pages');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        pageData = data.find((p: any) => p.slug === slug);
        // Also update page list
        const pageMetas: PageMeta[] = data.map((p: any) => ({
          slug: p.slug, title: p.title, category: p.category, description: p.description || '',
          sections: (p.sections || []).map((s: any) => ({
            id: s.id, title: s.title, description: s.description || '',
            cardCount: (s.cards || []).length
          }))
        }));
        const filteredPages = pageMetas.filter(p => p.sections.reduce((sum, s) => sum + s.cardCount, 0) > 0);
        setPages(filteredPages);
      }

      if (!pageData) { setItems([]); setSections([]); return; }

      const secs: SectionMeta[] = (pageData.sections || []).map((s: any) => ({
        id: s.id, title: s.title, description: s.description || '',
        cardCount: (s.cards || []).length
      }));
      setSections(secs);

      // Flatten all cards from all sections
      const allCards: CardItem[] = [];
      for (const section of (pageData.sections || [])) {
        for (const card of (section.cards || [])) {
          allCards.push({
            id: card.id,
            sectionId: section.id,
            sectionTitle: section.title,
            displayOrder: card.displayOrder,
            title: card.title || '',
            description: card.description || '',
            imageUrl: card.imageUrl || '',
            linkText: card.linkText || '',
            linkUrl: card.linkUrl || '',
            extraData: card.extraData || {}
          });
        }
      }
      setItems(allCards);
      if (secs.length > 0) setAddSectionId(secs[0].id);
    } catch (err) {
      console.error('Load items failed:', err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  /* ── Get selected page ─────── */
  const selectedPage = pages.find(p => p.slug === selectedSlug);

  /* ── Filtered items ────────── */
  const filteredItems = filterSection === 'all'
    ? items
    : items.filter(i => String(i.sectionId) === filterSection);

  /* ── Get extra field keys from existing items ── */
  const getExtraKeys = (): string[] => {
    const keys = new Set<string>();
    items.forEach(i => Object.keys(i.extraData || {}).forEach(k => keys.add(k)));
    return Array.from(keys);
  };

  /* ── Flatten card to editable fields ── */
  const cardToFields = (card: CardItem): Record<string, string> => {
    const fields: Record<string, string> = {
      title: card.title,
      description: card.description,
      imageUrl: card.imageUrl,
      linkText: card.linkText,
      linkUrl: card.linkUrl,
    };
    if (card.extraData) {
      for (const [k, v] of Object.entries(card.extraData)) {
        fields[`extra_${k}`] = typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v ?? '');
      }
    }
    return fields;
  };

  /* ── Fields back to card data ── */
  const fieldsToCardData = (fields: Record<string, string>) => {
    const extraData: Record<string, any> = {};
    const base: any = {};
    for (const [k, v] of Object.entries(fields)) {
      if (k.startsWith('extra_')) {
        const ek = k.replace('extra_', '');
        // Type preservation
        if (v === 'true') extraData[ek] = true;
        else if (v === 'false') extraData[ek] = false;
        else if (!isNaN(Number(v)) && v.trim() !== '') extraData[ek] = Number(v);
        else extraData[ek] = v;
      } else {
        base[k] = v;
      }
    }
    return { ...base, extraData };
  };

  /* ── Save one card (update) ──────── */
  const handleSaveCard = async (cardId: number) => {
    setIsSaving(true);
    setStatus(null);
    try {
      const cardData = fieldsToCardData(editFields);
      const card = items.find(i => i.id === cardId);
      if (!card) throw new Error('Card not found');

      // Rebuild the full page payload and save
      await saveFullPage(selectedSlug!, (existingSections) => {
        return existingSections.map(sec => ({
          ...sec,
          cards: sec.cards.map((c: any) => {
            if (c.id === cardId) {
              return { ...c, ...cardData };
            }
            return c;
          })
        }));
      });

      setEditingId(null);
      setStatus({ type: 'success', msg: 'Item updated successfully.' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Save failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Add new card ──────────── */
  const handleAddCard = async () => {
    setIsAdding(true);
    setStatus(null);
    try {
      if (!addFields.title) throw new Error('Title is required.');
      const cardData = fieldsToCardData(addFields);

      await saveFullPage(selectedSlug!, (existingSections) => {
        return existingSections.map(sec => {
          if (sec.id === addSectionId) {
            return {
              ...sec,
              cards: [...sec.cards, {
                displayOrder: sec.cards.length,
                ...cardData
              }]
            };
          }
          return sec;
        });
      });

      setAddFields({});
      setShowAddForm(false);
      setStatus({ type: 'success', msg: 'New item added!' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Add failed.' });
    } finally {
      setIsAdding(false);
    }
  };

  /* ── Delete card ───────────── */
  const handleDeleteCard = async (cardId: number) => {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    setStatus(null);
    try {
      await saveFullPage(selectedSlug!, (existingSections) => {
        return existingSections.map(sec => ({
          ...sec,
          cards: sec.cards.filter((c: any) => c.id !== cardId)
        }));
      });
      setStatus({ type: 'success', msg: 'Item deleted.' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Delete failed.' });
    }
  };

  /* ── Save full page (helper) ── */
  const saveFullPage = async (
    slug: string,
    transform: (sections: any[]) => any[]
  ) => {
    // Reload fresh data from server
    const res = await fetch('/api/admin/pages');
    if (!res.ok) throw new Error('Failed to load current data');
    const allPages = await res.json();
    const page = allPages.find((p: any) => p.slug === slug);
    if (!page) throw new Error('Page not found');

    const updatedSections = transform(page.sections || []);

    const saveRes = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: page.slug,
        title: page.title,
        category: page.category,
        description: page.description,
        videoUrl: page.videoUrl,
        imageUrl: page.imageUrl,
        mainImageUrl: page.mainImageUrl,
        content: page.content,
        sections: updatedSections.map((s: any, i: number) => ({
          id: s.id,
          displayOrder: i,
          title: s.title,
          description: s.description,
          imageUrl: s.imageUrl,
          videoUrl: s.videoUrl,
          content: s.content,
          buttonText: s.buttonText,
          buttonUrl: s.buttonUrl,
          cards: (s.cards || []).map((c: any, j: number) => ({
            id: c.id,
            displayOrder: j,
            title: c.title,
            description: c.description,
            imageUrl: c.imageUrl,
            linkText: c.linkText,
            linkUrl: c.linkUrl,
            extraData: c.extraData || {}
          }))
        }))
      })
    });

    if (!saveRes.ok) {
      const d = await saveRes.json();
      throw new Error(d.error || 'Save failed');
    }

    // Reload
    await loadItems(slug);
  };

  /* ── Render helpers ──────── */
  const renderFieldInput = (
    key: string,
    value: string,
    onChange: (v: string) => void,
    label?: string,
    onDuration?: (d: string) => void
  ) => {
    const displayLabel = label || key.replace('extra_', '').replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
    const isVideo = key.includes('video') || key.includes('Video') || key.includes('embed') || key.includes('Embed');
    const isAudio = key.includes('audio') || key.includes('Audio');
    const isImage = key.includes('image') || key.includes('Image') || key.includes('poster') || key.includes('Poster');
    const isLong = key === 'description' || key === 'content' || key === 'bio';

    return (
      <div className={styles.fieldRow} key={key}>
        <label className={styles.fieldLabel}>{displayLabel}</label>
        <div className={styles.fieldInputWrap}>
          {isLong ? (
            <textarea className={styles.fieldTextarea} value={value}
              onChange={(e) => onChange(e.target.value)} rows={2} />
          ) : isImage ? (
            <>
              <UploadField accept="image/*" value={value} onChange={onChange} placeholder="Paste URL or upload image" />
              {value && <div className={styles.inlinePreviewImg}><img src={value} alt="Preview" /></div>}
            </>
          ) : isVideo ? (
            <>
              <UploadField accept="video/*" value={value} onChange={onChange} placeholder="YouTube URL or upload video" />
              {value && <MediaElementPlayer url={value} onDuration={onDuration} />}
            </>
          ) : isAudio ? (
            <>
              <UploadField accept="audio/*" value={value} onChange={onChange} placeholder="Audio URL or upload audio" />
              {value && <MediaElementPlayer url={value} onDuration={onDuration} />}
            </>
          ) : (
            <input type="text" className={styles.input} value={value} onChange={(e) => onChange(e.target.value)} />
          )}
        </div>
      </div>
    );
  };

  /* ── Loading state ──────── */
  if (isLoading && pages.length === 0) {
    return (
      <div className={styles.loadingState}>
        <Loader2 size={36} className={styles.spinner} />
        <span>Loading pages...</span>
      </div>
    );
  }

  const episodesSection = sections.find(s => s.title === 'Episodes');
  const isAddEpisode = selectedSlug === 'podcasts' && addSectionId === episodesSection?.id;
  const isEditEpisode = selectedSlug === 'podcasts' && editingId && items.find(i => i.id === editingId)?.sectionId === episodesSection?.id;
  const extraKeys = getExtraKeys();

  /* ── Main Render ────────── */
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Page Data Manager</h1>
          <p className={styles.subtitle}>Select a page → view & edit its data. Add, update, or delete items like Gallery.</p>
        </div>
      </div>

      <div className={styles.workspace}>
        {/* ─── LEFT: Page List ─── */}
        <div className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Pages</h3>
          <div className={styles.pageList}>
            {pages.map(p => (
              <button key={p.slug} type="button"
                className={`${styles.pageItem} ${selectedSlug === p.slug ? styles.pageItemActive : ''}`}
                onClick={() => selectPage(p.slug)}>
                <span className={styles.pageItemTitle}>{p.title}</span>
                <span className={styles.pageItemMeta}>
                  {p.sections.reduce((sum, s) => sum + s.cardCount, 0)} items
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: Items Panel ─── */}
        <div className={styles.itemsPanel}>
          {!selectedPage ? (
            <div className={styles.emptyState}>Select a page from the sidebar to manage its data.</div>
          ) : (
            <>
              {/* Page Header */}
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>{selectedPage.title}</h2>
                  {selectedPage.description && <p className={styles.panelDesc}>{selectedPage.description}</p>}
                </div>
                <button className={styles.addBtn} onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); }}>
                  <Plus size={15} />
                  Add New Item
                </button>
              </div>

              {/* Section filter tabs */}
              {sections.length > 1 && (
                <div className={styles.filterBar}>
                  <button className={`${styles.filterChip} ${filterSection === 'all' ? styles.filterActive : ''}`}
                    onClick={() => setFilterSection('all')}>
                    All ({items.length})
                  </button>
                  {sections.map(s => (
                    <button key={s.id}
                      className={`${styles.filterChip} ${filterSection === String(s.id) ? styles.filterActive : ''}`}
                      onClick={() => setFilterSection(String(s.id))}>
                      {s.title} ({s.cardCount})
                    </button>
                  ))}
                </div>
              )}

              {/* Status */}
              {status && (
                <div className={`${styles.statusMsg} ${status.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
                  {status.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  <span>{status.msg}</span>
                </div>
              )}

              {/* ── ADD NEW FORM ── */}
              {showAddForm && (
                <div className={styles.addFormCard}>
                  <div className={styles.addFormHeader}>
                    <h3>Add New Item</h3>
                    <button className={styles.closeBtn} onClick={() => setShowAddForm(false)}><X size={16} /></button>
                  </div>

                  {sections.length > 1 && (
                    <div className={styles.fieldRow}>
                      <label className={styles.fieldLabel}>Add to Section</label>
                      <select className={styles.input} value={addSectionId}
                        onChange={(e) => setAddSectionId(Number(e.target.value))}>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                    </div>
                  )}

                  {isAddEpisode ? (
                    <div className={styles.customEpisodeForm}>
                      {renderFieldInput('title', addFields.title || '', v => setAddFields(f => ({ ...f, title: v })), 'Episode Title')}
                      {renderFieldInput('description', addFields.description || '', v => setAddFields(f => ({ ...f, description: v })), 'Description')}
                      {renderFieldInput('imageUrl', addFields.imageUrl || '', v => setAddFields(f => ({ ...f, imageUrl: v })), 'Cover Image URL')}
                      
                      <div className={styles.formRowGrid}>
                        {renderFieldInput('extra_episodeNumber', addFields.extra_episodeNumber || '', v => setAddFields(f => ({ ...f, extra_episodeNumber: v })), 'Episode Number')}
                        
                        <div className={styles.fieldRow}>
                          <label className={styles.fieldLabel}>Category Tag</label>
                          <select className={styles.input} value={addFields.extra_tag || 'Policy'} onChange={e => setAddFields(f => ({ ...f, extra_tag: e.target.value }))}>
                            {['Climate Finance', 'Heatwaves', 'Floods', 'Policy', 'Early Warning', 'Glaciers'].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={styles.formRowGrid}>
                        {renderFieldInput('extra_speaker', addFields.extra_speaker || '', v => setAddFields(f => ({ ...f, extra_speaker: v })), 'Guest Speaker')}
                        {renderFieldInput('extra_speakerTitle', addFields.extra_speakerTitle || '', v => setAddFields(f => ({ ...f, extra_speakerTitle: v })), 'Speaker Title/Org')}
                      </div>

                      <div className={styles.formRowGrid}>
                        {renderFieldInput('extra_date', addFields.extra_date || '', v => setAddFields(f => ({ ...f, extra_date: v })), 'Publish Date')}
                        {renderFieldInput('extra_duration', addFields.extra_duration || '', v => setAddFields(f => ({ ...f, extra_duration: v })), 'Duration (e.g. 42 min)')}
                      </div>

                      {/* Media Type Selector */}
                      <div className={styles.mediaTypeSelectorRow}>
                        <label className={styles.fieldLabel}>Media Type</label>
                        <div className={styles.mediaTypeButtons}>
                          <button
                            type="button"
                            className={`${styles.mediaTypeBtn} ${addMediaType === 'audio' ? styles.mediaTypeBtnActive : ''}`}
                            onClick={() => {
                              setAddMediaType('audio');
                              setAddFields(f => ({ ...f, extra_videoUrl: '' }));
                            }}
                          >
                            🎙️ Audio Episode
                          </button>
                          <button
                            type="button"
                            className={`${styles.mediaTypeBtn} ${addMediaType === 'video' ? styles.mediaTypeBtnActive : ''}`}
                            onClick={() => {
                              setAddMediaType('video');
                              setAddFields(f => ({ ...f, extra_audioUrl: '' }));
                            }}
                          >
                            🎥 Video Episode
                          </button>
                        </div>
                      </div>

                      {addMediaType === 'audio' ? (
                        renderFieldInput('extra_audioUrl', addFields.extra_audioUrl || '', v => setAddFields(f => ({ ...f, extra_audioUrl: v, extra_videoUrl: '' })), 'Audio URL (MP3)', (dur) => setAddFields(f => ({ ...f, extra_duration: dur })))
                      ) : (
                        renderFieldInput('extra_videoUrl', addFields.extra_videoUrl || '', v => setAddFields(f => ({ ...f, extra_videoUrl: v, extra_audioUrl: '' })), 'Video URL (MP4 / YouTube)', (dur) => setAddFields(f => ({ ...f, extra_duration: dur })))
                      )}

                      <div className={styles.fieldRow}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={addFields.extra_isFeatured === 'true'}
                            onChange={e => setAddFields(f => ({ ...f, extra_isFeatured: e.target.checked ? 'true' : 'false' }))}
                          />
                          <span>Featured Episode (displays at top of the player)</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
                      {renderFieldInput('title', addFields.title || '', v => setAddFields(f => ({ ...f, title: v })), 'Title')}
                      {renderFieldInput('description', addFields.description || '', v => setAddFields(f => ({ ...f, description: v })), 'Description')}
                      {renderFieldInput('imageUrl', addFields.imageUrl || '', v => setAddFields(f => ({ ...f, imageUrl: v })), 'Image')}

                      {/* Show extra fields based on existing items */}
                      {extraKeys.map(k => {
                        const isMediaKey = k.includes('video') || k.includes('Video') || k.includes('embed') || k.includes('Embed') || k.includes('audio') || k.includes('Audio');
                        return renderFieldInput(`extra_${k}`, addFields[`extra_${k}`] || '',
                          v => setAddFields(f => ({ ...f, [`extra_${k}`]: v })),
                          undefined,
                          isMediaKey ? (dur: string) => setAddFields(f => ({ ...f, extra_duration: dur })) : undefined
                        );
                      })}
                    </>
                  )}

                  {/* Add custom property */}
                  <button type="button" className={styles.addPropBtn}
                    onClick={() => {
                      const key = prompt('New property name (e.g. duration, speaker, tag):');
                      if (key && key.trim()) setAddFields(f => ({ ...f, [`extra_${key.trim()}`]: '' }));
                    }}>
                    <Plus size={12} /> Add Custom Property
                  </button>

                  <button className={styles.saveBtn} onClick={handleAddCard} disabled={isAdding}>
                    {isAdding ? <><Loader2 size={14} className={styles.spinner} /> Adding...</> : <><Plus size={14} /> Add Item</>}
                  </button>
                </div>
              )}

              {/* ── ITEMS LIST ── */}
              {isLoadingItems ? (
                <div className={styles.loadingState}><Loader2 size={24} className={styles.spinner} /><span>Loading...</span></div>
              ) : filteredItems.length === 0 ? (
                <div className={styles.emptyState}>
                  No items yet. Click "Add New Item" to create your first entry.
                </div>
              ) : (
                <div className={styles.itemsList}>
                  {filteredItems.map((item) => {
                    const isEpisodeCard = selectedSlug === 'podcasts' && item.sectionTitle === 'Episodes';
                    return (
                      <div key={item.id} className={styles.itemCard}>
                      {editingId === item.id ? (
                        /* ── EDITING MODE ── */
                        <div className={styles.editForm}>
                          <div className={styles.editFormHeader}>
                            <span className={styles.editBadge}>Editing</span>
                            <div className={styles.editActions}>
                              <button className={styles.saveBtn} onClick={() => handleSaveCard(item.id!)} disabled={isSaving}>
                                {isSaving ? <Loader2 size={13} className={styles.spinner} /> : <Save size={13} />}
                                <span>Save</span>
                              </button>
                              <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>
                                <X size={13} /> Cancel
                              </button>
                            </div>
                          </div>
                          {isEditEpisode ? (
                            <div className={styles.customEpisodeForm}>
                              {renderFieldInput('title', editFields.title || '', v => setEditFields(f => ({ ...f, title: v })), 'Episode Title')}
                              {renderFieldInput('description', editFields.description || '', v => setEditFields(f => ({ ...f, description: v })), 'Description')}
                              {renderFieldInput('imageUrl', editFields.imageUrl || '', v => setEditFields(f => ({ ...f, imageUrl: v })), 'Cover Image URL')}
                              
                              <div className={styles.formRowGrid}>
                                {renderFieldInput('extra_episodeNumber', editFields.extra_episodeNumber || '', v => setEditFields(f => ({ ...f, extra_episodeNumber: v })), 'Episode Number')}
                                
                                <div className={styles.fieldRow}>
                                  <label className={styles.fieldLabel}>Category Tag</label>
                                  <select className={styles.input} value={editFields.extra_tag || 'Policy'} onChange={e => setEditFields(f => ({ ...f, extra_tag: e.target.value }))}>
                                    {['Climate Finance', 'Heatwaves', 'Floods', 'Policy', 'Early Warning', 'Glaciers'].map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className={styles.formRowGrid}>
                                {renderFieldInput('extra_speaker', editFields.extra_speaker || '', v => setEditFields(f => ({ ...f, extra_speaker: v })), 'Guest Speaker')}
                                {renderFieldInput('extra_speakerTitle', editFields.extra_speakerTitle || '', v => setEditFields(f => ({ ...f, extra_speakerTitle: v })), 'Speaker Title/Org')}
                              </div>

                              <div className={styles.formRowGrid}>
                                {renderFieldInput('extra_date', editFields.extra_date || '', v => setEditFields(f => ({ ...f, extra_date: v })), 'Publish Date')}
                                {renderFieldInput('extra_duration', editFields.extra_duration || '', v => setEditFields(f => ({ ...f, extra_duration: v })), 'Duration (e.g. 42 min)')}
                              </div>

                              {/* Media Type Selector */}
                              <div className={styles.mediaTypeSelectorRow}>
                                <label className={styles.fieldLabel}>Media Type</label>
                                <div className={styles.mediaTypeButtons}>
                                  <button
                                    type="button"
                                    className={`${styles.mediaTypeBtn} ${editMediaType === 'audio' ? styles.mediaTypeBtnActive : ''}`}
                                    onClick={() => {
                                      setEditMediaType('audio');
                                      setEditFields(f => ({ ...f, extra_videoUrl: '' }));
                                    }}
                                  >
                                    🎙️ Audio Episode
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.mediaTypeBtn} ${editMediaType === 'video' ? styles.mediaTypeBtnActive : ''}`}
                                    onClick={() => {
                                      setEditMediaType('video');
                                      setEditFields(f => ({ ...f, extra_audioUrl: '' }));
                                    }}
                                  >
                                    🎥 Video Episode
                                  </button>
                                </div>
                              </div>

                              {editMediaType === 'audio' ? (
                                renderFieldInput('extra_audioUrl', editFields.extra_audioUrl || '', v => setEditFields(f => ({ ...f, extra_audioUrl: v, extra_videoUrl: '' })), 'Audio URL (MP3)', (dur) => setEditFields(f => ({ ...f, extra_duration: dur })))
                              ) : (
                                renderFieldInput('extra_videoUrl', editFields.extra_videoUrl || '', v => setEditFields(f => ({ ...f, extra_videoUrl: v, extra_audioUrl: '' })), 'Video URL (MP4 / YouTube)', (dur) => setEditFields(f => ({ ...f, extra_duration: dur })))
                              )}

                              <div className={styles.fieldRow}>
                                <label className={styles.checkboxLabel}>
                                  <input
                                    type="checkbox"
                                    checked={editFields.extra_isFeatured === 'true'}
                                    onChange={e => setEditFields(f => ({ ...f, extra_isFeatured: e.target.checked ? 'true' : 'false' }))}
                                  />
                                  <span>Featured Episode (displays at top of the player)</span>
                                </label>
                              </div>
                            </div>
                          ) : (
                            Object.entries(editFields).map(([key, val]) => {
                              const isMediaKey = key.includes('video') || key.includes('Video') || key.includes('embed') || key.includes('Embed') || key.includes('audio') || key.includes('Audio');
                              return renderFieldInput(
                                key, val,
                                v => setEditFields(f => ({ ...f, [key]: v })),
                                undefined,
                                isMediaKey ? (dur: string) => setEditFields(f => ({ ...f, extra_duration: dur })) : undefined
                              );
                            })
                          )}
                        </div>
                      ) : isEpisodeCard ? (
                        /* ── EPISODE CUSTOM VIEW MODE ── */
                        <div className={styles.itemView}>
                          {/* Episode Cover Image */}
                          {item.imageUrl && (
                            <div className={styles.episodeThumbLarge}>
                              <img src={item.imageUrl} alt={item.title} />
                            </div>
                          )}

                          <div className={styles.itemBody}>
                            <div className={styles.itemTopRow}>
                              <span className={styles.episodeNumBadge}>Ep. {item.extraData?.episodeNumber}</span>
                              <span className={styles.sectionBadge}>{item.extraData?.tag || 'Podcast'}</span>
                              {item.extraData?.isFeatured && <span className={styles.featuredBadge}>★ Featured</span>}
                              <h4 className={styles.itemTitle}>{item.title || '(untitled)'}</h4>
                            </div>

                            {item.description && <p className={styles.itemDesc}>{item.description}</p>}

                            {/* Beautiful structured meta details grid */}
                            <div className={styles.episodeMetaGrid}>
                              <div><strong>Guest Speaker:</strong> {item.extraData?.speaker || 'N/A'} {item.extraData?.speakerTitle ? `(${item.extraData.speakerTitle})` : ''}</div>
                              <div><strong>Publish Date:</strong> {item.extraData?.date || 'N/A'}</div>
                              <div><strong>Duration:</strong> {item.extraData?.duration || 'N/A'}</div>
                              <div>
                                <strong>Media:</strong> {item.extraData?.videoUrl ? (
                                  <span className={styles.mediaTypeSpan}>🎥 Video</span>
                                ) : (
                                  <span className={styles.mediaTypeSpan}>🎙️ Audio</span>
                                )}
                              </div>
                            </div>

                            {/* Render Player cleanly with spacing */}
                            <div className={styles.adminPlayerContainer}>
                              <MediaElementPlayer url={item.extraData?.videoUrl || item.extraData?.audioUrl || ''} />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className={styles.itemActions}>
                            <button className={styles.editBtn} onClick={() => {
                              setEditingId(item.id!);
                              setEditFields(cardToFields(item));
                              setShowAddForm(false);
                              const hasVideo = !!item.extraData?.videoUrl;
                              setEditMediaType(hasVideo ? 'video' : 'audio');
                            }}>
                              <Edit3 size={13} /> Edit
                            </button>
                            <button className={styles.deleteBtn} onClick={() => handleDeleteCard(item.id!)}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── GENERAL VIEW MODE ── */
                        <div className={styles.itemView}>
                          {/* Image thumbnail */}
                          {item.imageUrl && (
                            <div className={styles.itemThumb}>
                              <img src={item.imageUrl} alt={item.title} />
                            </div>
                          )}

                          <div className={styles.itemBody}>
                            {/* Section badge + title */}
                            <div className={styles.itemTopRow}>
                              {item.sectionTitle && sections.length > 1 && (
                                <span className={styles.sectionBadge}>{item.sectionTitle}</span>
                              )}
                              <h4 className={styles.itemTitle}>{item.title || '(untitled)'}</h4>
                            </div>

                            {/* Description */}
                            {item.description && (
                              <p className={styles.itemDesc}>{item.description.length > 120 ? item.description.slice(0, 120) + '...' : item.description}</p>
                            )}

                            {/* Extra data tags + image previews */}
                            {item.extraData && Object.keys(item.extraData).length > 0 && (
                              <div className={styles.extraTags}>
                                {Object.entries(item.extraData).map(([k, v]) => {
                                  const val = String(v);
                                  const isImg = (k.toLowerCase().includes('image') || k.toLowerCase().includes('poster')) && val.startsWith('http');
                                  if (isImg) {
                                    return (
                                      <div key={k} className={styles.inlinePreviewImg}>
                                        <img src={val} alt={k} />
                                      </div>
                                    );
                                  }
                                  return (
                                    <span key={k} className={styles.extraTag}>
                                      <strong>{k}:</strong> {val.length > 30 ? val.slice(0, 30) + '...' : val}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Media inline preview */}
                            {(item.extraData?.audioUrl || item.extraData?.embedUrl || item.extraData?.videoUrl) && (
                              <MediaElementPlayer url={item.extraData.audioUrl || item.extraData.embedUrl || item.extraData.videoUrl} />
                            )}
                          </div>

                          {/* Actions */}
                          <div className={styles.itemActions}>
                            <button className={styles.editBtn} onClick={() => {
                              setEditingId(item.id!);
                              setEditFields(cardToFields(item));
                              setShowAddForm(false);
                              const hasVideo = !!item.extraData?.videoUrl;
                              setEditMediaType(hasVideo ? 'video' : 'audio');
                            }}>
                              <Edit3 size={13} /> Edit
                            </button>
                            <button className={styles.deleteBtn} onClick={() => handleDeleteCard(item.id!)}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
