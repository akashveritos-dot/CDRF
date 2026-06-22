'use client';

import React, { useState } from 'react';
import { Play, Calendar, Users, BookOpen, Radio, Filter, Clock, ChevronRight } from 'lucide-react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import PageHero from '@/components/ui/PageHero/PageHero';

/* ─── Interfaces ───────────────────── */
interface Speaker {
  name: string;
  title: string;
  org: string;
  initials: string;
  color: string;
  imageUrl?: string;
}

interface ScheduleItem {
  month: string;
  day: string;
  title: string;
  speaker: string;
  duration: string;
  topic: string;
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
  topic: string;
}

interface EventVideosClientProps {
  speakers: Speaker[];
  upcomingSchedule: ScheduleItem[];
  webinarVideos: VideoItem[];
  topics: string[];
}

export default function EventVideosClient({
  speakers,
  upcomingSchedule,
  webinarVideos,
  topics,
}: EventVideosClientProps) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState('All');

  const filteredVideos = activeTopic === 'All'
    ? webinarVideos
    : webinarVideos.filter(v => v.topic === activeTopic);

  // Build embed URL for playback
  const getPlayUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube') || url.includes('youtu.be')) {
      const embedBase = url.includes('embed') ? url : url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');
      return `${embedBase}?autoplay=1`;
    }
    return url; // local video
  };

  const isLocalVideo = (url: string) => {
    return url && !url.includes('youtube') && !url.includes('youtu.be');
  };

  return (
    <div className={styles.page}>

      {/* ── Premium Page Hero ─── */}
      <ScrollReveal direction="down">
        <PageHero
          theme="working"
          eyebrow="DCRF Knowledge Broadcasting"
          line1="MONTHLY"
          line2="WEBINARS"
          subtitle="Curated expert sessions on disaster risk, climate resilience, and CSR frameworks — streamed live and archived for DCRF members."
        />
      </ScrollReveal>

      {/* ── Quick Stats Row ─── */}
      <ScrollReveal direction="up" delay={0.07}>
        <div className={styles.quickStats}>
          <div className={styles.qStat}><Radio size={16} /> <span>Live Streaming</span></div>
          <div className={styles.qDivider} />
          <div className={styles.qStat}><BookOpen size={16} /> <span>{webinarVideos.length} Recorded Sessions</span></div>
          <div className={styles.qDivider} />
          <div className={styles.qStat}><Users size={16} /> <span>2,400+ Total Views</span></div>
          <div className={styles.qDivider} />
          <div className={styles.qStat}><Calendar size={16} /> <span>Monthly Cadence</span></div>
        </div>
      </ScrollReveal>

      {/* ── Upcoming Webinar Schedule ─── */}
      {upcomingSchedule.length > 0 && (
        <ScrollReveal direction="up" delay={0.09}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Upcoming</span>
            <h2 className={styles.sectionTitle}>Next Sessions</h2>
          </div>
          <div className={styles.scheduleList}>
            {upcomingSchedule.map((s, i) => (
              <div key={i} className={styles.scheduleRow}>
                <div className={styles.schedDate}>
                  <span className={styles.schedMonth}>{s.month}</span>
                  <span className={styles.schedDay}>{s.day}</span>
                </div>
                <div className={styles.schedInfo}>
                  <div className={styles.schedTopic}>{s.topic}</div>
                  <h4 className={styles.schedSessionTitle}>{s.title}</h4>
                  <span className={styles.schedSpeaker}>{s.speaker}</span>
                </div>
                <div className={styles.schedMeta}>
                  <span className={styles.schedDuration}><Clock size={12} /> {s.duration}</span>
                  <button className={styles.schedRegBtn}>Register <ChevronRight size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}

      {/* ── Speaker Spotlight ─── */}
      {speakers.length > 0 && (
        <ScrollReveal direction="up" delay={0.08}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Speakers</span>
            <h2 className={styles.sectionTitle}>Expert Panel</h2>
          </div>
          <div className={styles.speakersRow}>
            {speakers.map((sp, i) => (
              <ScrollReveal key={i} direction="up" delay={0.05 * i}>
                <div className={styles.speakerCard}>
                  <div className={styles.speakerAvatar} style={{ background: `${sp.color}18`, color: sp.color, borderColor: `${sp.color}30` }}>
                    {sp.initials}
                  </div>
                  <div className={styles.speakerName}>{sp.name}</div>
                  <div className={styles.speakerTitle}>{sp.title}</div>
                  <div className={styles.speakerOrg} style={{ color: sp.color }}>{sp.org}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>
      )}

      {/* ── Video Archive ─── */}
      <ScrollReveal direction="up" delay={0.08}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Archive</span>
          <h2 className={styles.sectionTitle}>Past Sessions</h2>
        </div>
      </ScrollReveal>

      {/* Topic filter pills */}
      {topics.length > 1 && (
        <ScrollReveal direction="up" delay={0.05}>
          <div className={styles.filterPills}>
            <Filter size={14} className={styles.filterIcon} />
            {topics.map(topic => (
              <button
                key={topic}
                className={`${styles.pill} ${activeTopic === topic ? styles.pillActive : ''}`}
                onClick={() => setActiveTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </ScrollReveal>
      )}

      {/* Videos grid */}
      <div className={styles.videoGrid}>
        {filteredVideos.map((video, idx) => {
          const isPlaying = playingVideoId === video.id;
          return (
            <ScrollReveal key={video.id} direction="up" delay={0.06 * idx}>
              <div className={styles.videoCard}>
                <div className={styles.playerWrapper}>
                  {isPlaying ? (
                    isLocalVideo(video.embedUrl) ? (
                      <video
                        src={video.embedUrl}
                        autoPlay
                        controls
                        className={styles.iframe}
                      />
                    ) : (
                      <iframe
                        src={getPlayUrl(video.embedUrl)}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className={styles.iframe}
                      />
                    )
                  ) : (
                    <div
                      className={styles.posterContainer}
                      onClick={() => setPlayingVideoId(video.id)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Play: ${video.title}`}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setPlayingVideoId(video.id)}
                    >
                      {video.posterUrl ? (
                        <img src={video.posterUrl} alt={video.title} className={styles.posterImage} />
                      ) : (
                        <div className={styles.posterPlaceholder}>
                          <Play size={32} />
                        </div>
                      )}
                      <div className={styles.playOverlay}>
                        <div className={styles.playButtonCircle}>
                          <Play size={20} fill="currentColor" className={styles.playIcon} />
                        </div>
                      </div>
                      {video.duration && <span className={styles.durationChip}>{video.duration}</span>}
                    </div>
                  )}
                </div>
                <div className={styles.videoInfo}>
                  {video.category && (
                    <span className={styles.videoBadge} style={{ background: `${video.categoryColor}15`, color: video.categoryColor }}>
                      {video.category}
                    </span>
                  )}
                  <h3 className={styles.videoTitle}>{video.title}</h3>
                  <p className={styles.videoDesc}>{video.description}</p>
                  {video.date && <span className={styles.videoDate}>{video.date}</span>}
                </div>
              </div>
            </ScrollReveal>
          );
        })}
        {filteredVideos.length === 0 && (
          <div className={styles.emptyState}>No sessions found for this topic yet.</div>
        )}
      </div>

    </div>
  );
}
