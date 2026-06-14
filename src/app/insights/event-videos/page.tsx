'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Play, AlertTriangle } from 'lucide-react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';

interface PageData {
  slug: string;
  title: string;
  category: string;
  description: string;
  content: string;
}

interface VideoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  embedUrl: string;
  posterUrl: string;
}

// Curated list of premium DCRF webinars
const webinarVideos: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'Designing Cool Roof Initiatives for Urban Heat Mitigation',
    description: 'A technical panel featuring metropolitan planners and civil advisors detailing parameter protocols for slums and high-density sectors.',
    category: 'Webinar Panel',
    embedUrl: 'https://www.youtube.com/embed/U7Jsk748t3w',
    posterUrl: 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'vid-2',
    title: 'Himalayan Glacial Sensors & Flood Telemetry Calibrations',
    description: 'Hydrological working groups demonstrating sensor deployment protocols and satellite warning triggers in flash-flood zones.',
    category: 'Technical Workshop',
    embedUrl: 'https://www.youtube.com/embed/yVwA1Kk76yI',
    posterUrl: 'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'vid-3',
    title: 'DCRC Summit: Steering ESG Inflows into Pre-Event Resiliency',
    description: 'Corporate sustainability officers and advisors discussing parameter-based CSR initiatives replacing post-event charity checks.',
    category: 'Summit Keynote',
    embedUrl: 'https://www.youtube.com/embed/Q8wzIcrqNnE',
    posterUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
  }
];

export default function EventVideosPage() {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPage() {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch('/api/pages/event-videos');
        if (!res.ok) {
          throw new Error('Failed to load event videos page meta.');
        }
        const data = await res.json();
        setPageData(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
    loadPage();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 size={36} className={styles.spinner} />
        <span>Loading Media Library...</span>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className={styles.errorState}>
        <AlertTriangle size={48} className={styles.spinner} />
        <h2 className={styles.errorTitle}>Media Cache Offline</h2>
        <p>{error || 'Video library metadata missing.'}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Intro section */}
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <h1 className={styles.title}>{pageData.title}</h1>
          <p style={{ color: 'var(--wine-red-primary)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            DCRF Secretariat Broadcasting
          </p>
          <p className={styles.subtitle}>{pageData.description}</p>
        </div>
      </ScrollReveal>

      {/* Narrative Intro */}
      <ScrollReveal direction="up" delay={0.1}>
        <div 
          style={{ textRendering: 'optimizeLegibility', textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px', color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: pageData.content }}
        />
      </ScrollReveal>

      {/* Grid of video player cards */}
      <section className={styles.videoSection}>
        <div className={styles.videoGrid}>
          {webinarVideos.map((video, idx) => {
            const isPlaying = playingVideoId === video.id;
            return (
              <ScrollReveal 
                key={video.id} 
                direction="up" 
                delay={0.05 * idx}
              >
                <div className={styles.videoCard}>
                  <div className={styles.playerWrapper}>
                    {isPlaying ? (
                      <iframe
                        src={`${video.embedUrl}?autoplay=1`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div 
                        className={styles.posterContainer}
                        onClick={() => setPlayingVideoId(video.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Play video: ${video.title}`}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPlayingVideoId(video.id); }}
                      >
                        <img 
                          src={video.posterUrl} 
                          alt={video.title} 
                          className={styles.posterImage}
                        />
                        <div className={styles.playOverlay}>
                          <div className={styles.playButtonCircle}>
                            <Play size={24} fill="currentColor" className={styles.playIcon} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.videoInfo}>
                    <div className={styles.videoBadge}>{video.category}</div>
                    <h3 className={styles.videoTitle}>{video.title}</h3>
                    <p className={styles.videoDesc}>{video.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
