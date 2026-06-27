'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader2, Calendar, MapPin, CheckCircle, AlertTriangle, ChevronDown, 
  Check, Building2, Tag, Users, Award, Shield, Zap, ChevronLeft, ChevronRight, Download 
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
  { value: 'Speaker', label: 'Panelist / Speaker', description: 'DCRC panel speaker invitee' },
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

    const bannerCards = bannerSection?.cards || [];
    // Slide auto-play
    useEffect(() => {
      if (bannerCards.length <= 1) return;
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerCards.length);
      }, 5000);
      return () => clearInterval(interval);
    }, [bannerCards]);

    return (
      <div className={styles.page}>
        <DisasterEffects theme="general" intensity="low" />

        <ScrollReveal direction="down">
          <PageHero
            theme="events"
            eyebrow="Nov 26–27, 2026 · New Delhi"
            line1="DCRF DCRC ’26"
            line2="CONCLAVE"
            subtitle={pageData.description}
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

              const isFileLink = btn.linkUrl?.match(/\.(pdf|png|jpe?g|gif|svg)$/i) || btn.linkUrl?.startsWith('/api/files/');
              return (
                <a 
                  href={btn.linkUrl || '#'} 
                  key={btn.id || idx} 
                  className={styles.actionCard}
                  onClick={onClickHandler}
                  target={isFileLink ? '_blank' : undefined}
                  rel={isFileLink ? 'noopener noreferrer' : undefined}
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
            <p dangerouslySetInnerHTML={{ __html: pageData.content }} />
          </div>
        </ScrollReveal>

        {/* Speakers Section */}
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

        {/* Partners Section */}
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

        {/* Glimpse Section */}
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
            <p className={styles.sectionSub}>Explore the planned roadmap, session timelines, and event schedules below.</p>
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
              target="_blank"
              rel="noopener noreferrer"
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

        {/* Registration Section */}
        <ScrollReveal direction="up">
          <div id="register" className={styles.registerSec}>
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
                <h3 className={styles.regFormTitle}>Register Interest for DCRC ’26</h3>
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

        {/* Bottom sticky registration referral button */}
        <div className={styles.stickyRegistrationContainer}>
          <a href="#register" className={styles.stickyRegBtn}>
            <Users size={16} />
            <span>Apply to Register Attendance</span>
          </a>
        </div>
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
