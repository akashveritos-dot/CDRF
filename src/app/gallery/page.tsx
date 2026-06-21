'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, Image as ImageIcon, Camera } from 'lucide-react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import PageHero from '@/components/ui/PageHero/PageHero';

interface GalleryItem {
  id: number;
  imageUrl: string;
  caption: string;
  content?: string;
  createdAt: string;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    async function loadGallery() {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch('/api/gallery');
        if (!res.ok) throw new Error('Failed to retrieve gallery items.');
        const data = await res.json();
        setItems(data);
        setActiveIdx(Math.floor(data.length / 2));
      } catch (err: any) {
        setError(err.message || 'An error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
    loadGallery();
  }, []);

  const prev = useCallback(() => {
    setActiveIdx(i => (i - 1 + items.length) % items.length);
  }, [items.length]);

  const next = useCallback(() => {
    setActiveIdx(i => (i + 1) % items.length);
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (activeItem) {
        if (e.key === 'Escape') setActiveItem(null);
        return;
      }
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeItem, prev, next]);

  useEffect(() => {
    document.body.style.overflow = activeItem ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeItem]);

  // Compute position offset for each card (-2 … 0 … +2)
  const getOffset = (idx: number) => {
    let offset = idx - activeIdx;
    if (offset > items.length / 2) offset -= items.length;
    if (offset < -items.length / 2) offset += items.length;
    return offset;
  };

  return (
    <div className={styles.page}>

      {/* ── Premium Section Header ───────────────────────────────────── */}
      <ScrollReveal direction="down">
        <PageHero
          theme="gallery"
          eyebrow="DCRF Field Deployments & Summits"
          line1="OUR"
          line2="GALLERY"
          subtitle="A visual documentation of early warning sensor deployments, cool-roof installations, and national policy summits steered by DCRF working groups."
        />
      </ScrollReveal>

      {/* ── Gallery Carousel ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingCarousel}>
            {[...Array(5)].map((_, i) => {
              const offset = i - 2;
              return (
                <div
                  key={i}
                  className={styles.skeletonCard}
                  style={{
                    transform: `translateX(${offset * 240}px) scale(${offset === 0 ? 1 : 0.78}) rotateY(${offset * -8}deg)`,
                    opacity: Math.abs(offset) === 0 ? 1 : Math.abs(offset) === 1 ? 0.55 : 0.28,
                    zIndex: 5 - Math.abs(offset),
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <AlertTriangle size={48} />
          <h2>Archives Offline</h2>
          <p>{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <ImageIcon size={48} />
          <p>No photos staged in the gallery database yet.</p>
        </div>
      ) : (
        <div className={styles.carouselSection}>
          {/* 3D Card Stage */}
          <div className={styles.carouselStage}>
            {items.map((item, idx) => {
              const offset = getOffset(idx);
              const isCenter = offset === 0;
              const isVisible = Math.abs(offset) <= 2;
              if (!isVisible) return null;

              const scale = isCenter ? 1 : Math.abs(offset) === 1 ? 0.78 : 0.62;
              const translateX = offset * 230;
              const rotateY = offset * -10;
              const opacity = isCenter ? 1 : Math.abs(offset) === 1 ? 0.6 : 0.3;
              const zIndex = 10 - Math.abs(offset);

              return (
                <div
                  key={item.id}
                  className={`${styles.card3d} ${isCenter ? styles.cardCenter : ''}`}
                  style={{
                    transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
                    opacity,
                    zIndex,
                  }}
                  onClick={() => {
                    if (isCenter) setActiveItem(item);
                    else setActiveIdx(idx);
                  }}
                >
                  <div className={styles.cardImageWrap}>
                    <img src={item.imageUrl} alt={item.caption} className={styles.cardImage} />
                    {isCenter && (
                      <div className={styles.cardOverlay}>
                        <span className={styles.viewLabel}>View Full</span>
                      </div>
                    )}
                  </div>
                  {isCenter && (
                    <div className={styles.cardReflection} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows REMOVED — click side cards to navigate */}

          {/* Active item info — key forces remount for clean fade, no layout shift */}
          <div key={activeIdx} className={styles.carouselInfo}>
            <h2 className={styles.carouselTitle}>{items[activeIdx]?.caption}</h2>
            {items[activeIdx]?.content && (
              <p className={styles.carouselDesc}>
                {items[activeIdx].content!.length > 100
                  ? `${items[activeIdx].content!.substring(0, 100)}…`
                  : items[activeIdx].content}
              </p>
            )}
            <div className={styles.carouselDivider} />
          </div>

          {/* Dot indicators */}
          <div className={styles.dots}>
            {items.map((_, idx) => (
              <button
                key={idx}
                className={`${styles.dot} ${idx === activeIdx ? styles.dotActive : ''}`}
                onClick={() => setActiveIdx(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <div
        className={`${styles.lightboxOverlay} ${activeItem ? styles.lightboxOverlayActive : ''}`}
        onClick={() => setActiveItem(null)}
      >
        {activeItem && (
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setActiveItem(null)} aria-label="Close">
              <X size={18} />
            </button>
            <div className={styles.lightboxImageWrapper}>
              <img src={activeItem.imageUrl} alt={activeItem.caption} className={styles.lightboxImage} />
            </div>
            <div className={styles.lightboxInfo}>
              <div className={styles.lightboxEyebrow}>DCRF Archive</div>
              <h3 className={styles.lightboxTitle}>{activeItem.caption}</h3>
              {activeItem.content && <p className={styles.lightboxDesc}>{activeItem.content}</p>}
              <div className={styles.lightboxMeta}>
                <Camera size={12} /> Recorded Deployment Node · DCRF
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
