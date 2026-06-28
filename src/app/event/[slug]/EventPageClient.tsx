'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2, Calendar, MapPin, CheckCircle, AlertTriangle, ChevronDown,
  Check, Building2, Tag, Users, Award, Shield, Zap, ChevronLeft, ChevronRight, Download, Eye,
  Linkedin, Twitter, Play, X, ExternalLink
} from 'lucide-react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import DisasterEffects from '@/components/ui/DisasterEffects/DisasterEffects';
import PageHero from '@/components/ui/PageHero/PageHero';

export interface PageData {
  slug: string;
  title: string;
  category: string;
  description: string;
  eyebrow?: string;
  videoUrl?: string;
  imageUrl?: string;
  content: string;
  sections?: any[];
}

interface EventPageClientProps {
  slug: string;
  pageData: PageData;
}

const roleOptions = [
  { value: 'Delegate', label: 'Corporate Delegate', description: 'Accredited industry executive pass' },
  { value: 'Speaker', label: 'Panelist / Speaker', description: 'Dcrc panel speaker invitee' },
  { value: 'Sponsor', label: 'Sponsor Partner', description: 'Corporate summit sponsor pass' },
  { value: 'Researcher', label: 'Academic Advisor', description: 'Policy researcher / scholar pass' },
  { value: 'Government', label: 'State Official', description: 'Municipal / government authority pass' },
];

const getFallbackImage = (slug: string) => {
  switch (slug) {
    case 'dcrc-26':
      return 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80';
    case 'monthly-webinars':
      return 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=800&q=80';
    default:
      return 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80';
  }
};

export default function EventPageClient({ slug, pageData }: EventPageClientProps) {
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState('Delegate');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const registerRef = useRef<HTMLDivElement | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const videoScrollRef = useRef<HTMLDivElement | null>(null);
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const videoDragRef = useRef<{ startX: number; scrollLeft: number }>({ startX: 0, scrollLeft: 0 });

  // --- Premium Carousels State ---
  const [activeAgendaIdx, setActiveAgendaIdx] = useState(0);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [activeGlimpseIdx, setActiveGlimpseIdx] = useState(0);
  const [activeSpeakerIdx, setActiveSpeakerIdx] = useState(0);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeCardDetails, setActiveCardDetails] = useState<any | null>(null);

  // --- Fullscreen Lightbox State ---
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxCaptions, setLightboxCaptions] = useState<string[]>([]);
  const [activeLightboxIdx, setActiveLightboxIdx] = useState<number | null>(null);

  const openLightbox = (images: string[], captions: string[], index: number) => {
    setLightboxImages(images);
    setLightboxCaptions(captions);
    setActiveLightboxIdx(index);
  };

  useEffect(() => {
    if (activeLightboxIdx === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveLightboxIdx((prev) => (prev !== null ? (prev - 1 + lightboxImages.length) % lightboxImages.length : null));
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIdx((prev) => (prev !== null ? (prev + 1) % lightboxImages.length : null));
      } else if (e.key === 'Escape') {
        setActiveLightboxIdx(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIdx, lightboxImages]);

  // --- Agenda Email Download Gate State ---
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [gateEmail, setGateEmail] = useState('');
  const [gateName, setGateName] = useState('');
  const [gateDesignation, setGateDesignation] = useState('');
  const [gateMobile, setGateMobile] = useState('');
  const [gateOrg, setGateOrg] = useState('');
  const [gateEntityType, setGateEntityType] = useState('Individual');
  const [gateSubmitting, setGateSubmitting] = useState(false);
  const [gateError, setGateError] = useState('');
  const [pendingDownloadUrl, setPendingDownloadUrl] = useState('');

  useEffect(() => {
    const node = registerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFormVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const clickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', clickOutside);
      document.addEventListener('touchstart', clickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', clickOutside);
      document.removeEventListener('touchstart', clickOutside);
    };
  }, [dropdownOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          company,
          designation,
          role
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit registration request.');
      }

      setIsSuccess(true);
      setSuccessMsg(data.message || 'Your interest has been logged. Our secretariat will verify and approve your delegate pass.');
      setName('');
      setEmail('');
      setCompany('');
      setDesignation('');
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayImage = pageData.imageUrl || (!pageData.videoUrl ? getFallbackImage(slug) : undefined);

  // If this is dcrc-26 conclave, use the complete custom overhaul dashboard
  if (slug === 'dcrc-26') {
    const bannerSection = pageData?.sections?.find((s: any) => s.title === 'Banner Images');
    const actionButtonsSection = pageData?.sections?.find((s: any) => s.title === 'Action Buttons');
    const agendaSection = pageData?.sections?.find((s: any) => s.title === 'Agenda Images');
    const speakersSection = pageData?.sections?.find((s: any) => s.title === 'Speakers');
    const partnersSection = pageData?.sections?.find((s: any) => s.title === 'Partners');
    const glimpseSection = pageData?.sections?.find((s: any) => s.title === 'Glimpse');
    const videosSection = pageData?.sections?.find((s: any) => s.title === 'Videos');
    const aboutSection = pageData?.sections?.find((s: any) => s.title === 'About Details');

    const detailsSection = pageData?.sections?.find((s: any) => s.title === 'Conclave Details');
    const detailsCards = detailsSection?.cards || [];
    const dateCard = detailsCards.find((c: any) => c.title?.toLowerCase() === 'date');
    const venueCard = detailsCards.find((c: any) => c.title?.toLowerCase() === 'venue');
    const locationCard = detailsCards.find((c: any) => c.title?.toLowerCase() === 'location');
    const descriptionCard = detailsCards.find((c: any) => c.title?.toLowerCase() === 'description');

    const bannerCards = bannerSection?.cards || [];
    const agendaCards = agendaSection?.cards || [];
    const videoCards = videosSection?.cards || [];
    const glimpseCards = glimpseSection?.cards || [];
    const speakerCards = speakersSection?.cards || [];
    const partnerCards = partnersSection?.cards || [];
    const aboutCards = aboutSection?.cards || [];

    // Slide auto-play for top banner
    useEffect(() => {
      if (bannerCards.length <= 1) return;
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerCards.length);
      }, 5000);
      return () => clearInterval(interval);
    }, [bannerCards]);

    // Auto-scroll for Speakers carousel
    useEffect(() => {
      if (speakerCards.length <= 1) return;
      const interval = setInterval(() => {
        setActiveSpeakerIdx((prev) => (prev + 1) % speakerCards.length);
      }, 4000); // Change every 4 seconds
      return () => clearInterval(interval);
    }, [speakerCards]);

    // Auto-scroll for Glimpse carousel
    useEffect(() => {
      if (glimpseCards.length <= 1) return;
      const interval = setInterval(() => {
        setActiveGlimpseIdx((prev) => (prev + 1) % glimpseCards.length);
      }, 3500); // Change every 3.5 seconds
      return () => clearInterval(interval);
    }, [glimpseCards]);

    // Auto-scroll for Video Highlights carousel (only if more than 3 videos)
    useEffect(() => {
      if (videoCards.length <= 3 || isVideoDragging) return;
      const interval = setInterval(() => {
        if (videoScrollRef.current) {
          const container = videoScrollRef.current;
          const maxScroll = container.scrollWidth - container.clientWidth;
          if (container.scrollLeft >= maxScroll - 10) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            container.scrollBy({ left: 400, behavior: 'smooth' });
          }
        }
      }, 4000); // Auto-scroll every 4 seconds
      return () => clearInterval(interval);
    }, [videoCards, isVideoDragging]);

    // Agenda download flow — direct open, no gate
    const handleAgendaDownloadClick = (e: React.MouseEvent, url: string) => {
      e.preventDefault();
      window.open(url, '_blank');
    };

    const handleGateSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setGateError('');
      setGateSubmitting(true);
      try {
        const res = await fetch('/api/events/agenda-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: gateEmail,
            name: gateName,
            designation: gateDesignation,
            mobile: gateMobile,
            organizationName: gateOrg,
            entityType: gateEntityType
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit download authorization.');

        localStorage.setItem('agenda_downloader_email', gateEmail);
        setShowEmailGate(false);
        window.open(pendingDownloadUrl, '_blank');
      } catch (err: any) {
        setGateError(err.message || 'An error occurred.');
      } finally {
        setGateSubmitting(false);
      }
    };

    // YouTube embed helper
    const getEmbedUrl = (url: string) => {
      if (!url) return '';
      if (url.includes('youtube.com/embed/')) return url;
      if (url.includes('youtube.com/watch?v=')) {
        return url.replace('watch?v=', 'embed/');
      }
      if (url.includes('youtu.be/')) {
        return url.replace('youtu.be/', 'youtube.com/embed/');
      }
      return url;
    };    const renderSection = (section: any, idx: number) => {
      switch (section.title) {
        case 'Banner Images':
          return (
            <ScrollReveal key={section.id || idx} direction="up" delay={0.1}>
              <div className={styles.carouselContainer}>
                {bannerCards.length > 0 ? (
                  <div className={styles.carouselTrack} style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {bannerCards.map((slide: any, sIdx: number) => (
                      <div key={slide.id || sIdx} className={styles.carouselSlide}>
                        <img src={slide.imageUrl} alt={slide.title} className={styles.slideImage} />
                        <div className={styles.slideOverlay}>
                          <div className={styles.slideContent}>
                            <h3>{slide.title}</h3>
                            <p>{slide.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.carouselSlideSingle}>
                    <img
                      src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
                      alt="Conclave"
                      className={styles.slideImage}
                    />
                    <div className={styles.slideOverlay}>
                      <div className={styles.slideContent}>
                        <h3>Disaster & Climate Resilience Conclave 2026</h3>
                        <p>India’s premier multi-stakeholder alliance driving convergence across climate science, media coordinates, and corporate social investments.</p>
                      </div>
                    </div>
                  </div>
                )}

                {bannerCards.length > 1 && (
                  <>
                    <button
                      className={`${styles.carouselArrow} ${styles.arrowLeft}`}
                      onClick={() => setCurrentSlide((prev) => (prev - 1 + bannerCards.length) % bannerCards.length)}
                      aria-label="Previous slide"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      className={`${styles.carouselArrow} ${styles.arrowRight}`}
                      onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerCards.length)}
                      aria-label="Next slide"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className={styles.carouselDots}>
                      {bannerCards.map((_: any, dIdx: number) => (
                        <button
                          key={dIdx}
                          className={`${styles.carouselDot} ${currentSlide === dIdx ? styles.activeDot : ''}`}
                          onClick={() => setCurrentSlide(dIdx)}
                          aria-label={`Go to slide ${dIdx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </ScrollReveal>
          );

        case 'Action Buttons':
          return (
            <ScrollReveal key={section.id || idx} direction="up" delay={0.15}>
              <div className={styles.actionCardsGrid}>
                {actionButtonsSection?.cards?.map((btn: any, btnIdx: number) => {
                  const extra = btn.extraData || {};
                  const isDownload = extra.isDownload;
                  const downloadUrl = extra.downloadUrl || btn.linkUrl || '/uploads/conclave_agenda.pdf';

                  let onClickHandler = undefined;
                  if (extra.isRegistration) {
                    onClickHandler = (e: React.MouseEvent) => {
                      e.preventDefault();
                      document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
                    };
                  } else if (isDownload) {
                    onClickHandler = (e: React.MouseEvent) => {
                      handleAgendaDownloadClick(e, downloadUrl);
                    };
                  }

                  const isFileLink = btn.linkUrl?.match(/\.(pdf|png|jpe?g|gif|svg)$/i) || btn.linkUrl?.startsWith('/api/files/');
                  return (
                    <a
                      href={btn.linkUrl || '#'}
                      key={btn.id || btnIdx}
                      className={styles.actionCard}
                      onClick={onClickHandler}
                      target={isFileLink && !isDownload ? '_blank' : undefined}
                      rel={isFileLink && !isDownload ? 'noopener noreferrer' : undefined}
                    >
                      <div className={styles.actionCardIconBox}>
                        {isDownload ? <Download size={20} /> : extra.isRegistration ? <Users size={20} /> : <Zap size={20} />}
                      </div>
                      <h4 className={styles.actionCardTitle}>{btn.title}</h4>
                      <p className={styles.actionCardSubtitle}>
                        {isDownload ? 'Download PDF Document' : extra.isRegistration ? 'Apply for Passes' : btn.description || 'Explore Resource'}
                      </p>
                    </a>
                  );
                }) || (
                  <>
                    <a href="#agenda-gallery" className={styles.actionCard}>
                      <div className={styles.actionCardIconBox}><Download size={20} /></div>
                      <h4 className={styles.actionCardTitle}>Agenda</h4>
                      <p className={styles.actionCardSubtitle}>Download PDF Document</p>
                    </a>
                    <a href="#register" className={styles.actionCard}>
                      <div className={styles.actionCardIconBox}><Users size={20} /></div>
                      <h4 className={styles.actionCardTitle}>Registration</h4>
                      <p className={styles.actionCardSubtitle}>Apply for Passes</p>
                    </a>
                    <a href="/reports" className={styles.actionCard}>
                      <div className={styles.actionCardIconBox}><Zap size={20} /></div>
                      <h4 className={styles.actionCardTitle}>Partner With US</h4>
                      <p className={styles.actionCardSubtitle}>Explore Resource</p>
                    </a>
                    <a href="/charter-10-point-agenda" className={styles.actionCard}>
                      <div className={styles.actionCardIconBox}><Zap size={20} /></div>
                      <h4 className={styles.actionCardTitle}>Intrest Form</h4>
                      <p className={styles.actionCardSubtitle}>Explore Resource</p>
                    </a>
                  </>
                )}
              </div>
            </ScrollReveal>
          );

        case 'Conclave Details':
          return (
            <React.Fragment key={section.id || idx}>
              <ScrollReveal direction="down" delay={0.05}>
                <div className={styles.detailsStrip}>
                  <div className={styles.detailsCard}>
                    <div className={styles.detailsIcon}>
                      <Calendar size={20} />
                    </div>
                    <div className={styles.detailsText}>
                      <span className={styles.detailsLabel}>{dateCard?.title || 'Date'}</span>
                      <span className={styles.detailsValue}>{dateCard?.description || 'November 26–27, 2026'}</span>
                    </div>
                  </div>
                  <div className={styles.detailsCard}>
                    <div className={styles.detailsIcon}>
                      <Building2 size={20} />
                    </div>
                    <div className={styles.detailsText}>
                      <span className={styles.detailsLabel}>{venueCard?.title || 'Venue'}</span>
                      <span className={styles.detailsValue}>{venueCard?.description || 'Stein Auditorium, IHC'}</span>
                    </div>
                  </div>
                  <div className={styles.detailsCard}>
                    <div className={styles.detailsIcon}>
                      <MapPin size={20} />
                    </div>
                    <div className={styles.detailsText}>
                      <span className={styles.detailsLabel}>{locationCard?.title || 'Location'}</span>
                      <span className={styles.detailsValue}>{locationCard?.description || 'Lodhi Road, New Delhi'}</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up">
                <div className={styles.descriptionBlock}>
                  <h2 className={styles.sectionTitle}>About Dcrc 2026</h2>
                  <div className={styles.aboutContentDiv}>
                    {descriptionCard?.description && <p className={styles.aboutMainDescription}>{descriptionCard.description}</p>}
                    
                    {detailsCards.find((c: any) => c.title?.toLowerCase().includes('highlight')) && (
                      <>
                        <h3 style={{ marginTop: '24px', marginBottom: '16px', color: 'var(--wine-red-primary)', fontSize: '18px', fontWeight: 600 }}>
                          Key Highlights
                        </h3>
                        <div dangerouslySetInnerHTML={{ 
                          __html: detailsCards.find((c: any) => c.title?.toLowerCase().includes('highlight'))?.description || '' 
                        }} />
                      </>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            </React.Fragment>
          );

        case 'Agenda Images':
          return agendaCards.length > 0 ? (
            <section key={section.id || idx} id="agenda-gallery" className={styles.eventSection}>
              <ScrollReveal direction="up">
                <h2 className={styles.sectionTitle}>Conclave Agenda</h2>
                <p className={styles.sectionSub}>Explore the session timelines, panels, and scheduling pages below.</p>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.1}>
                <div className={styles.agendaCarousel}>
                  <div className={styles.agendaTrackWrapper}>
                    <div
                      className={styles.agendaTrack}
                      style={{ transform: `translateX(-${activeAgendaIdx * 100}%)` }}
                    >
                      {agendaCards.map((agenda: any, aIdx: number) => (
                        <div key={agenda.id || aIdx} className={styles.agendaSlide}>
                          <div className={styles.agendaImageWrap}>
                            <img
                              src={agenda.imageUrl}
                              alt={agenda.title}
                              className={styles.agendaImage}
                              onClick={() => window.open(agenda.imageUrl, '_blank')}
                            />
                          </div>
                          <div className={styles.agendaCaption}>
                            <h3>{agenda.title}</h3>
                          </div>
                        </div>
                      ))}
                    </div>

                    {agendaCards.length > 1 && (
                      <>
                        <button
                          type="button"
                          className={`${styles.agendaNavBtn} ${styles.agendaPrev}`}
                          onClick={() => setActiveAgendaIdx(prev => (prev - 1 + agendaCards.length) % agendaCards.length)}
                          aria-label="Previous agenda page"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.agendaNavBtn} ${styles.agendaNext}`}
                          onClick={() => setActiveAgendaIdx(prev => (prev + 1) % agendaCards.length)}
                          aria-label="Next agenda page"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                  </div>

                  {agendaCards.length > 1 && (
                    <div className={styles.agendaTabs}>
                      {agendaCards.map((agenda: any, aIdx: number) => (
                        <button
                          key={aIdx}
                          type="button"
                          className={`${styles.agendaTabBtn} ${aIdx === activeAgendaIdx ? styles.agendaTabActive : ''}`}
                          onClick={() => setActiveAgendaIdx(aIdx)}
                        >
                          {agenda.title || `Page ${aIdx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>

              {/* Three Separate Agenda Actions */}
              <div className={styles.agendaActionsContainer}>
                <button
                  type="button"
                  className={styles.agendaActionBtnSecondary}
                  onClick={() => {
                    const url = agendaCards[0]?.extraData?.downloadUrl || '/uploads/conclave_agenda.pdf';
                    window.open(url, '_blank');
                  }}
                >
                  <Eye size={16} />
                  <span>View Agenda PDF</span>
                </button>

                <button
                  type="button"
                  className={styles.agendaActionBtnSecondary}
                  onClick={() => {
                    const url = agendaCards[0]?.extraData?.downloadUrl || '/uploads/conclave_agenda.pdf';
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'Dcrc_Conclave_Agenda.pdf');
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download size={16} />
                  <span>Download Agenda PDF</span>
                </button>

                <button
                  type="button"
                  className={styles.agendaActionBtnPrimary}
                  onClick={(e) => {
                    const url = agendaCards[0]?.extraData?.downloadUrl || '/uploads/conclave_agenda.pdf';
                    handleAgendaDownloadClick(e, url);
                  }}
                >
                  <Shield size={16} />
                  <span>Download Full Agenda</span>
                </button>
              </div>
            </section>
          ) : null;

        case 'Videos':
          return videoCards.length > 0 ? (
            <div key={section.id || idx} className={styles.sectionGlowWrapper}>
              <section className={styles.eventSection}>
                <ScrollReveal direction="up">
                  <h2 className={styles.sectionTitle}>Conclave Video Highlights</h2>
                  <p className={styles.sectionSub}>Drag to browse — watch leader interviews, technical summaries, and event recordings.</p>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={0.15}>
                  <div className={styles.videoSectionWrapper}>
                    <div
                      ref={videoScrollRef}
                      className={`${styles.videoTrackWrapper} ${isVideoDragging ? styles.videoDragging : ''}`}
                      onMouseDown={(e) => {
                        if (!videoScrollRef.current) return;
                        setIsVideoDragging(true);
                        videoDragRef.current = {
                          startX: e.pageX - videoScrollRef.current.offsetLeft,
                          scrollLeft: videoScrollRef.current.scrollLeft
                        };
                      }}
                      onMouseMove={(e) => {
                        if (!isVideoDragging || !videoScrollRef.current) return;
                        e.preventDefault();
                        const x = e.pageX - videoScrollRef.current.offsetLeft;
                        const walk = (x - videoDragRef.current.startX) * 1.5;
                        videoScrollRef.current.scrollLeft = videoDragRef.current.scrollLeft - walk;
                      }}
                      onMouseUp={() => setIsVideoDragging(false)}
                      onMouseLeave={() => setIsVideoDragging(false)}
                    >
                      <div className={styles.videoTrack}>
                        {videoCards.map((vid: any, vidIdx: number) => (
                          <div key={vid.id || vidIdx} className={styles.videoCard}>
                            <div
                              className={styles.videoThumbWrap}
                              onClick={() => setActiveVideoUrl(vid.linkUrl || vid.imageUrl)}
                            >
                              <img src={vid.imageUrl} alt={vid.title} className={styles.videoThumb} />
                              <div className={styles.videoPlayOverlay}>
                                <div className={styles.playBtnCircle}>
                                  <Play size={20} fill="#fff" style={{ marginLeft: '4px' }} />
                                </div>
                              </div>
                            </div>
                            <div className={styles.videoCardInfo}>
                              <h4>{vid.title}</h4>
                              <p>
                                {vid.description?.length > 90 ? (
                                  <>
                                    {vid.description.slice(0, 90)}...
                                    <button
                                      type="button"
                                      className={styles.readMoreTextBtn}
                                      onClick={() => setActiveCardDetails({ ...vid, sectionName: 'Videos' })}
                                    >
                                      Read More
                                    </button>
                                  </>
                                ) : (
                                  vid.description
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {videoCards.length > 1 && (
                      <div className={styles.sliderControls}>
                        <button
                          type="button"
                          className={styles.sliderNavBtn}
                          onClick={() => {
                            if (videoScrollRef.current) {
                              videoScrollRef.current.scrollLeft -= 400;
                            }
                          }}
                          aria-label="Previous video"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          type="button"
                          className={styles.sliderNavBtn}
                          onClick={() => {
                            if (videoScrollRef.current) {
                              videoScrollRef.current.scrollLeft += 400;
                            }
                          }}
                          aria-label="Next video"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              </section>
            </div>
          ) : null;

        case 'Glimpse':
          return glimpseCards.length > 0 ? (
            <div key={section.id || idx} className={styles.sectionGlowWrapper}>
              <section className={styles.eventSection}>
                <ScrollReveal direction="up">
                  <h2 className={styles.sectionTitle}>Glimpse of Dcrc</h2>
                  <p className={styles.sectionSub}>A snapshot of early warning sensor deployments, cool-roof campaigns, and conclave action panels.</p>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={0.15}>
                  <div className={styles.coverflowContainer}>
                    <div className={styles.coverflowStage}>
                      {glimpseCards.map((g: any, gIdx: number) => {
                        let offset = gIdx - activeGlimpseIdx;
                        if (offset > glimpseCards.length / 2) offset -= glimpseCards.length;
                        if (offset < -glimpseCards.length / 2) offset += glimpseCards.length;

                        const isCenter = offset === 0;
                        const isVisible = Math.abs(offset) <= 2;
                        if (!isVisible) return null;

                        const scale = isCenter ? 1 : Math.abs(offset) === 1 ? 0.8 : 0.65;
                        const translateX = offset * 220;
                        const rotateY = offset * -25;
                        const opacity = isCenter ? 1 : Math.abs(offset) === 1 ? 0.65 : 0.35;
                        const zIndex = 10 - Math.abs(offset);

                        return (
                          <div
                            key={g.id || gIdx}
                            className={`${styles.coverflowCard} ${isCenter ? styles.coverflowCardActive : ''}`}
                            style={{
                              transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
                              opacity,
                              zIndex,
                            }}
                            onClick={() => {
                              if (isCenter) {
                                const urls = glimpseCards.map((c: any) => c.imageUrl);
                                const captions = glimpseCards.map((c: any) => c.title || 'Conclave Glimpse');
                                openLightbox(urls, captions, gIdx);
                              } else {
                                setActiveGlimpseIdx(gIdx);
                              }
                            }}
                          >
                            <img src={g.imageUrl} alt={g.title || 'Conclave Glimpse'} />
                            <div className={styles.coverflowReflection} />
                            {isCenter && (
                              <div className={styles.coverflowOverlay}>
                                <span className={styles.downloadBtn} style={{ padding: '8px 16px', fontSize: '11px' }}>
                                  View Full Size
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.viewMoreContainer}>
                    <a href="/gallery" className={styles.viewMoreBtn}>
                      <span>View More Gallery</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </ScrollReveal>
              </section>
            </div>
          ) : null;

        case 'Speakers':
          return speakerCards.length > 0 ? (
            <div key={section.id || idx} className={styles.sectionGlowWrapper}>
              <section className={styles.eventSection}>
                <ScrollReveal direction="up">
                  <h2 className={styles.sectionTitle}>Distinguished Speakers</h2>
                  <p className={styles.sectionSub}>Learn from the domain leaders mapping disaster management and climate adaptation strategies.</p>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={0.15}>
                  <div className={styles.sliderContainer}>
                    <div className={styles.sliderWrapper}>
                      {speakerCards.map((sp: any, spIdx: number) => {
                        const isActive = spIdx === activeSpeakerIdx;
                        const isPrev = spIdx === (activeSpeakerIdx - 1 + speakerCards.length) % speakerCards.length;
                        const isNext = spIdx === (activeSpeakerIdx + 1) % speakerCards.length;

                        let positionClass = styles.slideCardHidden;
                        if (isActive) positionClass = styles.slideCardActive;
                        else if (isPrev) positionClass = styles.slideCardPrev;
                        else if (isNext) positionClass = styles.slideCardNext;

                        return (
                          <div
                            key={sp.id || spIdx}
                            className={`${styles.slideCard} ${positionClass}`}
                          >
                            <div className={styles.speakerPhotoWrap}>
                              <img src={sp.imageUrl} alt={sp.title} className={styles.speakerPhotoRect} />
                            </div>
                            <div className={styles.speakerInfoBlock}>
                              <span className={styles.speakerRoleTag}>Advisory Panelist</span>
                              <h4 className={styles.speakerNameTitle}>{sp.title}</h4>
                              <p className={styles.speakerDescParagraph}>
                                {sp.description?.length > 90 ? (
                                  <>
                                    {sp.description.slice(0, 90)}...
                                    <button
                                      type="button"
                                      className={styles.readMoreTextBtn}
                                      onClick={() => setActiveCardDetails({ ...sp, sectionName: 'Speakers' })}
                                    >
                                      Read More
                                    </button>
                                  </>
                                ) : (
                                  sp.description
                                )}
                              </p>
                              <div className={styles.speakerFooterRow}>
                                <div className={styles.speakerSocials}>
                                  {(sp.extraData?.linkedinUrl || sp.linkUrl) && (
                                    <a href={sp.extraData?.linkedinUrl || sp.linkUrl} className={styles.socialIconLink} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                      <Linkedin size={15} />
                                    </a>
                                  )}
                                  {sp.extraData?.twitterUrl && (
                                    <a href={sp.extraData.twitterUrl} className={styles.socialIconLink} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                      <Twitter size={15} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.sliderControls}>
                    <button
                      type="button"
                      className={styles.sliderNavBtn}
                      onClick={() => setActiveSpeakerIdx(prev => (prev - 1 + speakerCards.length) % speakerCards.length)}
                      aria-label="Previous speaker"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      className={styles.sliderNavBtn}
                      onClick={() => setActiveSpeakerIdx(prev => (prev + 1) % speakerCards.length)}
                      aria-label="Next speaker"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  <div className={styles.viewMoreContainer}>
                    <a href="/event/speakers" className={styles.viewMoreBtn}>
                      <span>View All Speakers</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </ScrollReveal>
              </section>
            </div>
          ) : null;

        case 'Partners':
          return partnerCards.length > 0 ? (
            <div key={section.id || idx} className={styles.sectionGlowWrapper}>
              <section className={styles.eventSection}>
                <ScrollReveal direction="up">
                  <h2 className={styles.sectionTitle}>Our Partners</h2>
                  <p className={styles.sectionSub}>Founding and strategic partners driving disaster resilience and ESG initiatives.</p>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={0.2}>
                  <div className={styles.marqueeContainer}>
                    <div className={styles.marqueeTrack}>
                      {(partnerCards.length >= 3 ? [...partnerCards, ...partnerCards] : partnerCards).map((p: any, pIdx: number) => (
                        <a
                          href={p.linkUrl || '#'}
                          target={p.linkUrl ? '_blank' : undefined}
                          rel={p.linkUrl ? 'noopener noreferrer' : undefined}
                          key={pIdx}
                          className={styles.partnerMarqueeCard}
                          onClick={(e) => {
                            if (!p.linkUrl) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <img src={p.imageUrl} alt={p.title} />
                        </a>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              </section>
            </div>
          ) : null;

        default:
          return null;
      }
    };

    return (
      <div className={styles.page}>
        <DisasterEffects theme="general" intensity="low" />

        <ScrollReveal direction="down">
          <PageHero
            theme="events"
            eyebrow={pageData.eyebrow || "Nov 26–27, 2026 · New Delhi"}
            line1="DCRF"
            line2="Dcrc ’26 Conclave"
            subtitle=""
          />
        </ScrollReveal>

        {/* Dynamically render sections in display_order as saved in the DB */}
        {pageData.sections?.map((section: any, idx: number) => renderSection(section, idx))}

        {/* Registration Section */}
        <ScrollReveal direction="up">
          <div id="register" className={styles.registerSec} ref={registerRef}>
            {isSuccess ? (
              <div className={styles.successBox}>
                <CheckCircle size={40} style={{ color: 'var(--accessible-green)', marginBottom: '16px', display: 'inline-block' }} />
                <h3 className={styles.successTitle}>Request Staged Successfully</h3>
                <p className={styles.successText}>{successMsg}</p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className={styles.submitBtn}
                  style={{ margin: '20px auto 0' }}
                >
                  Register Another User
                </button>
              </div>
            ) : (
              <>
                <h3 className={styles.regFormTitle}>Register Interest for Dcrc ’26</h3>
                <p className={styles.regFormSubtitle}>
                  Submit credentials to apply for accreditation. Selected delegates will receive passes via email.
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Full Name</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g. Priyanjali Sen"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email Address</label>
                      <input
                        type="email"
                        className={styles.input}
                        placeholder="name@organization.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Organization / Institution</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g. TCU Impact Foundation"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Designation (Optional)</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g. Chief Risk Officer"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className={`${styles.formGroup} ${styles.fieldFull}`}>
                      <label className={styles.label}>Delegate Stream</label>
                      <div className={styles.customDropdown} ref={dropdownRef}>
                        <button
                          type="button"
                          className={styles.dropdownTrigger}
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          aria-label="Select delegate stream"
                          aria-expanded={dropdownOpen}
                          disabled={isSubmitting}
                        >
                          <div className={styles.dropdownSelected}>
                            <div className={styles.dropdownText}>
                              <span className={styles.dropdownLabel}>
                                {roleOptions.find(opt => opt.value === role)?.label}
                              </span>
                              <span className={styles.dropdownSubLabel}>
                                {roleOptions.find(opt => opt.value === role)?.description}
                              </span>
                            </div>
                          </div>
                          <ChevronDown
                            size={18}
                            className={`${styles.dropdownChevron} ${dropdownOpen ? styles.dropdownChevronOpen : ''}`}
                          />
                        </button>
                        {dropdownOpen && (
                          <div className={styles.dropdownMenu}>
                            {roleOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`${styles.dropdownOption} ${role === option.value ? styles.dropdownOptionActive : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setRole(option.value);
                                  setDropdownOpen(false);
                                }}
                              >
                                <div className={styles.dropdownText}>
                                  <span className={styles.dropdownLabel}>{option.label}</span>
                                  <span className={styles.dropdownSubLabel}>{option.description}</span>
                                </div>
                                {role === option.value && (
                                  <Check size={16} className={styles.dropdownCheck} />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {formError && (
                    <div className={styles.errorText}>
                      <AlertTriangle size={14} />
                      <span>{formError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.submitBtn}
                    style={{ width: '100%' }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className={styles.spinner} />
                        Verifying Credentials...
                      </>
                    ) : (
                      'Submit Delegate Application'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </ScrollReveal>

        {/* ── GATING EMAIL DOWNLOAD MODAL ── */}
        {showEmailGate && (
          <div className={styles.modalOverlay} onClick={() => setShowEmailGate(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowEmailGate(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <h3 className={styles.modalTitle}>Download Conclave Agenda</h3>
              <p className={styles.modalSubtitle}>
                Please authorize download by entering your official coordinates. The PDF will open automatically.
              </p>
              <form onSubmit={handleGateSubmit} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@organization.org"
                    className={styles.input}
                    value={gateEmail}
                    onChange={(e) => setGateEmail(e.target.value)}
                    disabled={gateSubmitting}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priyanjali Sen"
                    className={styles.input}
                    value={gateName}
                    onChange={(e) => setGateName(e.target.value)}
                    disabled={gateSubmitting}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Mobile Number (10 digits)</label>
                  <input
                    type="tel"
                    required
                    pattern="\d{10}"
                    placeholder="e.g. 9876543210"
                    className={styles.input}
                    value={gateMobile}
                    onChange={(e) => setGateMobile(e.target.value)}
                    disabled={gateSubmitting}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Climate Finance Lead"
                    className={styles.input}
                    value={gateDesignation}
                    onChange={(e) => setGateDesignation(e.target.value)}
                    disabled={gateSubmitting}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TCU Impact Foundation"
                    className={styles.input}
                    value={gateOrg}
                    onChange={(e) => setGateOrg(e.target.value)}
                    disabled={gateSubmitting}
                  />
                </div>

                {gateError && (
                  <div className={styles.errorText}>
                    <AlertTriangle size={14} />
                    <span>{gateError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={gateSubmitting}
                  className={styles.submitBtn}
                >
                  {gateSubmitting ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      Authorizing...
                    </>
                  ) : (
                    'Download Agenda'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── CINEMA-STYLE VIDEO LIGHTBOX MODAL ── */}
        {activeVideoUrl && (
          <div className={styles.videoLightboxOverlay} onClick={() => setActiveVideoUrl(null)}>
            <div className={styles.videoLightboxContent} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={styles.videoLightboxClose}
                onClick={() => setActiveVideoUrl(null)}
              >
                <X size={18} />
                <span>Close Player</span>
              </button>
              {activeVideoUrl.includes('youtube.com') || activeVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={getEmbedUrl(activeVideoUrl)}
                  title="Conclave Video Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className={styles.videoLightboxPlayer}
                />
              ) : (
                <video
                  src={activeVideoUrl}
                  controls
                  autoPlay
                  className={styles.videoLightboxPlayer}
                />
              )}
            </div>
          </div>
        )}

        {/* ── CARD DETAILS MODAL (READ MORE IN OVERLAY) ── */}
        {activeCardDetails && (
          <div className={styles.modalOverlay} onClick={() => setActiveCardDetails(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setActiveCardDetails(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
              
              <div className={styles.modalDetailsHeader}>
                <span className={styles.modalDetailsBadge} style={{ display: 'inline-block', backgroundColor: 'var(--wine-red-pale)', color: 'var(--wine-red-primary)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                  {activeCardDetails.sectionName}
                </span>
                <h3 className={styles.modalTitle} style={{ marginTop: '8px', marginBottom: '16px' }}>{activeCardDetails.title}</h3>
              </div>

              {activeCardDetails.imageUrl && (
                <div className={styles.modalDetailsImageWrap} style={{ width: '100%', height: '260px', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                  <img src={activeCardDetails.imageUrl} alt={activeCardDetails.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div className={styles.modalDetailsDesc} style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-default)', maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                {activeCardDetails.description}
              </div>
            </div>
          </div>
        )}
        {/* ── FULLSCREEN IMAGE LIGHTBOX MODAL ── */}
        {activeLightboxIdx !== null && lightboxImages.length > 0 && (
          <div className={styles.lightboxOverlay} onClick={() => setActiveLightboxIdx(null)}>
            <button
              type="button"
              className={styles.lightboxCloseBtn}
              onClick={() => setActiveLightboxIdx(null)}
              aria-label="Close Lightbox"
            >
              <X size={24} />
            </button>

            {/* Left navigation arrow */}
            <button
              type="button"
              className={`${styles.lightboxNavBtn} ${styles.lightboxNavPrev}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxIdx((prev) => (prev !== null ? (prev - 1 + lightboxImages.length) % lightboxImages.length : null));
              }}
              aria-label="Previous Image"
            >
              <ChevronLeft size={30} />
            </button>

            {/* Main Image content */}
            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <img
                src={lightboxImages[activeLightboxIdx]}
                alt={lightboxCaptions[activeLightboxIdx] || "Lightbox Image"}
                className={styles.lightboxImage}
              />
              {lightboxCaptions[activeLightboxIdx] && (
                <div className={styles.lightboxCaptionPanel}>
                  <p className={styles.lightboxCaptionText}>{lightboxCaptions[activeLightboxIdx]}</p>
                </div>
              )}
            </div>

            {/* Right navigation arrow */}
            <button
              type="button"
              className={`${styles.lightboxNavBtn} ${styles.lightboxNavNext}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxIdx((prev) => (prev !== null ? (prev + 1) % lightboxImages.length : null));
              }}
              aria-label="Next Image"
            >
              <ChevronRight size={30} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fallback / standard monthly webinars pages
  if (slug === 'monthly-webinars') {
    return (
      <div className={styles.page}>
        <ScrollReveal direction="down">
          <div className={styles.header}>
            <h1 className={styles.title}>{pageData.title}</h1>
            <p className={styles.subtitle}>{pageData.description}</p>
          </div>
        </ScrollReveal>

        <div className={styles.webinarLayout}>
          <div className={styles.webinarMain}>
            <ScrollReveal direction="right" delay={0.1}>
              <div
                className={styles.bodyText}
                dangerouslySetInnerHTML={{ __html: pageData.content }}
              />
            </ScrollReveal>

            {pageData.videoUrl && (
              <ScrollReveal direction="up" delay={0.2}>
                <div className={styles.mediaSection}>
                  <div className={styles.webinarVideoWrapper}>
                    <iframe
                      src={pageData.videoUrl}
                      title={`${pageData.title} Video Presentation`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </ScrollReveal>
            )}
          </div>

          <div className={styles.webinarAside}>
            <ScrollReveal direction="left" delay={0.15}>
              <div className={styles.registrationCard}>
                {isSuccess ? (
                  <div className={styles.successBox}>
                    <CheckCircle size={40} style={{ color: 'var(--accessible-green)', marginBottom: '16px', display: 'inline-block' }} />
                    <h3 className={styles.successTitle}>Registration Received</h3>
                    <p className={styles.successText}>{successMsg}</p>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className={styles.submitBtn}
                      style={{ margin: '20px auto 0' }}
                    >
                      Register Another Delegate
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className={styles.cardTitle}>Register for Webinars</h3>
                    <p className={styles.cardSubtitle}>
                      Sign up once to receive calendar invitations, links, and PDF briefs for all upcoming DCRF knowledge webinars.
                    </p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="e.g. Priyanjali Sen"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                          type="email"
                          className={styles.input}
                          placeholder="name@organization.org"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Organization / Institution</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="e.g. TCU Impact Foundation"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Designation (Optional)</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="e.g. Lead Climate Advisor"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                        />
                      </div>

                      {formError && (
                        <div className={styles.errorText}>
                          <AlertTriangle size={14} />
                          <span>{formError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={styles.submitBtn}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className={styles.spinner} />
                            Registering...
                          </>
                        ) : (
                          'Register for Knowledge Stream'
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for default general dynamic pages
  return (
    <div className={styles.page}>
      <DisasterEffects theme="general" intensity="low" />

      <ScrollReveal direction="down">
        <PageHero
          theme="charter"
          eyebrow="Event Information"
          line1={pageData.title.toUpperCase()}
          line2=""
          subtitle={pageData.description}
        />
      </ScrollReveal>

      <div className={styles.grid}>
        <div className={styles.leftColumn}>
          <ScrollReveal direction="right" delay={0.1}>
            <div
              className={styles.bodyText}
              dangerouslySetInnerHTML={{ __html: pageData.content }}
            />
          </ScrollReveal>

          {(displayImage || pageData.videoUrl) && (
            <ScrollReveal direction="up" delay={0.2}>
              <div className={styles.mediaSection}>
                {pageData.videoUrl && (
                  <div className={styles.videoWrapper}>
                    <iframe
                      src={pageData.videoUrl}
                      title={`${pageData.title} Video Player`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {displayImage && !pageData.videoUrl && (
                  <div className={styles.imageWrapper}>
                    <img
                      src={displayImage}
                      alt={pageData.title}
                      className={styles.image}
                    />
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}
        </div>

        <div className={styles.rightColumn}>
          <ScrollReveal direction="left" delay={0.15}>
            <div className={styles.registrationCard}>
              {isSuccess ? (
                <div className={styles.successBox}>
                  <CheckCircle size={40} style={{ color: 'var(--accessible-green)', marginBottom: '16px', display: 'inline-block' }} />
                  <h3 className={styles.successTitle}>Request Staged Successfully</h3>
                  <p className={styles.successText}>{successMsg}</p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className={styles.submitBtn}
                    style={{ margin: '20px auto 0' }}
                  >
                    Register Another User
                  </button>
                </div>
              ) : (
                <>
                  <h3 className={styles.cardTitle}>Register Attendance</h3>
                  <p className={styles.cardSubtitle}>
                    Submit credentials to apply for accreditation. Selected delegates will receive passes via email.
                  </p>

                  <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Full Name</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g. Priyanjali Sen"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email Address</label>
                      <input
                        type="email"
                        className={styles.input}
                        placeholder="name@organization.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Organization / Institution</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g. TCU Impact Foundation"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Designation (Optional)</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g. Chief Risk Officer"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                      />
                    </div>

                    <div className={`${styles.formGroup} ${styles.dropdownGroup}`}>
                      <label className={styles.label}>Delegate Stream</label>
                      <div className={styles.customDropdown} ref={dropdownRef}>
                        <button
                          type="button"
                          className={styles.dropdownTrigger}
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          aria-label="Select delegate stream"
                          aria-expanded={dropdownOpen}
                        >
                          <div className={styles.dropdownSelected}>
                            <div className={styles.dropdownText}>
                              <span className={styles.dropdownLabel}>
                                {roleOptions.find(opt => opt.value === role)?.label}
                              </span>
                              <span className={styles.dropdownSubLabel}>
                                {roleOptions.find(opt => opt.value === role)?.description}
                              </span>
                            </div>
                          </div>
                          <ChevronDown
                            size={18}
                            className={`${styles.dropdownChevron} ${dropdownOpen ? styles.dropdownChevronOpen : ''}`}
                          />
                        </button>
                        {dropdownOpen && (
                          <div className={styles.dropdownMenu}>
                            {roleOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`${styles.dropdownOption} ${role === option.value ? styles.dropdownOptionActive : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setRole(option.value);
                                  setDropdownOpen(false);
                                }}
                              >
                                <div className={styles.dropdownText}>
                                  <span className={styles.dropdownLabel}>{option.label}</span>
                                  <span className={styles.dropdownSubLabel}>{option.description}</span>
                                </div>
                                {role === option.value && (
                                  <Check size={16} className={styles.dropdownCheck} />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {formError && (
                      <div className={styles.errorText}>
                        <AlertTriangle size={14} />
                        <span>{formError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={styles.submitBtn}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className={styles.spinner} />
                          Verifying Credentials...
                        </>
                      ) : (
                        'Submit Delegate Application'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
