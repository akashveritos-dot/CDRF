'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { 
  Calendar, MapPin, Users, Award, Shield, ChevronDown, Check, Zap, 
  Building2, Globe, Mic, FileText, ChevronLeft, ChevronRight, Download, Play 
} from 'lucide-react';
import PageHero from '@/components/ui/PageHero/PageHero';

function getFriendlyError(err: any, fallback: string): string {
  const msg = err?.message || '';
  if (!msg || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('typeerror') || msg.toLowerCase().includes('database') || msg.toLowerCase().includes('internal server error')) {
    return 'Unable to connect to the server. Please check your network connection and try again.';
  }
  return msg;
}

export default function EventPage() {
  const [pageData, setPageData] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    designation: '',
    role: 'In-Person Delegate'
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMounted(true);
    async function loadConclaveData() {
      try {
        const res = await fetch('/api/pages/dcrc-26');
        if (res.ok) {
          const data = await res.json();
          setPageData(data);
        }
      } catch (err) {
        console.error('Failed to load conclave database sections:', err);
      }
    }
    loadConclaveData();
  }, []);

  // Recalculate dropdown position on window resize / scroll when open
  useEffect(() => {
    if (!dropdownOpen) return;
    const recalc = () => {
      if (triggerRef.current && window.innerWidth <= 768) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownStyle({
          position: 'fixed',
          top: `${rect.bottom + 6}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          zIndex: 9999,
        });
      } else {
        setDropdownStyle({});
      }
    };
    recalc();
    window.addEventListener('resize', recalc);
    window.addEventListener('scroll', recalc, true);
    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', recalc, true);
    };
  }, [dropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register interest');
      setIsRegistered(true);
    } catch (err: any) {
      setError(getFriendlyError(err, 'Failed to submit registration. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Find CMS sections
  const bannerSection = pageData?.sections?.find((s: any) => s.title === 'Banner Images');
  const actionButtonsSection = pageData?.sections?.find((s: any) => s.title === 'Action Buttons');
  const agendaSection = pageData?.sections?.find((s: any) => s.title === 'Agenda Images');
  const speakersSection = pageData?.sections?.find((s: any) => s.title === 'Speakers');
  const partnersSection = pageData?.sections?.find((s: any) => s.title === 'Partners');
  const glimpseSection = pageData?.sections?.find((s: any) => s.title === 'Glimpse');

  // Slide auto-play
  const bannerCards = bannerSection?.cards || [];
  useEffect(() => {
    if (bannerCards.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerCards.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerCards]);

  const attendanceOptions = [
    { value: 'In-Person Delegate', label: 'In-Person Delegate', subLabel: 'India International Centre', icon: <MapPin size={16} />, color: 'var(--wine-red-primary)' },
    { value: 'Virtual Delegate', label: 'Virtual Delegate', subLabel: 'Live Web Stream', icon: <Users size={16} />, color: 'var(--teal-primary)' },
    { value: 'Sponsor / Exhibition partner', label: 'Exhibitor', subLabel: 'Disaster-Tech Expo pavilion', icon: <Award size={16} />, color: 'var(--gold-light)' },
    { value: 'Media representative', label: 'Media delegate', subLabel: 'Press pass', icon: <Shield size={16} />, color: '#64748b' },
  ];

  return (
    <div className={styles.page}>
      <ScrollReveal direction="down">
        <PageHero
          theme="events"
          eyebrow="Nov 26–27, 2026 · New Delhi"
          line1="DCRF DCRC ’26"
          line2="CONCLAVE"
          subtitle={pageData?.description || "India’s premier annual convening forum mapping disaster preparedness, climate science updates, and corporate CSR resilience frameworks."}
        />
      </ScrollReveal>

      {/* DCRF Visibility Brand Segment */}
      <div className={styles.brandVisibilityBadge}>
        <span className={styles.dcrfText}>DCRF</span>
        <span className={styles.subText}>DISASTER & CLIMATE RESILIENCE FEDERATION</span>
      </div>

      {/* Slideable Banner Carousel Section */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className={styles.carouselContainer}>
          {bannerCards.length > 0 ? (
            <div className={styles.carouselTrack} style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {bannerCards.map((slide: any, idx: number) => (
                <div key={slide.id || idx} className={styles.carouselSlide}>
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
                {bannerCards.map((_: any, idx: number) => (
                  <button 
                    key={idx} 
                    className={`${styles.carouselDot} ${currentSlide === idx ? styles.activeDot : ''}`}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollReveal>

      {/* Action Buttons / Cards below Banner */}
      <ScrollReveal direction="up" delay={0.15}>
        <div className={styles.actionCardsGrid}>
          {actionButtonsSection?.cards?.map((btn: any, idx: number) => {
            const extra = btn.extraData || {};
            let onClickHandler = undefined;
            if (extra.isRegistration) {
              onClickHandler = (e: React.MouseEvent) => {
                e.preventDefault();
                document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
              };
            }

            return (
              <a 
                href={btn.linkUrl || '#'} 
                key={btn.id || idx} 
                className={styles.actionCard}
                onClick={onClickHandler}
                download={extra.isDownload ? true : undefined}
              >
                <div className={styles.actionCardContent}>
                  <div className={styles.actionCardIcon}>
                    {extra.isDownload ? <Download size={22} /> : extra.isRegistration ? <Users size={22} /> : <Zap size={22} />}
                  </div>
                  <h4>{btn.title}</h4>
                  <p>{extra.isDownload ? 'Download PDF Document' : extra.isRegistration ? 'Apply for Passes' : 'Explore Resource'}</p>
                </div>
              </a>
            );
          }) || (
            <>
              <a href="#agenda-gallery" className={styles.actionCard}>
                <div className={styles.actionCardContent}>
                  <div className={styles.actionCardIcon}><Download size={22} /></div>
                  <h4>Agenda</h4>
                  <p>Download PDF Document</p>
                </div>
              </a>
              <a href="#register" className={styles.actionCard}>
                <div className={styles.actionCardContent}>
                  <div className={styles.actionCardIcon}><Users size={22} /></div>
                  <h4>Registration</h4>
                  <p>Apply for Passes</p>
                </div>
              </a>
              <a href="/reports" className={styles.actionCard}>
                <div className={styles.actionCardContent}>
                  <div className={styles.actionCardIcon}><Zap size={22} /></div>
                  <h4>Policy Briefs</h4>
                  <p>Explore Resources</p>
                </div>
              </a>
              <a href="/charter-10-point-agenda" className={styles.actionCard}>
                <div className={styles.actionCardContent}>
                  <div className={styles.actionCardIcon}><Zap size={22} /></div>
                  <h4>Core Charter</h4>
                  <p>Explore Resources</p>
                </div>
              </a>
            </>
          )}
        </div>
      </ScrollReveal>

      {/* Description Section */}
      <ScrollReveal direction="up">
        <div className={styles.descriptionBlock}>
          <h2 className={styles.sectionTitle}>About DCRC 2026</h2>
          <p>
            Under the theme <strong>"Convergence for Action"</strong>, DCRC ’26 will gather 500+ delegates from ministries, 
            global agencies (UNDRR, World Bank), major corporates, NGOs, and IIT researchers to map joint resilience operations.
            The conclave focuses on directing corporate giving towards localized mitigation tools, early warning arrays, and municipal cooling structures.
          </p>
        </div>
      </ScrollReveal>

      {/* After description: Speaker Section */}
      {speakersSection && speakersSection.cards?.length > 0 && (
        <section className={styles.eventSection}>
          <ScrollReveal direction="up">
            <h2 className={styles.sectionTitle}>Distinguished Speakers</h2>
          </ScrollReveal>
          <div className={styles.speakersGrid}>
            {speakersSection.cards.map((sp: any, idx: number) => (
              <ScrollReveal direction="up" delay={idx * 0.05} key={sp.id || idx}>
                <div className={styles.speakerCard}>
                  <img src={sp.imageUrl} alt={sp.title} className={styles.speakerPhoto} />
                  <div className={styles.speakerInfo}>
                    <h4>{sp.title}</h4>
                    <p>{sp.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* After description: Partners Section */}
      {partnersSection && partnersSection.cards?.length > 0 && (
        <section className={styles.eventSection}>
          <ScrollReveal direction="up">
            <h2 className={styles.sectionTitle}>Our Partners</h2>
          </ScrollReveal>
          <div className={styles.partnersGrid}>
            {partnersSection.cards.map((p: any, idx: number) => (
              <ScrollReveal direction="up" delay={idx * 0.05} key={p.id || idx}>
                <div className={styles.partnerCard}>
                  <img src={p.imageUrl} alt={p.title} className={styles.partnerLogo} />
                  <h4>{p.title}</h4>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* After description: Glimpse Section */}
      {glimpseSection && glimpseSection.cards?.length > 0 && (
        <section className={styles.eventSection}>
          <ScrollReveal direction="up">
            <h2 className={styles.sectionTitle}>Glimpse of DCRC</h2>
          </ScrollReveal>
          <div className={styles.glimpseGrid}>
            {glimpseSection.cards.map((g: any, idx: number) => (
              <ScrollReveal direction="up" delay={idx * 0.05} key={g.id || idx}>
                <div className={styles.glimpseCard}>
                  <img src={g.imageUrl} alt={g.title || 'Conclave Glimpse'} className={styles.glimpsePhoto} />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* Agenda Images / Visual Gallery section (Replaces Timeline) */}
      <section id="agenda-gallery" className={styles.eventSection}>
        <ScrollReveal direction="up">
          <h2 className={styles.sectionTitle}>Conclave Agenda</h2>
          <p className={styles.sectionSub}>Displaying the schedule agenda visually below. Manageable from the DCRF backend.</p>
        </ScrollReveal>
        
        <div className={styles.agendaGallery}>
          {agendaSection?.cards?.map((agenda: any, idx: number) => (
            <ScrollReveal direction="up" delay={idx * 0.1} key={agenda.id || idx}>
              <div className={styles.agendaImgContainer}>
                <img src={agenda.imageUrl} alt={agenda.title} className={styles.agendaImg} />
                <div className={styles.agendaImgCaption}>
                  <h4>{agenda.title}</h4>
                </div>
              </div>
            </ScrollReveal>
          )) || (
            <div className={styles.agendaImgContainerSingle}>
              <img 
                src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80" 
                alt="Conclave Schedule Agenda" 
                className={styles.agendaImg} 
              />
            </div>
          )}
        </div>

        {/* Download Agenda Button */}
        <div className={styles.downloadContainer}>
          <a 
            href={agendaSection?.cards?.[0]?.extraData?.downloadUrl || '/reports'} 
            className={styles.downloadBtn}
            download
          >
            <Download size={16} />
            <span>Download Full Agenda (PDF)</span>
          </a>
        </div>
      </section>

      {/* Responsive YouTube Clip Section */}
      {pageData?.videoUrl && (
        <section className={styles.eventSection}>
          <ScrollReveal direction="up">
            <h2 className={styles.sectionTitle}>Conclave Video Highlights</h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <div className={styles.youtubeSec}>
              <iframe 
                src={pageData.videoUrl} 
                title="DCRC Conclave Highlight Video" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className={styles.youtubeEmbed}
              />
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* Registration Section (Form kept at the bottom as requested) */}
      <ScrollReveal direction="up">
        <div id="register" className={styles.registerSec}>
          {isRegistered ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✓</div>
              <h3 style={{ fontSize: '24px', color: 'var(--text-default)', fontFamily: 'var(--font-display)' }}>
                Interest Registered!
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                Thank you, <strong>{formData.name}</strong>, for registering interest in DCRC ’26.
                We have logged your preference as a <strong>{formData.role}</strong> and will email your delegate pass and schedule briefings once session seatings open.
              </p>
              <button
                className={styles.submitBtn}
                style={{ width: '160px' }}
                onClick={() => setIsRegistered(false)}
              >
                Register Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister}>
              <h2 className={styles.regFormTitle}>Register Interest for DCRC ’26</h2>
              <p className={styles.regFormSubtitle}>
                Apply for in-person passes or virtual live streaming links for the New Delhi conclave.
              </p>

              {error && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 500
                }}>
                  <Shield size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.formGrid}>
                {/* Name */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Enter name"
                    className={styles.input}
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Email */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Official Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@company.com"
                    className={styles.input}
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Company */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Company / Institution</label>
                  <input
                    type="text"
                    name="company"
                    required
                    placeholder="Full organization name"
                    className={styles.input}
                    value={formData.company}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Designation */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Designation</label>
                  <input
                    type="text"
                    name="designation"
                    placeholder="e.g. Program Coordinator"
                    className={styles.input}
                    value={formData.designation}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Choose Conclave Attendance Mode */}
                <div className={`${styles.formGroup} ${styles.fieldFull}`}>
                  <label className={styles.label}>Choose Conclave Attendance Mode</label>
                  <div className={styles.customDropdown} ref={dropdownRef}>
                    <button
                      type="button"
                      ref={triggerRef}
                      className={styles.dropdownTrigger}
                      onClick={() => {
                        const next = !dropdownOpen;
                        if (next && triggerRef.current && window.innerWidth <= 768) {
                          const rect = triggerRef.current.getBoundingClientRect();
                          setDropdownStyle({
                            position: 'fixed',
                            top: `${rect.bottom + 6}px`,
                            left: `${rect.left}px`,
                            width: `${rect.width}px`,
                            zIndex: 9999,
                          });
                        } else {
                          setDropdownStyle({});
                        }
                        setDropdownOpen(next);
                      }}
                      aria-label="Select attendance mode"
                      aria-expanded={dropdownOpen}
                      disabled={isSubmitting}
                    >
                      <div className={styles.dropdownSelected}>
                        <span className={styles.dropdownIcon} style={{ color: attendanceOptions.find(t => t.value === formData.role)?.color }}>
                          {attendanceOptions.find(t => t.value === formData.role)?.icon}
                        </span>
                        <div className={styles.dropdownText}>
                          <span className={styles.dropdownLabel}>
                            {attendanceOptions.find(t => t.value === formData.role)?.label}
                          </span>
                          <span className={styles.dropdownSubLabel}>
                            {attendanceOptions.find(t => t.value === formData.role)?.subLabel}
                          </span>
                        </div>
                      </div>
                      <ChevronDown 
                        size={18} 
                        className={`${styles.dropdownChevron} ${dropdownOpen ? styles.dropdownChevronOpen : ''}`}
                      />
                    </button>
                    {isMounted && dropdownOpen && (
                      <div className={styles.dropdownMenu} style={dropdownStyle}>
                        {attendanceOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`${styles.dropdownOption} ${formData.role === option.value ? styles.dropdownOptionActive : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, role: option.value }));
                              setTimeout(() => setDropdownOpen(false), 100);
                            }}
                          >
                            <span className={styles.dropdownIcon} style={{ color: option.color }}>
                              {option.icon}
                            </span>
                            <div className={styles.dropdownText}>
                              <span className={styles.dropdownLabel}>{option.label}</span>
                              <span className={styles.dropdownSubLabel}>{option.subLabel}</span>
                            </div>
                            {formData.role === option.value && (
                              <Check size={16} className={styles.dropdownCheck} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`${styles.submitBtn} ${styles.fieldFull}`}
                  style={{ opacity: isSubmitting ? 0.8 : 1 }}
                >
                  {isSubmitting ? 'Registering...' : 'Register Interest'}
                </button>
              </div>
            </form>
          )}
        </div>
      </ScrollReveal>

      {/* Bottom Attendance/Registration sticky-referral button */}
      <div className={styles.stickyRegistrationContainer}>
        <a href="#register" className={styles.stickyRegBtn}>
          <Users size={16} />
          <span>Apply to Register Attendance</span>
        </a>
      </div>
    </div>
  );
}
