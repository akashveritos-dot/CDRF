'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Calendar, MapPin, CheckCircle, AlertTriangle, ChevronDown, Check, Building2, Tag, Users } from 'lucide-react';
import { motion } from 'framer-motion';
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

  if (slug === 'monthly-webinars') {
    return (
      <div className={styles.page}>
        {/* Page Header */}
        <ScrollReveal direction="down">
          <div className={styles.header}>
            <h1 className={styles.title}>{pageData.title}</h1>
            <p className={styles.subtitle}>{pageData.description}</p>
          </div>
        </ScrollReveal>

        {/* Two Column Layout */}
        <div className={styles.webinarLayout}>
          {/* Left Column: Dynamic CMS Content */}
          <div className={styles.webinarMain}>
            <ScrollReveal direction="right" delay={0.1}>
              <div 
                className={styles.bodyText}
                dangerouslySetInnerHTML={{ __html: pageData.content }}
              />
            </ScrollReveal>

            {/* Video Presentation if present in database */}
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

          {/* Right Column: Registration Card */}
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

  return (
    <div className={styles.page}>
      <DisasterEffects theme="general" intensity="low" />

      {/* ── Premium PageHero ───────────────────────────────────────── */}
      <ScrollReveal direction="down">
        <PageHero
          theme="charter"
          eyebrow="26–27 November 2026 · New Delhi"
          line1={slug === 'dcrc-26' ? 'DCRC \u201926' : pageData.title.toUpperCase()}
          line2={slug === 'dcrc-26' ? 'CONCLAVE SUMMIT' : ''}
          subtitle={pageData.description}
        />
      </ScrollReveal>

      {/* ── Animated Metadata Chips ─────────────────────────────────── */}
      {slug === 'dcrc-26' && (
        <ScrollReveal direction="up" delay={0.07}>
          <div className={styles.metaChips}>
            <div className={styles.metaChip}>
              <Calendar size={14} className={styles.metaChipIcon} />
              <span>26–27 November 2026</span>
            </div>
            <div className={styles.metaChip}>
              <MapPin size={14} className={styles.metaChipIcon} />
              <span>India International Centre, New Delhi</span>
            </div>
            <div className={styles.metaChip}>
              <Building2 size={14} className={styles.metaChipIcon} />
              <span>Hybrid: In-Person + Virtual</span>
            </div>
            <div className={styles.metaChip}>
              <Tag size={14} className={styles.metaChipIcon} />
              <span>&ldquo;Convergence for Action&rdquo;</span>
            </div>
            <div className={styles.metaChip}>
              <Users size={14} className={styles.metaChipIcon} />
              <span>500+ Expected Delegates</span>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Grid: Left is Content + Media, Right is Registration Card */}
      <div className={styles.grid}>
        <div className={styles.leftColumn}>
          <ScrollReveal direction="right" delay={0.1}>
            <div 
              className={`${styles.bodyText} ${slug === 'dcrc-26' ? styles.conclaveContent : ''}`}
              dangerouslySetInnerHTML={{ __html: pageData.content }}
            />
          </ScrollReveal>

          {/* Video or Image Presentation */}
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

        {/* Right Column: Registration Card */}
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
                                  <span className={option.label}>{option.label}</span>
                                  <span className={option.description}>{option.description}</span>
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
