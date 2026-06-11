'use client';

import React, { useState, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { podcastEpisodes } from '@/data/dataStore';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Shuffle,
  Repeat,
  ExternalLink,
  Headphones,
  Mic,
  Clock,
  Calendar,
  Tag,
  PlayCircle,
  ChevronRight,
  Radio
} from 'lucide-react';

// ─── Tag colour mapping ───────────────────────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
  'Climate Finance': 'var(--teal-primary)',
  'Heatwaves':       'var(--orange-primary)',
  'Floods':          'var(--blue-primary)',
  'Early Warning':   '#6366f1',
  'Policy':          'var(--navy-medium)',
  'Glaciers':        '#0891b2'
};

// Category pill list
const CATEGORIES = ['All Episodes', 'Climate Finance', 'Heatwaves', 'Floods', 'Policy', 'Early Warning', 'Glaciers'];

// Speaker avatar colours
const AVATAR_PALETTE = [
  '#991B1B', '#0E7A6B', '#2980B9', '#6C3483', '#E67E22', '#0f172a'
];

export default function PodcastsPage() {
  const { info } = useToast();

  const [activeEpisodeId, setActiveEpisodeId] = useState(podcastEpisodes[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(38);
  const [currentTime, setCurrentTime] = useState('16:12');
  const [volume, setVolume] = useState(80);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Episodes');

  const progressRef = useRef<HTMLDivElement>(null);

  const currentEp = podcastEpisodes.find(e => e.id === activeEpisodeId) ?? podcastEpisodes[0];
  const tagColor = TAG_COLORS[currentEp.tag] ?? 'var(--gold-primary)';

  // Filtered list
  const filteredEps = activeCategory === 'All Episodes'
    ? podcastEpisodes
    : podcastEpisodes.filter(ep => ep.tag === activeCategory);

  // ── Controls ────────────────────────────────────────────────────────────────

  const togglePlay = useCallback(() => {
    setIsPlaying(p => !p);
  }, []);

  const loadEpisode = useCallback((id: string) => {
    setActiveEpisodeId(id);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime('0:00');
  }, []);

  const seekProgress = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    setProgress(pct);
    // Mock time label
    const totalSec = 42 * 60 + 8;
    const cur = Math.round((pct / 100) * totalSec);
    setCurrentTime(`${Math.floor(cur / 60)}:${String(cur % 60).padStart(2, '0')}`);
  }, []);

  const handleVideoPlay = useCallback(() => {
    info('Video player coming soon', 'YouTube integration is on the roadmap for this episode.');
  }, [info]);

  return (
    <div className={styles.page}>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <div className={styles.headerBadge}>
            <Radio size={14} />
            <span>DCRF Podcast Series</span>
          </div>
          <h1 className={styles.title}>
            Intelligence from the <em>field</em>
          </h1>
          <p className={styles.subtitle}>
            Deep conversations with disaster managers, climate researchers and policy experts shaping India's resilience agenda.
          </p>
          <div className={styles.headerStats}>
            <div className={styles.stat}>
              <Headphones size={16} />
              <span><strong>14</strong> Episodes</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <Mic size={16} />
              <span><strong>12+</strong> Experts</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <Clock size={16} />
              <span><strong>9h+</strong> of Content</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ── Category Filter ──────────────────────────────────────────────── */}
      <ScrollReveal direction="up" delay={0.08}>
        <div className={styles.categoryBar}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.catChip} ${activeCategory === cat ? styles.catActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* ── Main Player + Episode List ───────────────────────────────────── */}
      <div className={styles.stageGrid}>

        {/* LEFT: Featured Player Card */}
        <ScrollReveal direction="right" delay={0.12}>
          <div className={styles.playerCard}>

            {/* Artwork */}
            <div className={styles.artworkWrap} style={{ '--tag-color': tagColor } as React.CSSProperties}>
              <div className={styles.artworkGlow} />
              <div className={styles.artworkInner}>
                <span className={styles.artworkEmoji}>🎙️</span>
                {/* Animated equaliser bars */}
                <div className={styles.equaliser}>
                  {[1,2,3,4,5,6,7,8].map(b => (
                    <div
                      key={b}
                      className={`${styles.eqBar} ${isPlaying ? styles.eqActive : ''}`}
                      style={{ animationDelay: `${b * 0.12}s` }}
                    />
                  ))}
                </div>
              </div>
              {/* Playing badge */}
              <div className={`${styles.playingBadge} ${isPlaying ? styles.playingBadgeVisible : ''}`}>
                <span className={styles.dot} />
                Now Playing
              </div>
              {/* Episode number chip */}
              <div className={styles.epChip}>Ep. {currentEp.episodeNumber}</div>
            </div>

            {/* Info */}
            <div className={styles.playerInfo}>
              <span className={styles.playerTag} style={{ color: tagColor, background: `${tagColor}18` }}>
                <Tag size={10} />
                {currentEp.tag}
              </span>
              <h2 className={styles.playerTitle}>{currentEp.title}</h2>
              {currentEp.description && (
                <p className={styles.playerDesc}>{currentEp.description}</p>
              )}

              {/* Speaker card */}
              <div className={styles.speakerCard}>
                <div
                  className={styles.speakerAvatar}
                  style={{ background: tagColor }}
                >
                  {currentEp.speaker.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className={styles.speakerInfo}>
                  <span className={styles.speakerLabel}>Featured Guest</span>
                  <span className={styles.speakerName}>{currentEp.speaker}</span>
                  <span className={styles.speakerTitle}>{currentEp.speakerTitle}</span>
                </div>
              </div>
            </div>

            {/* Controls deck */}
            <div className={styles.controlsDeck}>
              {/* Progress */}
              <div
                className={styles.progressTrack}
                onClick={seekProgress}
                ref={progressRef}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label="Episode progress"
              >
                <div className={styles.progressFill} style={{ width: `${progress}%` }}>
                  <div className={styles.progressThumb} />
                </div>
              </div>
              <div className={styles.timeRow}>
                <span>{currentTime}</span>
                <span>{currentEp.duration}</span>
              </div>

              {/* Playback buttons */}
              <div className={styles.controlBtns}>
                <button
                  className={`${styles.ctrlBtn} ${isShuffle ? styles.ctrlActive : ''}`}
                  onClick={() => setIsShuffle(s => !s)}
                  aria-label="Shuffle"
                >
                  <Shuffle size={16} />
                </button>
                <button className={styles.ctrlBtn} aria-label="Previous">
                  <SkipBack size={20} />
                </button>
                <button
                  className={styles.playBtn}
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying
                    ? <Pause size={22} fill="currentColor" />
                    : <Play size={22} fill="currentColor" style={{ marginLeft: '2px' }} />
                  }
                </button>
                <button className={styles.ctrlBtn} aria-label="Next">
                  <SkipForward size={20} />
                </button>
                <button
                  className={`${styles.ctrlBtn} ${isRepeat ? styles.ctrlActive : ''}`}
                  onClick={() => setIsRepeat(r => !r)}
                  aria-label="Repeat"
                >
                  <Repeat size={16} />
                </button>
              </div>

              {/* Volume */}
              <div className={styles.volumeRow}>
                <Volume2 size={14} className={styles.volIcon} />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  className={styles.volSlider}
                  aria-label="Volume"
                  style={{ '--vol-pct': `${volume}%` } as React.CSSProperties}
                />
                <span className={styles.volLabel}>{volume}%</span>
              </div>
            </div>

            {/* Date / meta row */}
            <div className={styles.playerMeta}>
              <span><Calendar size={12} /> {currentEp.date}</span>
              <span><Clock size={12} /> {currentEp.duration}</span>
              <a
                href="#"
                className={styles.shareLink}
                onClick={e => { e.preventDefault(); info('Share link copied!', 'Episode link has been copied to clipboard.'); }}
              >
                <ExternalLink size={12} />
                Share
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* RIGHT: Episode List */}
        <div className={styles.episodePanel}>
          <ScrollReveal direction="left" delay={0.1}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Episode Archive</h3>
              <span className={styles.episodeCount}>{filteredEps.length} episodes</span>
            </div>
          </ScrollReveal>

          <div className={styles.episodeList}>
            {filteredEps.map((ep, idx) => {
              const isActive = ep.id === activeEpisodeId;
              const epTagColor = TAG_COLORS[ep.tag] ?? 'var(--gold-primary)';
              return (
                <ScrollReveal key={ep.id} direction="left" delay={0.04 * idx}>
                  <button
                    className={`${styles.epRow} ${isActive ? styles.epRowActive : ''}`}
                    onClick={() => loadEpisode(ep.id)}
                    aria-current={isActive ? 'true' : 'false'}
                  >
                    {/* Number / playing indicator */}
                    <div className={styles.epNum}>
                      {isActive && isPlaying ? (
                        <div className={styles.miniEq}>
                          {[1,2,3].map(b => <div key={b} className={styles.miniEqBar} style={{ animationDelay: `${b * 0.15}s` }} />)}
                        </div>
                      ) : (
                        <span>{String(ep.episodeNumber).padStart(2, '0')}</span>
                      )}
                    </div>

                    {/* Episode body */}
                    <div className={styles.epBody}>
                      <div className={styles.epTopRow}>
                        <span className={styles.epTag} style={{ color: epTagColor }}>
                          {ep.tag}
                        </span>
                        <span className={styles.epDur}><Clock size={10} />{ep.duration}</span>
                      </div>
                      <p className={styles.epTitle}>{ep.title}</p>
                      <span className={styles.epSpeaker}>{ep.speaker} · {ep.speakerTitle}</span>
                    </div>

                    {/* Play chevron */}
                    <div className={`${styles.epPlayIcon} ${isActive ? styles.epPlayIconActive : ''}`}>
                      {isActive && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    </div>
                  </button>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Video Interviews ─────────────────────────────────────────────── */}
      <section className={styles.videoSection}>
        <ScrollReveal direction="up">
          <div className={styles.videoSectionHeader}>
            <div className={styles.headerBadge}>
              <PlayCircle size={14} />
              <span>Video Series</span>
            </div>
            <h3 className={styles.videoSectionTitle}>Resilience Leader Interviews</h3>
            <p className={styles.videoSectionSub}>
              Behind-the-scenes conversations with the architects of India's climate resilience policy.
            </p>
          </div>
        </ScrollReveal>

        <div className={styles.videoGrid}>
          {[
            {
              gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0e7a6b 100%)',
              duration: '18:24',
              tag: 'Interview Series',
              title: 'Mobilising Institutional CSR for Disaster Tech',
              date: 'May 12, 2026',
              guest: 'Mr. Ashish Jha',
              guestTitle: 'Secretary General, DCRF',
              delay: 0.1
            },
            {
              gradient: 'linear-gradient(135deg, #0f172a 0%, #2d1b4e 50%, #991b1b 100%)',
              duration: '24:15',
              tag: 'Conclave Preview',
              title: 'DCRC 2026: Convergence & Policy Objectives',
              date: 'Apr 28, 2026',
              guest: 'Dr. Brijender Mishra',
              guestTitle: 'Convener, DCRF',
              delay: 0.2
            }
          ].map((v, i) => (
            <ScrollReveal key={i} direction="up" delay={v.delay}>
              <div className={styles.videoCard}>
                <div className={styles.videoThumb} style={{ background: v.gradient }}>
                  {/* Waveform decoration */}
                  <div className={styles.videoWave}>
                    {[...Array(20)].map((_, b) => (
                      <div key={b} className={styles.videoWaveBar} style={{ height: `${20 + Math.sin(b * 0.8) * 18}px`, opacity: 0.4 + Math.sin(b * 0.5) * 0.3 }} />
                    ))}
                  </div>
                  <button
                    className={styles.videoPlayBtn}
                    onClick={handleVideoPlay}
                    aria-label={`Play video: ${v.title}`}
                  >
                    <div className={styles.videoPlayRipple} />
                    <Play size={22} fill="white" />
                  </button>
                  <span className={styles.videoDuration}>{v.duration}</span>
                  <span className={styles.videoTagBadge}>{v.tag}</span>
                </div>
                <div className={styles.videoBody}>
                  <h4 className={styles.videoTitle}>{v.title}</h4>
                  <div className={styles.videoGuest}>
                    <div className={styles.guestAvatarMini} style={{ background: i === 0 ? 'var(--teal-primary)' : 'var(--gold-primary)' }}>
                      {v.guest.split(' ').slice(-1)[0][0]}
                    </div>
                    <div>
                      <p className={styles.guestName}>{v.guest}</p>
                      <p className={styles.guestRole}>{v.guestTitle}</p>
                    </div>
                  </div>
                  <div className={styles.videoFooter}>
                    <span className={styles.videoDate}><Calendar size={11} /> {v.date}</span>
                    <button
                      className={styles.videoWatchBtn}
                      onClick={handleVideoPlay}
                    >
                      Watch <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Subscribe Banner ─────────────────────────────────────────────── */}
      <ScrollReveal direction="up" delay={0.05}>
        <div className={styles.subscribeBanner}>
          <div className={styles.subscribeLeft}>
            <div className={styles.subscribePulse}>
              <Radio size={24} />
            </div>
            <div>
              <h4 className={styles.subscribeTitle}>Never miss an episode</h4>
              <p className={styles.subscribeSub}>Get notified when DCRF releases new conversations with climate leaders.</p>
            </div>
          </div>
          <div className={styles.subscribePlatforms}>
            {['Spotify', 'Apple Podcasts', 'Google Podcasts'].map(p => (
              <button
                key={p}
                className={styles.platformBtn}
                onClick={() => info(`Opening ${p}`, 'Podcast platform integration coming soon.')}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
