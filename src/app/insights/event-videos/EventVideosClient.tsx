'use client';

import React, { useState } from 'react';
import { Play, Calendar, Users, BookOpen, Radio, Filter, Clock, ChevronRight } from 'lucide-react';
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
  topic: string;
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
    topic: 'Heat Action',
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
    topic: 'Flood Risk',
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
    topic: 'CSR & ESG',
  },
];

const upcomingSchedule = [
  { month: 'JUL', day: '18', title: 'Urban Flooding: Stormwater Resilience Frameworks', speaker: 'Dr. Kavita Sharma, IIT Delhi', duration: '60 min', topic: 'Flood Risk' },
  { month: 'AUG', day: '22', title: 'Cyclone Preparedness & Early Warning Integration', speaker: 'Capt. Ramesh Patel, IMD', duration: '45 min', topic: 'Cyclone' },
  { month: 'SEP', day: '12', title: 'CSR for Climate Resilient Infrastructure', speaker: 'Priya Menon, CII Sustainability', duration: '75 min', topic: 'CSR & ESG' },
];

const speakers = [
  { name: 'Dr. Kavita Sharma', title: 'Prof. of Urban Planning', org: 'IIT Delhi', initials: 'KS', color: '#b91c1c' },
  { name: 'Capt. Ramesh Patel', title: 'Director, Cyclone Ops', org: 'IMD', initials: 'RP', color: '#0f766e' },
  { name: 'Priya Menon', title: 'Head of Sustainability', org: 'CII', initials: 'PM', color: '#7c3aed' },
  { name: 'Arjun Malhotra', title: 'Senior Researcher', org: 'TERI', initials: 'AM', color: '#b45309' },
];

const ALL_TOPICS = ['All', 'Heat Action', 'Flood Risk', 'CSR & ESG', 'Cyclone'];

interface EventVideosClientProps {
  pageData: PageData;
}

export default function EventVideosClient({ pageData }: EventVideosClientProps) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState('All');

  const filteredVideos = activeTopic === 'All'
    ? webinarVideos
    : webinarVideos.filter(v => v.topic === activeTopic);

  return (
    <div className={styles.page}>

      {/* ── Premium Page Hero (working theme — distinct from events) ─── */}
      <ScrollReveal direction="down">
        <PageHero
          theme="working"
          eyebrow="DCRF Knowledge Broadcasting"
          line1="MONTHLY"
          line2="WEBINARS"
          subtitle="Curated expert sessions on disaster risk, climate resilience, and CSR frameworks — streamed live and archived for DCRF members."
        />
      </ScrollReveal>

      {/* ── Quick Stats Row ───────────────────────────────────────────── */}
      <ScrollReveal direction="up" delay={0.07}>
        <div className={styles.quickStats}>
          <div className={styles.qStat}><Radio size={16} /> <span>Live Streaming</span></div>
          <div className={styles.qDivider} />
          <div className={styles.qStat}><BookOpen size={16} /> <span>3 Recorded Sessions</span></div>
          <div className={styles.qDivider} />
          <div className={styles.qStat}><Users size={16} /> <span>2,400+ Total Views</span></div>
          <div className={styles.qDivider} />
          <div className={styles.qStat}><Calendar size={16} /> <span>Monthly Cadence</span></div>
        </div>
      </ScrollReveal>

      {/* ── Upcoming Webinar Schedule ─────────────────────────────────── */}
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

      {/* ── Speaker Spotlight ─────────────────────────────────────────── */}
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

      {/* ── Video Archive ─────────────────────────────────────────────── */}
      <ScrollReveal direction="up" delay={0.08}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Archive</span>
          <h2 className={styles.sectionTitle}>Past Sessions</h2>
        </div>
      </ScrollReveal>

      {/* Topic filter pills */}
      <ScrollReveal direction="up" delay={0.05}>
        <div className={styles.filterPills}>
          <Filter size={14} className={styles.filterIcon} />
          {ALL_TOPICS.map(topic => (
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

      {/* Videos grid */}
      <div className={styles.videoGrid}>
        {filteredVideos.map((video, idx) => {
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
        {filteredVideos.length === 0 && (
          <div className={styles.emptyState}>No sessions found for this topic yet.</div>
        )}
      </div>

    </div>
  );
}
