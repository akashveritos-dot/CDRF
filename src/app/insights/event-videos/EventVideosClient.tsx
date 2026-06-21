'use client';

import React, { useState } from 'react';
import { Play, Tv, Monitor, Layers } from 'lucide-react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import PageHero from '@/components/ui/PageHero/PageHero';

export interface PageData {
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
  categoryColor: string;
  embedUrl: string;
  posterUrl: string;
  duration: string;
  date: string;
}

const webinarVideos: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'Designing Cool Roof Initiatives for Urban Heat Mitigation',
    description: 'A technical panel featuring metropolitan planners and civil advisors detailing parameter protocols for slums and high-density sectors.',
    category: 'Webinar Panel',
    categoryColor: '#b91c1c',
    embedUrl: 'https://www.youtube.com/embed/U7Jsk748t3w',
    posterUrl: 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=800&q=80',
    duration: '42:18',
    date: 'Apr 14, 2026',
  },
  {
    id: 'vid-2',
    title: 'Himalayan Glacial Sensors & Flood Telemetry Calibrations',
    description: 'Hydrological working groups demonstrating sensor deployment protocols and satellite warning triggers in flash-flood zones.',
    category: 'Technical Workshop',
    categoryColor: '#0f766e',
    embedUrl: 'https://www.youtube.com/embed/yVwA1Kk76yI',
    posterUrl: 'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?auto=format&fit=crop&w=800&q=80',
    duration: '58:44',
    date: 'Mar 28, 2026',
  },
  {
    id: 'vid-3',
    title: 'DCRC Summit: Steering ESG Inflows into Pre-Event Resiliency',
    description: 'Corporate sustainability officers and advisors discussing parameter-based CSR initiatives replacing post-event charity checks.',
    category: 'Summit Keynote',
    categoryColor: '#7c3aed',
    embedUrl: 'https://www.youtube.com/embed/Q8wzIcrqNnE',
    posterUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    duration: '31:52',
    date: 'Feb 10, 2026',
  },
];

interface EventVideosClientProps {
  pageData: PageData;
}

const streamStats = [
  { icon: <Tv size={18} />, label: '3 Events', sub: 'Recorded sessions' },
  { icon: <Monitor size={18} />, label: '2.4K+ Views', sub: 'Cumulative reach' },
  { icon: <Layers size={18} />, label: '6 Topics', sub: 'Covered in depth' },
];

export default function EventVideosClient({ pageData }: EventVideosClientProps) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  return (
    <div className={styles.page}>
      {/* ── Premium Page Hero ───────────────────────────────────────── */}
      <ScrollReveal direction="down">
        <PageHero
          theme="events"
          eyebrow="DCRF Secretariat Broadcasting"
          line1="MONTHLY"
          line2="WEBINARS"
          subtitle={pageData.description}
        />
      </ScrollReveal>

      {/* ── Stream Stats Bar ────────────────────────────────────────── */}
      <ScrollReveal direction="up" delay={0.08}>
        <div className={styles.statsBar}>
          {streamStats.map((s, i) => (
            <div key={i} className={styles.statItem}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statLabel}>{s.label}</span>
              <span className={styles.statSub}>{s.sub}</span>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* ── Narrative intro ─────────────────────────────────────────── */}
      {pageData.content && (
        <ScrollReveal direction="up" delay={0.1}>
          <div className={styles.introText} dangerouslySetInnerHTML={{ __html: pageData.content }} />
        </ScrollReveal>
      )}

      {/* ── Featured (first) video — large ─────────────────────────── */}
      <ScrollReveal direction="up" delay={0.12}>
        <div className={styles.featuredCard}>
          <div className={styles.featuredPlayer}>
            {playingVideoId === webinarVideos[0].id ? (
              <iframe
                src={`${webinarVideos[0].embedUrl}?autoplay=1`}
                title={webinarVideos[0].title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.iframe}
              />
            ) : (
              <div
                className={styles.featPoster}
                onClick={() => setPlayingVideoId(webinarVideos[0].id)}
                role="button"
                tabIndex={0}
                aria-label={`Play: ${webinarVideos[0].title}`}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setPlayingVideoId(webinarVideos[0].id)}
              >
                <img src={webinarVideos[0].posterUrl} alt="" className={styles.featPosterImg} />
                <div className={styles.featOverlay}>
                  <div className={styles.playBigCircle}>
                    <Play size={30} fill="white" />
                  </div>
                </div>
                <span className={styles.featDuration}>{webinarVideos[0].duration}</span>
              </div>
            )}
          </div>
          <div className={styles.featInfo}>
            <span className={styles.featBadge} style={{ background: `${webinarVideos[0].categoryColor}18`, color: webinarVideos[0].categoryColor, borderColor: `${webinarVideos[0].categoryColor}30` }}>
              {webinarVideos[0].category}
            </span>
            <h2 className={styles.featTitle}>{webinarVideos[0].title}</h2>
            <p className={styles.featDesc}>{webinarVideos[0].description}</p>
            <span className={styles.featDate}>{webinarVideos[0].date}</span>
          </div>
        </div>
      </ScrollReveal>

      {/* ── Section label ───────────────────────────────────────────── */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className={styles.sectionLabel}>
          <span className={styles.sectionLabelLine} />
          <span className={styles.sectionLabelText}>More Sessions</span>
          <span className={styles.sectionLabelLine} />
        </div>
      </ScrollReveal>

      {/* ── Remaining videos — 2-col grid ───────────────────────────── */}
      <div className={styles.videoGrid}>
        {webinarVideos.slice(1).map((video, idx) => {
          const isPlaying = playingVideoId === video.id;
          return (
            <ScrollReveal key={video.id} direction="up" delay={0.06 * idx}>
              <div className={styles.videoCard}>
                <div className={styles.playerWrapper}>
                  {isPlaying ? (
                    <iframe
                      src={`${video.embedUrl}?autoplay=1`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className={styles.iframe}
                    />
                  ) : (
                    <div
                      className={styles.posterContainer}
                      onClick={() => setPlayingVideoId(video.id)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Play: ${video.title}`}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setPlayingVideoId(video.id)}
                    >
                      <img src={video.posterUrl} alt={video.title} className={styles.posterImage} />
                      <div className={styles.playOverlay}>
                        <div className={styles.playButtonCircle}>
                          <Play size={20} fill="currentColor" className={styles.playIcon} />
                        </div>
                      </div>
                      <span className={styles.durationChip}>{video.duration}</span>
                    </div>
                  )}
                </div>
                <div className={styles.videoInfo}>
                  <span className={styles.videoBadge} style={{ background: `${video.categoryColor}15`, color: video.categoryColor }}>
                    {video.category}
                  </span>
                  <h3 className={styles.videoTitle}>{video.title}</h3>
                  <p className={styles.videoDesc}>{video.description}</p>
                  <span className={styles.videoDate}>{video.date}</span>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
