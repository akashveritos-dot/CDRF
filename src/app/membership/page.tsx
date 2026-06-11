'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './page.module.css';
import { membershipTiers, membershipFeatures, honoraryMembersList } from '@/data/dataStore';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { Check, Minus, Star, Shield, Zap, Crown, ChevronDown } from 'lucide-react';
import { useToast } from '@/components/ui/Toast/ToastContext';

// ─── Per-tier design tokens ────────────────────────────────────────────────────
const TIER_CONFIG = {
  Basic: {
    icon: <Shield size={22} />,
    gradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
    badgeBg: '#f1f5f9',
    badgeColor: '#475569',
    badgeBorder: 'rgba(100,116,139,0.25)',
    accentColor: '#64748b',
    accentPale: '#f1f5f9',
    accentGlow: 'rgba(100,116,139,0.12)',
    btnBg: '#64748b',
    btnHover: '#475569',
    thBg: '#f1f5f9',
    thColor: '#334155',
    thBorder: 'rgba(100,116,139,0.3)',
  },
  Prime: {
    icon: <Zap size={22} />,
    gradient: 'linear-gradient(135deg, #0e7a6b 0%, #14b8a6 100%)',
    badgeBg: '#e0f5f1',
    badgeColor: '#0e7a6b',
    badgeBorder: 'rgba(14,122,107,0.25)',
    accentColor: '#0e7a6b',
    accentPale: '#e0f5f1',
    accentGlow: 'rgba(14,122,107,0.12)',
    btnBg: '#0e7a6b',
    btnHover: '#0a5c50',
    thBg: '#e0f5f1',
    thColor: '#0e7a6b',
    thBorder: 'rgba(14,122,107,0.3)',
  },
  Premium: {
    icon: <Star size={22} />,
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
    badgeBg: '#ede9fe',
    badgeColor: '#6d28d9',
    badgeBorder: 'rgba(109,40,217,0.25)',
    accentColor: '#6d28d9',
    accentPale: '#ede9fe',
    accentGlow: 'rgba(109,40,217,0.12)',
    btnBg: '#6d28d9',
    btnHover: '#5b21b6',
    thBg: '#ede9fe',
    thColor: '#6d28d9',
    thBorder: 'rgba(109,40,217,0.3)',
  },
  Gold: {
    icon: <Crown size={22} />,
    gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
    badgeBg: '#fef3c7',
    badgeColor: '#b45309',
    badgeBorder: 'rgba(180,83,9,0.25)',
    accentColor: '#b45309',
    accentPale: '#fef3c7',
    accentGlow: 'rgba(180,83,9,0.15)',
    btnBg: '#b45309',
    btnHover: '#92400e',
    thBg: '#b45309',
    thColor: '#ffffff',
    thBorder: 'rgba(180,83,9,0.4)',
  },
} as const;

// Tier options for custom dropdown
const tierOptions = [
  { value: 'Basic', label: 'Basic', subLabel: 'Free individual / student', icon: <Shield size={16} />, color: '#64748b' },
  { value: 'Prime', label: 'Prime', subLabel: '₹20,000/yr — NGO/Academia', icon: <Zap size={16} />, color: '#0e7a6b' },
  { value: 'Premium', label: 'Premium', subLabel: '₹50,000/yr — Small SME', icon: <Star size={16} />, color: '#6d28d9' },
  { value: 'Gold', label: 'Gold', subLabel: '₹1,00,000/yr — Corporate / Enterprise', icon: <Crown size={16} />, color: '#b45309' },
];

export default function MembershipPage() {
  const { success } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    tier: 'Basic',
    title: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    // Prevent body scroll when dropdown is open on mobile
    if (dropdownOpen && window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [dropdownOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.organization) {
      setIsSubmitted(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.page}>
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <h1 className={styles.title}>Find Your Place in DCRF</h1>
          <p className={styles.subtitle}>
            Unifying academic, corporate, NGO and individual partners. Choose a tiered membership program to match your organizational objectives.
          </p>
        </div>
      </ScrollReveal>

      {/* ── Tier pricing cards ─────────────────────────────────────────── */}
      <div className={styles.tiersGrid}>
        {membershipTiers.map((tier, idx) => {
          const cfg = TIER_CONFIG[tier.name as keyof typeof TIER_CONFIG];
          return (
            <ScrollReveal key={tier.name} direction="up" delay={0.06 * idx}>
              <div
                className={`${styles.tierCard} ${tier.isPopular ? styles.popularCard : ''}`}
                style={{
                  '--tier-accent':  cfg.accentColor,
                  '--tier-pale':    cfg.accentPale,
                  '--tier-glow':    cfg.accentGlow,
                  '--tier-btn':     cfg.btnBg,
                  '--tier-btn-hover': cfg.btnHover,
                } as React.CSSProperties}
              >
                {/* Top colour band */}
                <div className={styles.tierBand} style={{ background: cfg.gradient }} />

                {/* Icon badge */}
                <div className={styles.tierIconWrap} style={{ background: cfg.accentPale, color: cfg.accentColor, border: `1px solid ${cfg.badgeBorder}` }}>
                  {cfg.icon}
                </div>

                {/* Popular ribbon */}
                {tier.isPopular && (
                  <div className={styles.popularBadge} style={{ background: cfg.btnBg }}>
                    Most Popular
                  </div>
                )}

                {/* Name + price */}
                <div className={styles.tierMeta}>
                  <span className={styles.tierName} style={{ color: cfg.accentColor }}>
                    {tier.name}
                  </span>
                  <div className={styles.price} style={{ color: cfg.accentColor }}>
                    {tier.price}
                  </div>
                  <span className={styles.priceSub}>{tier.priceSubText}</span>
                </div>

                {/* Divider */}
                <div className={styles.tierDivider} style={{ background: cfg.badgeBorder }} />

                {/* Feature list */}
                <ul className={styles.featureList}>
                  {membershipFeatures.map(feat => {
                    const included = tier.features[feat];
                    return (
                      <li key={feat} className={`${styles.featItem} ${!included ? styles.featItemDisabled : ''}`}>
                        <span
                          className={styles.featCheck}
                          style={included ? { background: cfg.accentPale, color: cfg.accentColor } : {}}
                        >
                          {included ? <Check size={11} strokeWidth={3} /> : <Minus size={11} />}
                        </span>
                        <span className={styles.featLabel}>{feat}</span>
                      </li>
                    );
                  })}
                </ul>

                {/* CTA button */}
                <button
                  className={styles.cardAction}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, tier: tier.name }));
                    document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Select {tier.name}
                </button>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* ── Comparison Table ───────────────────────────────────────────── */}
      <ScrollReveal direction="up">
        <h2 className={styles.compareTitle}>Benefit Comparison</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thFeature}>Benefit Criteria</th>
                {membershipTiers.map(tier => {
                  const cfg = TIER_CONFIG[tier.name as keyof typeof TIER_CONFIG];
                  return (
                    <th
                      key={tier.name}
                      className={styles.thTier}
                      style={{
                        background: cfg.thBg,
                        color: cfg.thColor,
                        borderBottom: `3px solid ${cfg.accentColor}`,
                      }}
                    >
                      <div className={styles.thInner}>
                        <span className={styles.thIcon} style={{ color: cfg.thColor, opacity: cfg.thColor === '#ffffff' ? 0.85 : 1 }}>
                          {cfg.icon}
                        </span>
                        {tier.name}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {membershipFeatures.map((feat, rowIdx) => (
                <tr key={feat} className={rowIdx % 2 === 0 ? styles.trEven : ''}>
                  <td className={styles.tdFeature}>{feat}</td>
                  {membershipTiers.map(tier => {
                    const cfg = TIER_CONFIG[tier.name as keyof typeof TIER_CONFIG];
                    const has = tier.features[feat];
                    return (
                      <td key={tier.name} className={styles.tdCheck}>
                        {has ? (
                          <span className={styles.checkPill} style={{ background: cfg.accentPale, color: cfg.accentColor }}>
                            <Check size={12} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className={styles.dashIcon}>
                            <Minus size={14} />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollReveal>

      {/* ── Honorary Members ───────────────────────────────────────────── */}
      <ScrollReveal direction="up">
        <div className={styles.networksBox}>
          <h3 className={styles.networksTitle}>Honorary Member Network</h3>
          <p className={styles.networksSub}>
            DCRF extends complimentary honorary memberships and advisory invitations to leading research bodies, disaster funds, and corporations active in India's sustainability landscape:
          </p>
          <div className={styles.networksGrid}>
            {honoraryMembersList.map((org) => (
              <span key={org} className={styles.networkChip}>{org}</span>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ── Registration Form ──────────────────────────────────────────── */}
      <ScrollReveal direction="up">
        <div id="join" className={styles.formSec}>
          {isSubmitted ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>
                <Check size={32} />
              </div>
              <h3 className={styles.successTitle}>Application Received!</h3>
              <p className={styles.successMsg}>
                Thank you for applying for <strong>{formData.tier} Membership</strong>. The DCRF Secretariat will review your organization credentials and write back within 3–5 business days.
              </p>
              <button className={styles.submitBtn} style={{ width: '160px' }} onClick={() => setIsSubmitted(false)}>
                Register Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className={styles.formTitle}>Apply to the Federation</h2>
              <p className={styles.formSubtitle}>
                Submit your details below to initiate corporate verification and join the working groups.
              </p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input type="text" name="name" required placeholder="Dr./Mr./Ms. Name" className={styles.input} value={formData.name} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Corporate Email</label>
                  <input type="email" name="email" required placeholder="name@organization.org" className={styles.input} value={formData.email} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Organization / Institution</label>
                  <input type="text" name="organization" required placeholder="Full Company Name" className={styles.input} value={formData.organization} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Job Title / Designation</label>
                  <input type="text" name="title" placeholder="e.g. Director Sustainability" className={styles.input} value={formData.title} onChange={handleInputChange} />
                </div>
                <div className={`${styles.formGroup} ${styles.fieldFull}`}>
                  <label className={styles.label}>Select Target Membership Tier</label>
                  <div className={styles.customDropdown} ref={dropdownRef}>
                    <button
                      type="button"
                      className={styles.dropdownTrigger}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      aria-label="Select membership tier"
                      aria-expanded={dropdownOpen}
                    >
                      <div className={styles.dropdownSelected}>
                        <span className={styles.dropdownIcon} style={{ color: tierOptions.find(t => t.value === formData.tier)?.color }}>
                          {tierOptions.find(t => t.value === formData.tier)?.icon}
                        </span>
                        <div className={styles.dropdownText}>
                          <span className={styles.dropdownLabel}>
                            {tierOptions.find(t => t.value === formData.tier)?.label}
                          </span>
                          <span className={styles.dropdownSubLabel}>
                            {tierOptions.find(t => t.value === formData.tier)?.subLabel}
                          </span>
                        </div>
                      </div>
                      <ChevronDown 
                        size={18} 
                        className={`${styles.dropdownChevron} ${dropdownOpen ? styles.dropdownChevronOpen : ''}`}
                      />
                    </button>
                    {isMounted && dropdownOpen && createPortal(
                      <>
                        <div 
                          className={styles.dropdownBackdrop} 
                          onClick={() => setDropdownOpen(false)}
                        />
                        <div className={styles.dropdownMenu}>
                          {tierOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`${styles.dropdownOption} ${formData.tier === option.value ? styles.dropdownOptionActive : ''}`}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, tier: option.value }));
                                setDropdownOpen(false);
                              }}
                            >
                              <span className={styles.dropdownIcon} style={{ color: option.color }}>
                                {option.icon}
                              </span>
                              <div className={styles.dropdownText}>
                                <span className={styles.dropdownLabel}>{option.label}</span>
                                <span className={styles.dropdownSubLabel}>{option.subLabel}</span>
                              </div>
                              {formData.tier === option.value && (
                                <Check size={16} className={styles.dropdownCheck} />
                              )}
                            </button>
                          ))}
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                </div>
                <div className={`${styles.formGroup} ${styles.fieldFull}`}>
                  <label className={styles.label}>Resilience Focus / Brief Description</label>
                  <textarea name="message" rows={4} placeholder="Briefly describe your interest in DCRF working groups..." className={styles.textarea} value={formData.message} onChange={handleInputChange} />
                </div>
                <button type="submit" className={`${styles.submitBtn} ${styles.fieldFull}`}>
                  Submit Application
                </button>
              </div>
            </form>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}
