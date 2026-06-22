'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { useToast } from '@/components/ui/Toast/ToastContext';
import PageHero from '@/components/ui/PageHero/PageHero';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat,
  ExternalLink, Headphones, Mic, Clock, Calendar, Tag, PlayCircle,
  ChevronRight, Radio, X
} from 'lucide-react';

const TAG_COLORS: Record<string, string> = {
  'Climate Finance': 'var(--teal-primary)',
  'Heatwaves':       'var(--orange-primary)',
  'Floods':          'var(--blue-primary)',
  'Early Warning':   '#6366f1',
  'Policy':          'var(--navy-medium)',
  'Glaciers':        '#0891b2'
};

const CATEGORIES = ['All Episodes', 'Climate Finance', 'Heatwaves', 'Floods', 'Policy', 'Early Warning', 'Glaciers'];

interface PodcastsClientProps {
  initialEpisodes: any[];
  initialVideos: any[];
}

export default function PodcastsClient({ initialEpisodes, initialVideos }: PodcastsClientProps) {
  const { info } = useToast();
  const podcastEpisodes = initialEpisodes;
  const videoInterviews = initialVideos;

  const [activeEpisodeId, setActiveEpisodeId] = useState(podcastEpisodes[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [volume, setVolume] = useState(80);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Episodes');
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  // Unified audio/video elements refs and states
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState(0);
  const [curTimeSec, setCurTimeSec] = useState(0);

  const currentEp = podcastEpisodes.find((e: any) => e.id === activeEpisodeId) ?? podcastEpisodes[0];
  const [totalTimeString, setTotalTimeString] = useState(currentEp?.duration || '0:00');

  const isVideo = !!currentEp?.videoUrl;
  const tagColor = TAG_COLORS[currentEp?.tag] ?? 'var(--gold-primary)';

  const filteredEps = activeCategory === 'All Episodes'
    ? podcastEpisodes
    : podcastEpisodes.filter((ep: any) => ep.tag === activeCategory);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const media = e.currentTarget;
    const cur = media.currentTime;
    const dur = media.duration || 0;
    setCurTimeSec(cur);
    if (dur > 0) {
      setProgress((cur / dur) * 100);
    }
    setCurrentTime(formatTime(cur));
  };

  const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
    const media = e.currentTarget;
    media.volume = volume / 100;
    const dur = media.duration;
    if (dur && isFinite(dur)) {
      setDuration(dur);
      setTotalTimeString(formatTime(dur));
    }
  }, [volume]);

  const loadEpisode = useCallback((id: string) => {
    setActiveEpisodeId(id);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime('0:00');
    setCurTimeSec(0);
    setDuration(0);
  }, []);

  const handleNext = useCallback(() => {
    if (podcastEpisodes.length === 0) return;
    let nextIdx = 0;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * podcastEpisodes.length);
    } else {
      const curIdx = podcastEpisodes.findIndex((e: any) => e.id === activeEpisodeId);
      nextIdx = (curIdx + 1) % podcastEpisodes.length;
    }
    const nextEp = podcastEpisodes[nextIdx];
    if (nextEp) {
      loadEpisode(nextEp.id);
    }
  }, [activeEpisodeId, isShuffle, podcastEpisodes, loadEpisode]);

  const handlePrev = useCallback(() => {
    if (podcastEpisodes.length === 0) return;
    const curIdx = podcastEpisodes.findIndex((e: any) => e.id === activeEpisodeId);
    let prevIdx = curIdx - 1;
    if (prevIdx < 0) prevIdx = podcastEpisodes.length - 1;
    const prevEp = podcastEpisodes[prevIdx];
    if (prevEp) {
      loadEpisode(prevEp.id);
    }
  }, [activeEpisodeId, podcastEpisodes, loadEpisode]);

  const handleEnded = useCallback(() => {
    if (isRepeat) {
      const activeMedia = isVideo ? videoRef.current : audioRef.current;
      if (activeMedia) {
        activeMedia.currentTime = 0;
        activeMedia.play().catch(err => console.error(err));
      }
    } else {
      handleNext();
    }
  }, [isRepeat, isVideo, handleNext]);

  const togglePlay = useCallback(() => {
    setIsPlaying(p => !p);
  }, []);

  const seekProgress = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const activeMedia = isVideo ? videoRef.current : audioRef.current;
    if (activeMedia && activeMedia.duration) {
      activeMedia.currentTime = pct * activeMedia.duration;
      setProgress(pct * 100);
      setCurTimeSec(pct * activeMedia.duration);
      setCurrentTime(formatTime(pct * activeMedia.duration));
    }
  }, [isVideo]);

  const handleVideoPlay = useCallback((url: string) => {
    setIsPlaying(false);
    setPlayingVideoUrl(url);
  }, []);

  // Effects to synchronize play state and volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.pause();
    if (videoRef.current) videoRef.current.pause();

    const activeMedia = isVideo ? videoRef.current : audioRef.current;
    if (activeMedia) {
      activeMedia.load();
      if (isPlaying) {
        activeMedia.play().catch(err => {
          console.warn("Autoplay failed:", err);
          setIsPlaying(false);
        });
      }
    }
  }, [activeEpisodeId, isVideo]);

  useEffect(() => {
    const activeMedia = isVideo ? videoRef.current : audioRef.current;
    if (activeMedia) {
      if (isPlaying) {
        activeMedia.play().catch(err => {
          console.warn("Play failed:", err);
          setIsPlaying(false);
        });
      } else {
        activeMedia.pause();
      }
    }
  }, [isPlaying, isVideo]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    if (videoRef.current) videoRef.current.volume = volume / 100;
  }, [volume]);

  // Sync initial string display fallback
  useEffect(() => {
    setTotalTimeString(currentEp?.duration || '0:00');
  }, [currentEp]);

  return (
    <div className={styles.page}>
      {/* ── Premium Page Hero ─── */}
      <ScrollReveal direction="down">
        <PageHero
          theme="news"
          eyebrow="DCRF Podcast Series"
          line1="INTELLIGENCE"
          line2="FROM THE FIELD"
          subtitle="Deep conversations with disaster managers, climate researchers and policy experts shaping India's resilience agenda."
        />
      </ScrollReveal>

      {/* ── Header Stats ─── */}
      <ScrollReveal direction="up" delay={0.06}>
        <div className={styles.headerStats}>
          <div className={styles.stat}><Headphones size={16} /><span><strong>{podcastEpisodes.length}</strong> Episodes</span></div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><Mic size={16} /><span><strong>12+</strong> Experts</span></div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><Clock size={16} /><span><strong>9h+</strong> of Content</span></div>
        </div>
      </ScrollReveal>

      {/* ── Category Filter ─── */}
      <ScrollReveal direction="up" delay={0.08}>
        <div className={styles.categoryBar}>
          {CATEGORIES.map(cat => (
            <button key={cat}
              className={`${styles.catChip} ${activeCategory === cat ? styles.catActive : ''}`}
              onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* ── Main Player + Episode List ─── */}
      <div className={styles.stageGrid}>
        {/* LEFT: Featured Player Card */}
        <ScrollReveal direction="right" delay={0.12}>
          <div className={styles.playerCard}>
            <div className={styles.artworkWrap} style={{ '--tag-color': tagColor } as React.CSSProperties}>
              <div className={styles.artworkGlow} />
              
              {isVideo && currentEp?.videoUrl ? (
                <video
                  ref={videoRef}
                  src={currentEp.videoUrl}
                  className={styles.playerVideo}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleEnded}
                  playsInline
                  onClick={togglePlay}
                />
              ) : (
                <div className={styles.artworkInner}>
                  {currentEp?.imageUrl ? (
                    <img src={currentEp.imageUrl} alt={currentEp.title} className={styles.artworkImg} />
                  ) : (
                    <span className={styles.artworkEmoji}>🎙️</span>
                  )}
                  <div className={styles.equaliser}>
                    {[1,2,3,4,5,6,7,8].map(b => (
                      <div key={b} className={`${styles.eqBar} ${isPlaying ? styles.eqActive : ''}`}
                        style={{ animationDelay: `${b * 0.12}s` }} />
                    ))}
                  </div>
                </div>
              )}

              <div className={`${styles.playingBadge} ${isPlaying ? styles.playingBadgeVisible : ''}`}>
                <span className={styles.dot} /> Now Playing
              </div>
              <div className={styles.epChip}>Ep. {currentEp?.episodeNumber}</div>
            </div>

            <div className={styles.playerInfo}>
              <span className={styles.playerTag} style={{ color: tagColor, background: `${tagColor}18` }}>
                <Tag size={10} /> {currentEp?.tag}
              </span>
              <h2 className={styles.playerTitle}>{currentEp?.title}</h2>
              {currentEp?.description && <p className={styles.playerDesc}>{currentEp.description}</p>}
              <div className={styles.speakerCard}>
                <div className={styles.speakerAvatar} style={{ background: tagColor }}>
                  {currentEp?.speaker?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                </div>
                <div className={styles.speakerInfo}>
                  <span className={styles.speakerLabel}>Featured Guest</span>
                  <span className={styles.speakerName}>{currentEp?.speaker}</span>
                  <span className={styles.speakerTitle}>{currentEp?.speakerTitle}</span>
                </div>
              </div>
            </div>

            <div className={styles.controlsDeck}>
              {/* Hidden audio element */}
              {!isVideo && (
                <audio
                  ref={audioRef}
                  src={currentEp?.audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleEnded}
                />
              )}

              <div className={styles.progressTrack} onClick={seekProgress} ref={progressRef}
                role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Episode progress">
                <div className={styles.progressFill} style={{ width: `${progress}%` }}>
                  <div className={styles.progressThumb} />
                </div>
              </div>
              <div className={styles.timeRow}>
                <span>{currentTime}</span>
                <span>{totalTimeString}</span>
              </div>
              <div className={styles.controlBtns}>
                <button className={`${styles.ctrlBtn} ${isShuffle ? styles.ctrlActive : ''}`}
                  onClick={() => setIsShuffle(s => !s)} aria-label="Shuffle"><Shuffle size={16} /></button>
                <button className={styles.ctrlBtn} onClick={handlePrev} aria-label="Previous"><SkipBack size={20} /></button>
                <button className={styles.playBtn} onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" style={{ marginLeft: '2px' }} />}
                </button>
                <button className={styles.ctrlBtn} onClick={handleNext} aria-label="Next"><SkipForward size={20} /></button>
                <button className={`${styles.ctrlBtn} ${isRepeat ? styles.ctrlActive : ''}`}
                  onClick={() => setIsRepeat(r => !r)} aria-label="Repeat"><Repeat size={16} /></button>
              </div>
              <div className={styles.volumeRow}>
                <Volume2 size={14} className={styles.volIcon} />
                <input type="range" min={0} max={100} value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  className={styles.volSlider} aria-label="Volume"
                  style={{ '--vol-pct': `${volume}%` } as React.CSSProperties} />
                <span className={styles.volLabel}>{volume}%</span>
              </div>
            </div>

            <div className={styles.playerMeta}>
              <span><Calendar size={12} /> {currentEp?.date}</span>
              <span><Clock size={12} /> {totalTimeString}</span>
              <a href="#" className={styles.shareLink}
                onClick={e => { e.preventDefault(); info('Share link copied!', 'Episode link has been copied to clipboard.'); }}>
                <ExternalLink size={12} /> Share
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
            {filteredEps.map((ep: any, idx: number) => {
              const isActive = ep.id === activeEpisodeId;
              const epTagColor = TAG_COLORS[ep.tag] ?? 'var(--gold-primary)';
              return (
                <ScrollReveal key={ep.id} direction="left" delay={0.04 * idx}>
                  <button
                    className={`${styles.epRow} ${isActive ? styles.epRowActive : ''}`}
                    onClick={() => loadEpisode(ep.id)}
                    aria-current={isActive ? 'true' : 'false'}>
                    <div className={styles.epNum}>
                      {isActive && isPlaying ? (
                        <div className={styles.miniEq}>
                          {[1,2,3].map(b => <div key={b} className={styles.miniEqBar} style={{ animationDelay: `${b * 0.15}s` }} />)}
                        </div>
                      ) : (
                        <span>{String(ep.episodeNumber).padStart(2, '0')}</span>
                      )}
                    </div>
                    <div className={styles.epBody}>
                      <div className={styles.epTopRow}>
                        <span className={styles.epTag} style={{ color: epTagColor }}>{ep.tag}</span>
                        <span className={styles.epDur}><Clock size={10} />{ep.duration}</span>
                      </div>
                      <p className={styles.epTitle}>{ep.title}</p>
                      <span className={styles.epSpeaker}>{ep.speaker} · {ep.speakerTitle}</span>
                    </div>
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

      {/* ── Video Interviews ─── */}
      <section className={styles.videoSection}>
        <ScrollReveal direction="up">
          <div className={styles.videoSectionHeader}>
            <div className={styles.headerBadge}><PlayCircle size={14} /><span>Video Series</span></div>
            <h3 className={styles.videoSectionTitle}>Resilience Leader Interviews</h3>
            <p className={styles.videoSectionSub}>Behind-the-scenes conversations with the architects of India's climate resilience policy.</p>
          </div>
        </ScrollReveal>

        <div className={styles.videoGrid}>
          {videoInterviews.map((v: any, i: number) => (
            <ScrollReveal key={i} direction="up" delay={0.1 * (i + 1)}>
              <div className={styles.videoCard}>
                <div className={styles.videoThumb} style={{ background: v.gradient }}>
                  <div className={styles.videoWave}>
                    {[...Array(20)].map((_, b) => (
                      <div key={b} className={styles.videoWaveBar}
                        style={{ height: `${20 + Math.sin(b * 0.8) * 18}px`, opacity: 0.4 + Math.sin(b * 0.5) * 0.3 }} />
                    ))}
                  </div>
                  <button className={styles.videoPlayBtn} onClick={() => handleVideoPlay(v.embedUrl)} aria-label={`Play: ${v.title}`}>
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
                      {v.guest?.split(' ').slice(-1)[0]?.[0]}
                    </div>
                    <div>
                      <p className={styles.guestName}>{v.guest}</p>
                      <p className={styles.guestRole}>{v.guestTitle}</p>
                    </div>
                  </div>
                  <div className={styles.videoFooter}>
                    <span className={styles.videoDate}><Calendar size={11} /> {v.date}</span>
                    <button className={styles.videoWatchBtn} onClick={() => handleVideoPlay(v.embedUrl)}>
                      Watch <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Subscribe Banner ─── */}
      <ScrollReveal direction="up" delay={0.05}>
        <div className={styles.subscribeBanner}>
          <div className={styles.subscribeLeft}>
            <div className={styles.subscribePulse}><Radio size={24} /></div>
            <div>
              <h4 className={styles.subscribeTitle}>Never miss an episode</h4>
              <p className={styles.subscribeSub}>Get notified when DCRF releases new conversations with climate leaders.</p>
            </div>
          </div>
          <div className={styles.subscribePlatforms}>
            {['Spotify', 'Apple Podcasts', 'Google Podcasts'].map(p => (
              <button key={p} className={styles.platformBtn}
                onClick={() => info(`Opening ${p}`, 'Podcast platform integration coming soon.')}>{p}</button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ── Video Lightbox Modal ─── */}
      {playingVideoUrl && (
        <div className={styles.videoModalOverlay} onClick={() => setPlayingVideoUrl(null)}>
          <div className={styles.videoModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.videoModalClose} onClick={() => setPlayingVideoUrl(null)} aria-label="Close">
              <X size={20} />
            </button>
            <div className={styles.modalPlayerWrapper}>
              <iframe
                src={`${playingVideoUrl}?autoplay=1`}
                title="DCRF Video Interview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
