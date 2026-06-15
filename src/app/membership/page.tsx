'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import { membershipTiers, membershipFeatures, honoraryMembersList } from '@/data/dataStore';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { Check, Minus, Star, Shield, Zap, Crown, ChevronDown, User, Mail, Building, Award, MessageSquare } from 'lucide-react';
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
  const { success, warning, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    tier: 'Basic',
    title: '',
    message: ''
  });
  const [flowStep, setFlowStep] = useState<'form' | 'payment' | 'success'>('form');
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<{ paymentId: string; orderId: string } | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockOrderId, setMockOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [highlightForm, setHighlightForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const triggerScrollToForm = (e?: Event) => {
    if (e) {
      e.preventDefault();
    }
    const formElement = formRef.current || document.getElementById('join');
    if (formElement) {
      setTimeout(() => {
        const offset = 100;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = formElement.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Trigger highlight pulse
        setHighlightForm(true);
        const timer = setTimeout(() => {
          setHighlightForm(false);
        }, 2200);
        return () => clearTimeout(timer);
      }, 100);
    }
  };

  useEffect(() => {
    // Check hash on mount
    if (window.location.hash === '#join') {
      triggerScrollToForm();
    }

    // Listen for hashchange events (for clicks when already on page)
    const handleHashChange = () => {
      if (window.location.hash === '#join') {
        triggerScrollToForm();
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    // Listen for global clicks on DCRF CTA to trigger smooth scrolling
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.getAttribute('href')?.endsWith('#join')) {
        triggerScrollToForm(e);
      }
    };
    document.addEventListener('click', handleGlobalClick);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.organization) {
      setIsSubmitting(true);
      try {
        const isPaidTier = formData.tier !== 'Basic';

        const res = await fetch('/api/membership/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            checkOnly: isPaidTier
          })
        });

        if (!res.ok) {
          throw new Error('Application submission failed');
        }

        const data = await res.json();
        if (data.alreadyExists) {
          warning(
            'Already Applied',
            data.message || 'This email is already registered for membership.'
          );
        } else {
          if (!isPaidTier) {
            setApplicationId(data.applicationId);
            setFlowStep('success');
            success(
              'Application Logged',
              `Your request for ${formData.tier} tier is staged for review.`
            );
          } else {
            // Paid tier: transition to payment screen silently (no success toast)
            setFlowStep('payment');
          }
        }
      } catch (err) {
        console.error('Membership form error:', err);
        toastError('Submission Failed', 'Failed to submit application. Please try again later.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePayment = async () => {
    setIsPaying(true);

    try {
      // 1. Fetch Order ID from server
      const orderRes = await fetch('/api/membership/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: formData.tier })
      });

      if (!orderRes.ok) {
        throw new Error('Failed to generate payment order from server.');
      }

      const orderData = await orderRes.json();
      const { orderId, isMock } = orderData;
      setRazorpayOrderId(orderId);

      if (isMock) {
        setMockOrderId(orderId);
        setShowMockModal(true);
        setIsPaying(false);
        return;
      }

      // 2. Open real Razorpay checkout popup
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.body.appendChild(script);
        });
      }

      let amountPaisa = orderData.amount;
      if (!amountPaisa) {
        if (formData.tier === 'Prime') amountPaisa = 2000000;
        else if (formData.tier === 'Premium') amountPaisa = 5000000;
        else if (formData.tier === 'Gold') amountPaisa = 10000000;
      }

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_L88P4F2zUqI2lX';

      const options = {
        key: keyId,
        amount: amountPaisa,
        currency: 'INR',
        name: 'DCRF Federation',
        description: `${formData.tier} Tier Membership`,
        order_id: orderId,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: ''
        },
        theme: {
          color: '#0e7a6b'
        },
        handler: async function (response: any) {
          try {
            setIsPaying(true);
            const verifyRes = await fetch('/api/membership/payment-success', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...formData,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature
              })
            });

            if (!verifyRes.ok) {
              throw new Error('Payment storage verification failed');
            }

            const verifyData = await verifyRes.json();
            setApplicationId(verifyData.applicationId);

            setPaymentDetails({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id
            });

            setFlowStep('success');
            success('Membership Active!', 'Congratulations! You are now a member of DCRF.');
          } catch (err: any) {
            console.error('Payment verification API error:', err);
            toastError('Verification Error', 'Payment was successful, but we failed to update your account. Please contact Secretariat.');
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
            warning('Payment Cancelled', 'Razorpay checkout window was closed.');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error('Razorpay process error:', err);
      toastError('Payment Error', err.message || 'Failed to process Razorpay payment order.');
      setIsPaying(false);
    }
  };

  const handleMockPaymentSuccess = async () => {
    setIsPaying(true);
    setShowMockModal(false);

    try {
      const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 10)}${Date.now().toString().slice(-4)}`;

      const verifyRes = await fetch('/api/membership/payment-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paymentId: mockPaymentId,
          orderId: mockOrderId,
          signature: 'sig_mock_verified'
        })
      });

      if (!verifyRes.ok) {
        throw new Error('Mock payment verification failed');
      }

      const verifyData = await verifyRes.json();
      setApplicationId(verifyData.applicationId);

      setPaymentDetails({
        paymentId: mockPaymentId,
        orderId: mockOrderId
      });

      setFlowStep('success');
      success('Membership Active!', 'Congratulations! You are now a member of DCRF.');
    } catch (err: any) {
      console.error('Mock payment verify error:', err);
      toastError('Payment Error', 'Failed to store mock payment details.');
    } finally {
      setIsPaying(false);
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
                  '--tier-accent': cfg.accentColor,
                  '--tier-pale': cfg.accentPale,
                  '--tier-glow': cfg.accentGlow,
                  '--tier-btn': cfg.btnBg,
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
                    triggerScrollToForm();
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

        {/* Desktop Table View */}
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

        {/* Mobile Card View */}
        <div className={styles.mobileComparisonView}>
          {membershipTiers.map((tier) => {
            const cfg = TIER_CONFIG[tier.name as keyof typeof TIER_CONFIG];
            return (
              <div key={tier.name} className={styles.mobileTierCard}>
                <div className={styles.mobileTierHeader}>
                  <div
                    className={styles.mobileTierIcon}
                    style={{ background: cfg.accentPale, color: cfg.accentColor, border: `1px solid ${cfg.badgeBorder}` }}
                  >
                    {cfg.icon}
                  </div>
                  <h3 className={styles.mobileTierName} style={{ color: cfg.accentColor }}>
                    {tier.name}
                  </h3>
                </div>
                <ul className={styles.mobileFeatureList}>
                  {membershipFeatures.map((feat) => {
                    const has = tier.features[feat];
                    return (
                      <li key={feat} className={styles.mobileFeatureItem}>
                        <span
                          className={styles.mobileFeatureCheck}
                          style={has ? { background: cfg.accentPale, color: cfg.accentColor } : { background: 'var(--bg-surface-alt)', color: 'var(--text-muted)' }}
                        >
                          {has ? <Check size={12} strokeWidth={3} /> : <Minus size={12} />}
                        </span>
                        <span className={styles.mobileFeatureLabel}>{feat}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
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
        <div id="join" ref={formRef} className={`${styles.formSec} ${highlightForm ? styles.highlightedForm : ''} ${isSubmitting ? styles.formSecLoading : ''}`}>
          {isSubmitting ? (
            <div className={styles.loadingContainer}>
              <div className={styles.rupeeCoinWrap}>
                <div className={styles.rupeeCoin}>₹</div>
                <div className={styles.coinShadow}></div>
              </div>
              <h3 className={styles.loadingTitle}>Preparing Secure Billing Invoice</h3>
              <p className={styles.loadingSubtitle}>
                Verifying organization credentials and establishing encrypted session...
              </p>
              <div className={styles.loadingBarContainer}>
                <div className={styles.loadingBar}></div>
              </div>
            </div>
          ) : flowStep === 'success' ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>
                <Check size={32} />
              </div>
              <h3 className={styles.successTitle}>
                {formData.tier === 'Basic' ? 'Application Received!' : 'Congratulations!'}
              </h3>
              <p className={styles.successMsg}>
                {formData.tier === 'Basic' ? (
                  <>
                    Thank you for applying for <strong>{formData.tier} Membership</strong>. The DCRF Secretariat will review your organization credentials and write back within 3–5 business days.
                  </>
                ) : (
                  <>
                    You are now a registered <strong>{formData.tier} member</strong> of our organization! You have successfully unlocked premium features and resources.
                  </>
                )}
              </p>

              {/* Unlocked Features based on user feedback */}
              <div className={styles.unlockedSection}>
                <div className={styles.unlockedTitle}>
                  <Star size={16} fill="currentColor" style={{ marginRight: '6px' }} /> Unlocked Tier Privileges ({formData.tier})
                </div>
                <ul className={styles.unlockedList}>
                  {membershipFeatures
                    .filter(feat => {
                      const tierObj = membershipTiers.find(t => t.name === formData.tier);
                      return tierObj ? (tierObj.features as Record<string, boolean>)[feat] : false;
                    })
                    .map(feat => (
                      <li key={feat} className={styles.unlockedItem}>
                        <span className={styles.unlockedCheck}>
                          <Check size={11} strokeWidth={3} />
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Display payment details if paid tier */}
              {paymentDetails && (
                <div className={styles.receiptBox}>
                  <div className={styles.receiptRow}>
                    <span>Transaction ID:</span>
                    <span>{paymentDetails.paymentId}</span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span>Order ID:</span>
                    <span>{paymentDetails.orderId}</span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span>Status:</span>
                    <span style={{ color: '#059669', fontWeight: 'bold' }}>SUCCESSFUL (PAID)</span>
                  </div>
                </div>
              )}

              <button
                className={styles.submitBtn}
                style={{ width: '200px', marginTop: '16px' }}
                onClick={() => {
                  setFlowStep('form');
                  setFormData({
                    name: '',
                    email: '',
                    organization: '',
                    tier: 'Basic',
                    title: '',
                    message: ''
                  });
                  setPaymentDetails(null);
                  setRazorpayOrderId('');
                }}
              >
                Register Another
              </button>
            </div>
          ) : flowStep === 'payment' ? (
            <div className={styles.paymentBox}>
              <h3 className={styles.paymentTitle}>Review Application Details</h3>
              <p className={styles.paymentSubtitle}>
                Please verify your membership order information below to proceed with the transaction.
              </p>

              {/* Summary Card */}
              <div className={styles.paymentSummary}>
                <div className={styles.previewTitle}>Membership Order Preview</div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>
                    <User size={14} style={{ marginRight: '8px', verticalAlign: 'middle', opacity: 0.7 }} />
                    Applicant
                  </span>
                  <span className={styles.summaryValue}>{formData.name}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>
                    <Mail size={14} style={{ marginRight: '8px', verticalAlign: 'middle', opacity: 0.7 }} />
                    Email Address
                  </span>
                  <span className={styles.summaryValue}>{formData.email}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>
                    <Building size={14} style={{ marginRight: '8px', verticalAlign: 'middle', opacity: 0.7 }} />
                    Organization
                  </span>
                  <span className={styles.summaryValue}>{formData.organization}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>
                    <Award size={14} style={{ marginRight: '8px', verticalAlign: 'middle', opacity: 0.7 }} />
                    Selected Tier
                  </span>
                  <span className={styles.summaryValue} style={{ fontWeight: 'bold' }}>{formData.tier}</span>
                </div>
                <div className={styles.summaryDivider}></div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel} style={{ fontWeight: 'bold' }}>Total Due</span>
                  <span className={styles.summaryTotal}>
                    {formData.tier === 'Prime' ? '₹20,000' : formData.tier === 'Premium' ? '₹50,000' : '₹1,00,000'}
                  </span>
                </div>
              </div>

              <div className={styles.secureBadge}>
                <Shield size={16} /> Secure transaction processed via encrypted payment gateway
              </div>

              {/* Action Buttons */}
              <div className={styles.payActions}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => setFlowStep('form')}
                  disabled={isPaying}
                >
                  Go Back
                </button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handlePayment}
                  disabled={isPaying}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {isPaying ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className={styles.formTitle}>Join the Resilience Movement</h2>
              <p className={styles.formSubtitle}>
                Submit your details below to initiate verification and join the working groups.
              </p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} size={18} />
                    <input type="text" name="name" required placeholder="Dr./Mr./Ms. Name" className={styles.input} value={formData.name} onChange={handleInputChange} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Corporate Email</label>
                  <div className={styles.inputWrapper}>
                    <Mail className={styles.inputIcon} size={18} />
                    <input type="email" name="email" required placeholder="name@organization.org" className={styles.input} value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Organization / Institution</label>
                  <div className={styles.inputWrapper}>
                    <Building className={styles.inputIcon} size={18} />
                    <input type="text" name="organization" required placeholder="Full Company Name" className={styles.input} value={formData.organization} onChange={handleInputChange} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Job Title / Designation</label>
                  <div className={styles.inputWrapper}>
                    <Award className={styles.inputIcon} size={18} />
                    <input type="text" name="title" placeholder="e.g. Director Sustainability" className={styles.input} value={formData.title} onChange={handleInputChange} />
                  </div>
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
                    {isMounted && dropdownOpen && (
                      <div className={styles.dropdownMenu}>
                        {tierOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`${styles.dropdownOption} ${formData.tier === option.value ? styles.dropdownOptionActive : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, tier: option.value }));
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
                            {formData.tier === option.value && (
                              <Check size={16} className={styles.dropdownCheck} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`${styles.formGroup} ${styles.fieldFull}`}>
                  <label className={styles.label}>Resilience Focus / Brief Description</label>
                  <div className={styles.textareaWrapper}>
                    <MessageSquare className={styles.textareaIcon} size={18} />
                    <textarea name="message" rows={4} placeholder="Briefly describe your interest in DCRF working groups..." className={styles.textarea} value={formData.message} onChange={handleInputChange} />
                  </div>
                </div>
                <button type="submit" className={`${styles.submitBtn} ${styles.fieldFull}`}>
                  Submit Application
                </button>
              </div>
            </form>
          )}
        </div>
      </ScrollReveal>

      {/* Razorpay Sandbox Mock Terminal Popup */}
      {showMockModal && (
        <div className={styles.mockModalOverlay}>
          <div className={styles.mockModal}>
            <div className={styles.mockModalHeader}>
              <Shield size={18} style={{ color: '#fff' }} />
              <h3 className={styles.mockModalTitle}>DCRF Secure Payment Gate</h3>
            </div>
            <div className={styles.mockModalBody}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-default)' }}>
                You are paying securely using DCRF Sandbox Gateway.
              </p>
              <div className={styles.receiptBox} style={{ margin: 0 }}>
                <div className={styles.receiptRow}>
                  <span>Merchant:</span>
                  <span>DCRF Federation</span>
                </div>
                <div className={styles.receiptRow}>
                  <span>Membership:</span>
                  <span>{formData.tier} Tier</span>
                </div>
                <div className={styles.receiptRow}>
                  <span>Amount:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                    {formData.tier === 'Prime' ? '₹20,000' : formData.tier === 'Premium' ? '₹50,000' : '₹1,00,000'}
                  </span>
                </div>
                <div className={styles.receiptRow}>
                  <span>Order ID:</span>
                  <span>{mockOrderId}</span>
                </div>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                This is a simulated sandbox checkout process. Please click <strong>Simulate Payment</strong> to confirm and process this transaction.
              </p>
            </div>
            <div className={styles.mockModalFooter}>
              <button
                className={styles.backBtn}
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setShowMockModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                style={{ padding: '8px 16px', fontSize: '13px', marginTop: 0 }}
                onClick={handleMockPaymentSuccess}
                disabled={isPaying}
              >
                {isPaying ? 'Processing...' : 'Simulate Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
