'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, X, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';

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

  useEffect(() => {
    async function loadGallery() {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch('/api/gallery');
        if (!res.ok) {
          throw new Error('Failed to retrieve gallery items.');
        }
        const data = await res.json();
        setItems(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred.');
      } finally {
        setIsLoading(false);
      }
    }

    loadGallery();
  }, []);

  const openLightbox = (item: GalleryItem) => {
    setActiveItem(item);
  };

  const closeLightbox = () => {
    setActiveItem(null);
  };

  useEffect(() => {
    if (activeItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeItem]);

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 size={36} className={styles.spinner} />
        <span>Loading Media Archives...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <AlertTriangle size={48} className={styles.spinner} />
        <h2 className={styles.errorTitle}>Archives Offline</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <h1 className={styles.title}>Federation Photo Gallery</h1>
          <p style={{ color: 'var(--wine-red-primary)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            DCRF Field Deployments & Summits
          </p>
          <p className={styles.subtitle}>
            A visual documentation of early warning sensor deployments, cool-roof installations, and national policy summits steered by working groups.
          </p>
        </div>
      </ScrollReveal>

      {/* Gallery Photo Grid */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <ImageIcon size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No photos staged in the gallery database yet.</p>
        </div>
      ) : (
        <div className={styles.galleryGrid}>
          {items.map((item, idx) => (
            <ScrollReveal 
              key={item.id} 
              direction="up" 
              delay={0.05 * idx}
            >
              <div 
                className={styles.galleryCard}
                onClick={() => openLightbox(item)}
              >
                <div className={styles.imageWrapper}>
                  <img
                    src={item.imageUrl}
                    alt={item.caption}
                    className={styles.image}
                  />
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{item.caption}</h3>
                  {item.content && (
                    <p className={styles.cardDesc}>
                      {item.content.length > 85 ? `${item.content.substring(0, 85)}...` : item.content}
                    </p>
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* Lightbox Overlay */}
      <div
        className={`${styles.lightboxOverlay} ${activeItem ? styles.lightboxOverlayActive : ''}`}
        onClick={closeLightbox}
      >
        {activeItem && (
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.lightboxClose} 
              onClick={closeLightbox}
              aria-label="Close Lightbox"
            >
              <X size={20} />
            </button>

            <div className={styles.lightboxImageWrapper}>
              <img
                src={activeItem.imageUrl}
                alt={activeItem.caption}
                className={styles.lightboxImage}
              />
            </div>

            <div className={styles.lightboxInfo}>
              <h3 className={styles.lightboxTitle}>{activeItem.caption}</h3>
              {activeItem.content && <p className={styles.lightboxDesc}>{activeItem.content}</p>}
              <div className={styles.lightboxMeta}>
                Recorded Deployment Node • DCRF
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
