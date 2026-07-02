'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import { membershipTiers, membershipFeatures, honoraryMembersList } from '@/data/dataStore';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { Check, Minus, Star, Shield, Zap, Crown, ChevronDown, User, Mail, Building, Award, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/Toast/ToastContext';
import PageHero from '@/components/ui/PageHero/PageHero';

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

export default function MembershipPage() {
  const { success, warning, error: toastError } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({
    name: '',
    email: '',
    organization: '',
    tier: 'Basic',
    title: '',
    message: ''
  });
  const [fields, setFields] = useState<any[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);

  const defaultFields = [
    { name: 'name', label: 'Full Name', type: 'text', isRequired: true },
    { name: 'email', label: 'Email Address', type: 'email', isRequired: true },
    { name: 'organization', label: 'Organisation / Institution', type: 'text', isRequired: true },
    { name: 'title', label: 'Professional Title', type: 'text', isRequired: false },
    { name: 'tier', label: 'Membership Tier', type: 'select', isRequired: true },
    { name: 'message', label: 'Additional Notes / Purpose', type: 'textarea', isRequired: false }
  ];

  const fieldIcons: Record<string, React.ReactNode> = {
    name: <User className={styles.inputIcon} size={18} />,
    email: <Mail className={styles.inputIcon} size={18} />,
    organization: <Building className={styles.inputIcon} size={18} />,
    title: <Award className={styles.inputIcon} size={18} />,
    message: <MessageSquare className={styles.textareaIcon} size={18} />
  };

  useEffect(() => {
    async function loadFields() {
      try {
        const res = await fetch('/api/forms/fields?type=membership');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.fields) && data.fields.length > 0) {
            setFields(data.fields);
            const initialValues: Record<string, string> = { tier: 'Basic' };
            data.fields.forEach((f: any) => {
              if (f.name !== 'tier') initialValues[f.name] = '';
            });
            setFormData(prev => ({ ...prev, ...initialValues }));
            setFieldsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic membership fields:', err);
      }
      setFields(defaultFields);
      setFieldsLoading(false);
    }
    loadFields();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Time tracker for real-time discounts and countdowns
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  // Price and discount locking to prevent race condition billing errors
  const [lockedPrice, setLockedPrice] = useState<number | null>(null);
  const [lockedDiscount, setLockedDiscount] = useState<any | null>(null);

  // Smart email detection state
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<{
    hasMembership: boolean;
    tier?: string;
    membershipStatus?: string;
    expiresAt?: string;
    tierRank?: number;
    isExpired?: boolean;
  } | null>(null);

  // Review step — inline edit state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<Record<string, string>>({});
  const [reviewEmailWarning, setReviewEmailWarning] = useState<string | null>(null);
  const [reviewEmailChecking, setReviewEmailChecking] = useState(false);

  // Dynamic Pricing and Campaigns State
  const [tiers, setTiers] = useState<any[]>([
    { name: 'Basic', price: 0, priceSubText: 'Individual & Student Access', features: membershipTiers[0].features, discount: null },
    { name: 'Prime', price: 20000, priceSubText: 'Per Annum — NGO & Academia', features: membershipTiers[1].features, discount: null },
    { name: 'Premium', price: 50000, priceSubText: 'Per Annum — SME & Consultancies', features: membershipTiers[2].features, discount: null },
    { name: 'Gold', price: 100000, priceSubText: 'Per Annum — Corporates & Leaders', isPopular: true, features: membershipTiers[3].features, discount: null }
  ]);
  const [tiersLoading, setTiersLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    async function loadPlans() {
      try {
        const res = await fetch('/api/membership/plans');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.plans)) {
            setTiers(data.plans);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dynamic pricing tiers:', err);
      } finally {
        setTiersLoading(false);
      }
    }
    loadPlans();

    // 1-second interval timer for real-time checkout & campaign countdowns
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdownString = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    const now = currentTime.getTime();
    const diff = end - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
  };

  const getTierSubLabel = (tierName: string) => {
    const t = tiers.find(x => x.name === tierName);
    if (!t) {
      if (tierName === 'Basic') return 'Free individual / student';
      if (tierName === 'Prime') return '₹20,000/yr — NGO/Academia';
      if (tierName === 'Premium') return '₹50,000/yr — Small SME';
      return '₹1,00,000/yr — Corporate / Enterprise';
    }

    if (t.price === 0) return 'Free individual / student';

    const subTextClean = t.priceSubText ? t.priceSubText.replace('Per Annum — ', '') : '';
    const discountActive = t.discount && (new Date(t.discount.startDate) <= currentTime) && (new Date(t.discount.endDate) >= currentTime);
    if (discountActive) {
      const discPrice = t.price - (t.price * t.discount.percentage / 100);
      return `₹${discPrice.toLocaleString('en-IN')}/yr (${t.discount.title} — ${t.discount.percentage}% OFF) — ${subTextClean}`;
    }
    return `₹${t.price.toLocaleString('en-IN')}/yr — ${subTextClean}`;
  };

  const tierOptions = React.useMemo(() => {
    return [
      { value: 'Basic', label: 'Basic', subLabel: getTierSubLabel('Basic'), icon: <Shield size={16} />, color: '#64748b' },
      { value: 'Prime', label: 'Prime', subLabel: getTierSubLabel('Prime'), icon: <Zap size={16} />, color: '#0e7a6b' },
      { value: 'Premium', label: 'Premium', subLabel: getTierSubLabel('Premium'), icon: <Star size={16} />, color: '#6d28d9' },
      { value: 'Gold', label: 'Gold', subLabel: getTierSubLabel('Gold'), icon: <Crown size={16} />, color: '#b45309' },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiers, currentTime]);

  // Tier rank map for upgrade UI filtering
  const TIER_RANK: Record<string, number> = { Basic: 0, Prime: 1, Premium: 2, Gold: 3 };

  // ── Debounced email membership check ────────────────────────────────────────
  // Fires automatically 600ms after the user stops typing a valid email.
  // Works with autofill, paste, and manual typing — no blur needed.
  useEffect(() => {
    const email = formData.email.trim().toLowerCase();

    // Must look like a valid email
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailCheckResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setEmailCheckLoading(true);
      try {
        const res = await fetch(`/api/membership/check-email?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          setEmailCheckResult(data);
          // Auto-select the next upgrade tier so the panel has something pre-selected
          if (data.hasMembership && !data.isExpired && typeof data.tierRank === 'number') {
            const RANK_TO_TIER = ['Basic', 'Prime', 'Premium', 'Gold'];
            const nextUpgradeTier = RANK_TO_TIER[(data.tierRank ?? 0) + 1];
            if (nextUpgradeTier) {
              setFormData(prev => ({ ...prev, tier: nextUpgradeTier }));
            }
          }
        }
      } catch (err) {
        console.error('[email-check] fetch failed:', err);
        setEmailCheckResult(null);
      } finally {
        setEmailCheckLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.email]);

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

    const activeFields = fields.length > 0 ? fields : defaultFields;
    for (const f of activeFields) {
      if (f.isRequired && !formData[f.name]?.trim()) {
        toastError('Validation Error', `${f.label} is required.`);
        return;
      }
    }

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
          if (data.downgradeBlocked) {
            warning(
              'Plan Downgrade Blocked',
              data.message || 'You cannot downgrade to a lower tier while having an active higher membership.'
            );
          } else if (data.sameplan) {
            warning(
              'Already a Member',
              data.message || 'You are already an active member of this plan.'
            );
          } else {
            warning(
              'Already Applied',
              data.message || 'This email is already registered for membership.'
            );
          }
        } else {
          if (!isPaidTier) {
            setApplicationId(data.applicationId);
            setFlowStep('success');
            success(
              'Application Logged',
              `Your request for ${formData.tier} tier is staged for review.`
            );
          } else {
            // Paid tier: transition to payment screen and create order to lock price
            try {
              const orderRes = await fetch('/api/membership/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: formData.tier })
              });

              if (!orderRes.ok) {
                const errText = await orderRes.text();
                throw new Error(errText || 'Failed to generate payment order from server.');
              }

              const orderData = await orderRes.json();
              if (!orderData.success || !orderData.orderId) {
                throw new Error(orderData.error || 'Failed to generate order ID');
              }

              setRazorpayOrderId(orderData.orderId);
              setMockOrderId(orderData.orderId);

              // Capture price and discount at this submission moment
              const t = tiers.find(x => x.name === formData.tier);
              if (t) {
                const activeDiscount = t.discount && (new Date(t.discount.startDate) <= currentTime) && (new Date(t.discount.endDate) >= currentTime) ? t.discount : null;
                setLockedDiscount(activeDiscount);
                setLockedPrice(activeDiscount ? t.price - (t.price * activeDiscount.percentage / 100) : t.price);
              } else {
                setLockedPrice(orderData.amount / 100);
                setLockedDiscount(null);
              }

              setFlowStep('payment');
            } catch (payErr: any) {
              console.error('Order creation error during submit:', payErr);
              toastError('Invoice Error', payErr.message || 'Failed to initialize secure payment session. Please try again.');
            }
          }
        }
      } catch (err) {
        console.error('Membership form error:', err);
        toastError('Submission Failed', 'Failed to submit application. Please try again later.');
      } finally {
        setIsSubmitting(false);
      }
  };

  const renderDynamicField = (field: any) => {
    const value = formData[field.name] || '';
    const handleValueChange = (val: string) => {
      setFormData(prev => ({ ...prev, [field.name]: val }));
      if (field.name === 'email') {
        setEmailCheckResult(null);
      }
    };

    const icon = fieldIcons[field.name] || <Award className={styles.inputIcon} size={18} />;

    if (field.type === 'textarea') {
      return (
        <div className={`${styles.formGroup} ${styles.fieldFull}`} key={field.name}>
          <label className={styles.label}>{field.label}</label>
          <div className={styles.textareaWrapper}>
            <MessageSquare className={styles.textareaIcon} size={18} />
            <textarea
              name={field.name}
              rows={4}
              placeholder={`Briefly describe your ${field.label.toLowerCase()}...`}
              className={styles.textarea}
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              required={field.isRequired}
            />
          </div>
        </div>
      );
    }

    if (field.name === 'tier' && field.type === 'select') {
      if (emailCheckResult?.hasMembership && !emailCheckResult.isExpired) return null;

      return (
        <div className={`${styles.formGroup} ${styles.fieldFull}`} key={field.name}>
          <label className={styles.label}>{field.label}</label>
          <div className={styles.customDropdown} ref={dropdownRef}>
            <button
              type="button"
              className={styles.dropdownTrigger}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Select membership tier"
              aria-expanded={dropdownOpen}
            >
              <div className={styles.dropdownSelected}>
                <span className={styles.dropdownIcon} style={{ color: tierOptionsFiltered.find(t => t.value === formData.tier)?.color || tierOptions.find(t => t.value === formData.tier)?.color }}>
                  {tierOptionsFiltered.find(t => t.value === formData.tier)?.icon || tierOptions.find(t => t.value === formData.tier)?.icon}
                </span>
                <div className={styles.dropdownText}>
                  <span className={styles.dropdownLabel}>
                    {tierOptions.find(t => t.value === formData.tier)?.label}
                  </span>
                  <span className={styles.dropdownSubLabel}>
                    {getTierSubLabel(formData.tier)}
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
                {tierOptionsFiltered.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.dropdownOption} ${formData.tier === option.value ? styles.dropdownOptionActive : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleValueChange(option.value);
                      setTimeout(() => setDropdownOpen(false), 100);
                    }}
                  >
                    <span className={styles.dropdownIcon} style={{ color: option.color }}>
                      {option.icon}
                    </span>
                    <div className={styles.dropdownText}>
                      <span className={styles.dropdownLabel}>{option.label}</span>
                      <span className={styles.dropdownSubLabel}>{getTierSubLabel(option.value)}</span>
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
      );
    }

    if (field.type === 'select') {
      return (
        <div className={styles.formGroup} key={field.name}>
          <label className={styles.label}>{field.label}</label>
          <div className={styles.inputWrapper}>
            {icon}
            <select
              name={field.name}
              className={styles.input}
              style={{ width: '100%', height: '42px', paddingLeft: '40px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-md)' }}
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              required={field.isRequired}
            >
              <option value="" style={{ background: '#1c1917', color: '#fff' }}>{`Select ${field.label}...`}</option>
              {field.options && field.options.split(',').map((opt: string) => (
                <option key={opt.trim()} value={opt.trim()} style={{ background: '#1c1917', color: '#fff' }}>{opt.trim()}</option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div className={styles.formGroup} key={field.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', marginBottom: '14px' }}>
          <input
            type="checkbox"
            id={`chk-${field.name}`}
            checked={value === 'true'}
            onChange={(e) => handleValueChange(e.target.checked ? 'true' : 'false')}
            required={field.isRequired}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor={`chk-${field.name}`} className={styles.label} style={{ margin: 0, cursor: 'pointer', display: 'inline', color: '#e2e8f0' }}>
            {field.label}
          </label>
        </div>
      );
    }

    return (
      <div className={styles.formGroup} key={field.name}>
        <label className={styles.label}>{field.label}</label>
        <div className={styles.inputWrapper}>
          {icon}
          <input
            type={field.type}
            name={field.name}
            className={styles.input}
            placeholder={`Enter your ${field.label.toLowerCase()}...`}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            required={field.isRequired}
          />
        </div>
        {field.name === 'email' && emailCheckLoading && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Checking membership...
          </div>
        )}
        {field.name === 'email' && emailCheckResult?.hasMembership && emailCheckResult.isExpired && (
          <div style={{
            marginTop: '10px',
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.18)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '12px',
            color: '#94a3b8'
          }}>
            <span style={{ color: '#60a5fa', fontWeight: 600 }}>↻ Your {emailCheckResult.tier} membership has expired.</span> Select a plan below to renew or upgrade.
          </div>
        )}
      </div>
    );
  };

  const handlePayment = async () => {
    setIsPaying(true);

    try {
      if (!razorpayOrderId) {
        throw new Error('Payment session has expired or is invalid. Please re-submit the form.');
      }

      // Check if it is a mock order
      const isMock = razorpayOrderId.startsWith('order_mock_');
      if (isMock) {
        setMockOrderId(razorpayOrderId);
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

      const amountPaisa = Math.round((lockedPrice || 0) * 100);
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_L88P4F2zUqI2lX';

      const options = {
        key: keyId,
        amount: amountPaisa,
        currency: 'INR',
        name: 'DCRF Federation',
        description: `${formData.tier} Tier Membership`,
        order_id: razorpayOrderId,
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
    // Clear email check when email changes
    if (name === 'email') {
      setEmailCheckResult(null);
    }
  };

  // Derive which tiers to show based on email check result
  const visibleTiers = (() => {
    if (!emailCheckResult?.hasMembership || emailCheckResult.isExpired) {
      return tiers; // Show all tiers for new users or expired members
    }
    const existingRank = emailCheckResult.tierRank ?? 0;
    return tiers.filter(t => (TIER_RANK[t.name] ?? 0) > existingRank); // Only show upgrades
  })();

  const tierOptionsFiltered = (() => {
    if (!emailCheckResult?.hasMembership || emailCheckResult.isExpired) {
      return tierOptions;
    }
    const existingRank = emailCheckResult.tierRank ?? 0;
    return tierOptions.filter(t => (TIER_RANK[t.value] ?? 0) > existingRank);
  })();

  return (
    <div className={styles.page}>
      {/* ── Premium Hero ────────────────────────────────────── */}
      <ScrollReveal direction="down">
        <PageHero
          theme="advisory"
          eyebrow="DCRF Membership Program"
          line1="FIND YOUR"
          line2="PLACE IN DCRF"
          subtitle="Unifying academic, corporate, NGO and individual partners. Choose a tiered membership to match your organizational objectives."
        />
      </ScrollReveal>

      {/* ── Tier pricing cards ─────────────────────────────────────────── */}
      <div className={styles.tiersGrid}>
        {visibleTiers.map((tier, idx) => {
          const cfg = TIER_CONFIG[tier.name as keyof typeof TIER_CONFIG];
          const discount = tier.discount;
          const isDiscountActive = discount && (new Date(discount.startDate) <= currentTime) && (new Date(discount.endDate) >= currentTime);

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
                {/* Icon badge */}
                <div className={styles.tierIconWrap} style={{ background: cfg.accentPale, color: cfg.accentColor, border: `1px solid ${cfg.badgeBorder}` }}>
                  {cfg.icon}
                </div>

                {/* Top Right Ribbon (Discount gets priority, otherwise Most Popular) */}
                {isDiscountActive && discount ? (
                  <div className={styles.discountRibbon} style={{ background: '#dc2626' }}>
                    {discount.percentage}% OFF
                  </div>
                ) : tier.isPopular ? (
                  <div className={styles.popularBadge} style={{ background: cfg.btnBg }}>
                    Most Popular
                  </div>
                ) : null}

                {/* Name + price */}
                <div className={styles.tierMeta}>
                  <span className={styles.tierName} style={{ color: cfg.accentColor }}>
                    {tier.name}
                  </span>
                  <div className={styles.price} style={{ color: cfg.accentColor }}>
                    {(() => {
                      const discount = tier.discount;
                      const isDiscountActive = discount && (new Date(discount.startDate) <= currentTime) && (new Date(discount.endDate) >= currentTime);
                      if (isDiscountActive && discount) {
                        const countdown = getCountdownString(discount.endDate);
                        return (
                          <div className={styles.cardDiscountWrapper}>
                            {tier.isPopular && (
                              <span className={styles.popularPill}>
                                Most Popular
                              </span>
                            )}
                            <span className={styles.cardOriginalPrice}>
                              ₹{tier.price.toLocaleString('en-IN')}
                            </span>
                            <span className={styles.cardActivePrice}>
                              ₹{(tier.price - (tier.price * discount.percentage / 100)).toLocaleString('en-IN')}
                            </span>
                            <span className={styles.cardDiscountTitle}>
                              🔥 {discount.title}
                            </span>
                            {countdown && (
                              <div className={styles.countdownContainer}>
                                <span className={styles.countdownLabel}>Ends in:</span>
                                <div className={styles.countdownTimer}>
                                  <div className={styles.countdownUnit}>
                                    <span className={styles.countdownVal}>{String(countdown.days).padStart(2, '0')}</span>
                                    <span className={styles.countdownUnitLabel}>d</span>
                                  </div>
                                  <div className={styles.countdownUnit}>
                                    <span className={styles.countdownVal}>{String(countdown.hours).padStart(2, '0')}</span>
                                    <span className={styles.countdownUnitLabel}>h</span>
                                  </div>
                                  <div className={styles.countdownUnit}>
                                    <span className={styles.countdownVal}>{String(countdown.minutes).padStart(2, '0')}</span>
                                    <span className={styles.countdownUnitLabel}>m</span>
                                  </div>
                                  <div className={styles.countdownUnit}>
                                    <span className={styles.countdownVal}>{String(countdown.seconds).padStart(2, '0')}</span>
                                    <span className={styles.countdownUnitLabel}>s</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {tier.isPopular && (
                            <span className={styles.popularPill}>
                              Most Popular
                            </span>
                          )}
                          <span className={styles.cardActivePrice}>
                            {typeof tier.price === 'number' ? (tier.price === 0 ? 'Free' : `₹${tier.price.toLocaleString('en-IN')}`) : tier.price}
                          </span>
                        </div>
                      );
                    })()}
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
                {tiers.map(tier => {
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
                  {tiers.map(tier => {
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
          {tiers.map((tier) => {
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
                      const tierObj = tiers.find(t => t.name === formData.tier);
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
          ) : flowStep === 'payment' ? (() => {
            const selectedTierMeta: Record<string, { accent: string; pale: string; icon: React.ReactNode }> = {
              Basic:   { accent: '#64748b', pale: '#f1f5f9', icon: <Shield size={14} /> },
              Prime:   { accent: '#0e7a6b', pale: '#f0fdf9', icon: <Zap size={14} /> },
              Premium: { accent: '#6d28d9', pale: '#f5f3ff', icon: <Star size={14} /> },
              Gold:    { accent: '#b45309', pale: '#fffbeb', icon: <Crown size={14} /> },
            };
            const tm = selectedTierMeta[formData.tier] || selectedTierMeta.Basic;

            const priceDisplay = (() => {
              const raw = lockedPrice === null
                ? tiers.find(x => x.name === formData.tier)?.price ?? 0
                : lockedPrice;
              if (raw === 0) return { main: 'Free', crossed: null, badge: null };
              if (lockedDiscount) {
                const base = tiers.find(x => x.name === formData.tier)?.price ?? raw;
                return {
                  main: `₹${raw.toLocaleString('en-IN')}`,
                  crossed: `₹${base.toLocaleString('en-IN')}`,
                  badge: `${lockedDiscount.percentage}% OFF — ${lockedDiscount.title}`,
                };
              }
              return { main: `₹${raw.toLocaleString('en-IN')}`, crossed: null, badge: null };
            })();

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', width: '100%' }}>
                {/* ── Page Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: `linear-gradient(135deg, ${tm.accent}20, ${tm.accent}08)`,
                    border: `1.5px solid ${tm.accent}30`,
                    marginBottom: '14px',
                  }}>
                    <Shield size={24} style={{ color: tm.accent }} />
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif", letterSpacing: '-0.3px' }}>
                    Review Your Order
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                    Confirm the details below before proceeding to secure payment
                  </p>
                </div>

                {/* ── Order Card */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  marginBottom: '16px',
                  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                }}>
                  {/* Card header */}
                  <div style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#f8fafc',
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tm.accent }} />
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
                      Membership Order Summary
                    </span>
                  </div>

                  {/* Rows — inline editable */}
                  {(() => {
                    const editableRows: { key: string; icon: React.ReactNode; label: string; type?: string }[] = [
                      { key: 'name',         icon: <User size={15} />,     label: 'Applicant',       type: 'text' },
                      { key: 'email',        icon: <Mail size={15} />,     label: 'Email',           type: 'email' },
                      { key: 'organization', icon: <Building size={15} />, label: 'Organization',    type: 'text' },
                      { key: 'tier',         icon: <Award size={15} />,    label: 'Membership Tier', type: 'select' },
                    ];

                    const handleStartEdit = (key: string) => {
                      setEditingField(key);
                      setReviewDraft(prev => ({ ...prev, [key]: (formData as any)[key] }));
                      setReviewEmailWarning(null);
                    };

                    const handleSaveEdit = async (key: string) => {
                      const val = reviewDraft[key] ?? '';
                      if (key === 'email') {
                        // Re-check membership for new email
                        const clean = val.trim().toLowerCase();
                        if (clean && clean.includes('@') && clean.includes('.')) {
                          setReviewEmailChecking(true);
                          try {
                            const res = await fetch(`/api/membership/check-email?email=${encodeURIComponent(clean)}`);
                            if (res.ok) {
                              const data = await res.json();
                              if (data.hasMembership && !data.isExpired) {
                                if (data.tier === formData.tier) {
                                  setReviewEmailWarning(`This email already has an active ${data.tier} membership. Please choose a different plan or use a different email.`);
                                  setEditingField(null);
                                  setFormData(prev => ({ ...prev, [key]: val }));
                                  setReviewEmailChecking(false);
                                  return;
                                }
                              }
                              setReviewEmailWarning(null);
                            }
                          } catch { /* ignore */ }
                          finally { setReviewEmailChecking(false); }
                        }
                      }
                      setFormData(prev => ({ ...prev, [key]: val }));
                      setEditingField(null);
                    };

                    const handleCancelEdit = () => setEditingField(null);

                    return (
                      <div style={{ padding: '4px 0' }}>
                        {editableRows.map((row, i) => {
                          const isEditing = editingField === row.key;
                          const currentVal = (formData as any)[row.key] ?? '';
                          const isLast = i === editableRows.length - 1;

                          return (
                            <div key={row.key} style={{
                              borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                            }}>
                              {/* Display row */}
                              {!isEditing && (
                                <div style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '11px 20px',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', flexShrink: 0 }}>
                                    {row.icon} {row.label}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '60%' }}>
                                    {row.key === 'tier' ? (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: tm.pale, color: tm.accent, fontWeight: 700, fontSize: '12px', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${tm.accent}30` }}>
                                        {tm.icon} {currentVal}
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', textAlign: 'right', wordBreak: 'break-all' }}>{currentVal}</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(row.key)}
                                      title={`Edit ${row.label}`}
                                      style={{
                                        background: 'none', border: '1px solid #e2e8f0',
                                        borderRadius: '6px', padding: '4px 6px',
                                        cursor: 'pointer', color: '#94a3b8',
                                        display: 'flex', alignItems: 'center',
                                        flexShrink: 0, transition: 'all 0.15s',
                                      }}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Edit row */}
                              {isEditing && (
                                <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', display: 'block' }}>
                                    Editing: {row.label}
                                  </label>
                                  {row.type === 'select' ? (
                                    <select
                                      value={reviewDraft[row.key] ?? currentVal}
                                      onChange={e => setReviewDraft(prev => ({ ...prev, [row.key]: e.target.value }))}
                                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: 600, color: '#0f172a', background: '#fff', outline: 'none', marginBottom: '8px' }}
                                    >
                                      {tiers.filter(t => t.price > 0).map((t: any) => (
                                        <option key={t.name} value={t.name}>{t.name} — ₹{t.price.toLocaleString('en-IN')}/yr</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type={row.type}
                                      value={reviewDraft[row.key] ?? currentVal}
                                      onChange={e => setReviewDraft(prev => ({ ...prev, [row.key]: e.target.value }))}
                                      autoFocus
                                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff', outline: 'none', marginBottom: '8px', boxSizing: 'border-box' }}
                                    />
                                  )}
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEdit(row.key)}
                                      disabled={reviewEmailChecking}
                                      style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', background: tm.accent, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      {reviewEmailChecking ? 'Checking…' : '✓ Save'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEdit}
                                      style={{ flex: 1, padding: '7px', borderRadius: '7px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Email same-plan warning */}
                        {reviewEmailWarning && (
                          <div style={{ margin: '0 16px 12px', padding: '12px 14px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '16px', lineHeight: 1 }}>⚠️</span>
                            <div>
                              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#92400e' }}>Already a Member</p>
                              <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#78350f', lineHeight: 1.5 }}>{reviewEmailWarning}</p>
                              <button
                                type="button"
                                onClick={() => { setReviewEmailWarning(null); setFlowStep('form'); }}
                                style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', background: 'none', border: '1px solid #f59e0b', borderRadius: '5px', padding: '4px 10px', cursor: 'pointer' }}
                              >
                                Change Plan →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Total row */}
                  <div style={{
                    padding: '14px 20px',
                    background: '#f8fafc',
                    borderTop: '1.5px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Total Due</span>
                    <div style={{ textAlign: 'right' }}>
                      {priceDisplay.crossed && (
                        <p style={{ margin: '0 0 2px', fontSize: '11px', textDecoration: 'line-through', color: '#94a3b8' }}>
                          {priceDisplay.crossed}
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: tm.accent, letterSpacing: '-0.5px' }}>
                        {priceDisplay.main}
                      </p>
                      {priceDisplay.badge && (
                        <span style={{
                          display: 'inline-block', marginTop: '3px',
                          background: '#fef2f2', color: '#dc2626',
                          fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px',
                        }}>
                          {priceDisplay.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Trust badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '7px', padding: '10px 16px',
                  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '12px', color: '#15803d', fontWeight: 500,
                }}>
                  <Shield size={14} fill="#15803d" color="#15803d" />
                  256-bit encrypted · Secured by Razorpay · DCRF Verified
                </div>

                {/* ── Action buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setFlowStep('form')}
                    disabled={isPaying}
                    style={{
                      padding: '13px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: '14px', fontWeight: 600,
                      cursor: isPaying ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    ← Go Back
                  </button>
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={isPaying}
                    style={{
                      padding: '13px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isPaying
                        ? '#e2e8f0'
                        : `linear-gradient(135deg, ${tm.accent} 0%, ${tm.accent}cc 100%)`,
                      color: isPaying ? '#94a3b8' : '#ffffff',
                      fontSize: '14px', fontWeight: 700,
                      cursor: isPaying ? 'not-allowed' : 'pointer',
                      boxShadow: isPaying ? 'none' : `0 4px 16px ${tm.accent}35`,
                      transition: 'all 0.18s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      letterSpacing: '0.2px',
                    }}
                  >
                    {isPaying ? (
                      <>Processing…</>
                    ) : (
                      <><Shield size={15} fill="white" color="white" /> Proceed to Payment · {priceDisplay.main}</>
                    )}
                  </button>
                </div>
              </div>
            );
          })() : (
            <form onSubmit={handleSubmit}>
              <h2 className={styles.formTitle}>Join the Resilience Movement</h2>
              <p className={styles.formSubtitle}>
                Submit your details below to initiate verification and join the working groups.
              </p>

              <div className={styles.formGrid}>
                {fields.map(field => renderDynamicField(field))}

                {/* ── Premium Inline Upgrade Panel ─────────────────────────── */}
                {emailCheckResult?.hasMembership && !emailCheckResult.isExpired ? (() => {
                  const existingRank = emailCheckResult.tierRank ?? 0;
                  const selectedRank = TIER_RANK[formData.tier] ?? 0;
                  const upgradeTiers = tiers.filter(t => (TIER_RANK[t.name] ?? 0) > existingRank && t.price > 0);
                  const isValidUpgrade = selectedRank > existingRank;

                  const tierMeta: Record<string, { icon: React.ReactNode; accent: string; pale: string; border: string }> = {
                    Prime:   { icon: <Zap size={16} />,   accent: '#0e7a6b', pale: '#f0fdf9', border: '#5eead4' },
                    Premium: { icon: <Star size={16} />,  accent: '#6d28d9', pale: '#f5f3ff', border: '#c4b5fd' },
                    Gold:    { icon: <Crown size={16} />, accent: '#b45309', pale: '#fffbeb', border: '#fcd34d' },
                  };

                  return (
                    <div className={styles.fieldFull} style={{
                      background: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '14px',
                      overflow: 'hidden',
                    }}>
                      {/* ── Header strip */}
                      <div style={{
                        background: 'linear-gradient(135deg, #7f0000 0%, #b91c1c 100%)',
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}>
                        <Shield size={22} fill="white" color="white" strokeWidth={1.5} />
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '0.2px' }}>
                            You&apos;re already a <span style={{ color: '#fcd34d' }}>{emailCheckResult.tier}</span> Member
                          </p>
                          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>
                            {emailCheckResult.expiresAt
                              ? <>Valid until <strong>{new Date(emailCheckResult.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></>
                              : '✓ Lifetime access · Upgrade to unlock more benefits'
                            }
                          </p>
                        </div>
                      </div>

                      {/* ── Tier picker */}
                      <div style={{ padding: '16px 20px 20px' }}>
                        <p style={{
                          margin: '0 0 12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase',
                          color: '#64748b',
                        }}>
                          Select upgrade plan
                        </p>
                        {upgradeTiers.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                            {upgradeTiers.map(t => {
                              const meta = tierMeta[t.name] || { icon: <Star size={16} />, accent: '#334155', pale: '#f8fafc', border: '#e2e8f0' };
                              const isSelected = formData.tier === t.name;
                              const isDiscountActive = t.discount &&
                                new Date(t.discount.startDate) <= currentTime &&
                                new Date(t.discount.endDate) >= currentTime;
                              const displayPrice = isDiscountActive && t.discount
                                ? t.price - (t.price * t.discount.percentage / 100)
                                : t.price;

                                return (
                                  <button
                                    key={t.name}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, tier: t.name }))}
                                    style={{
                                      background: isSelected ? meta.pale : '#ffffff',
                                      border: `2px solid ${isSelected ? meta.accent : '#e2e8f0'}`,
                                      borderRadius: '10px',
                                      padding: '12px 14px',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      transition: 'all 0.18s ease',
                                      position: 'relative',
                                      overflow: 'hidden',
                                      outline: 'none',
                                      boxShadow: isSelected ? `0 0 0 3px ${meta.accent}18` : 'none',
                                    }}
                                  >
                                    {/* Top Right Discount Ribbon Tag */}
                                    {isDiscountActive && t.discount && (
                                      <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        background: meta.accent,
                                        color: '#ffffff',
                                        fontSize: '8px',
                                        fontWeight: 900,
                                        padding: '3px 8px',
                                        borderBottomLeftRadius: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        zIndex: 5
                                      }}>
                                        {t.discount.percentage}% OFF
                                      </div>
                                    )}

                                    {/* Selected checkmark */}
                                    {isSelected && (
                                      <span style={{
                                        position: 'absolute',
                                        top: (isDiscountActive && t.discount) ? '24px' : '8px',
                                        right: '8px',
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        background: meta.accent,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10
                                      }}>
                                        <Check size={9} strokeWidth={3.5} color="#fff" />
                                      </span>
                                    )}

                                    {/* Icon + Name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingRight: '40px' }}>
                                      <span style={{ color: meta.accent }}>{meta.icon}</span>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{t.name}</span>
                                    </div>

                                    {/* Price */}
                                    {isDiscountActive && t.discount && (
                                      <p style={{ margin: '0 0 1px', fontSize: '10px', textDecoration: 'line-through', color: '#94a3b8' }}>
                                        ₹{t.price.toLocaleString('en-IN')}
                                      </p>
                                    )}
                                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: isDiscountActive ? '#059669' : meta.accent }}>
                                      ₹{displayPrice.toLocaleString('en-IN')}{' '}
                                      <span style={{ fontSize: '10px', fontWeight: 500, color: '#94a3b8' }}>/year</span>
                                    </p>

                                    {/* Micro Timer Box inside selected card */}
                                    {isDiscountActive && t.discount && isSelected && (() => {
                                      const countdown = getCountdownString(t.discount.endDate);
                                      if (!countdown) return null;
                                      return (
                                        <div style={{
                                          marginTop: '8px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '3px',
                                          background: '#fef2f2',
                                          border: '1px solid rgba(220, 38, 38, 0.15)',
                                          padding: '2px 6px',
                                          borderRadius: '5px',
                                          alignSelf: 'flex-start'
                                        }}>
                                          <span style={{ fontSize: '8px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', marginRight: '2px' }}>Ends:</span>
                                          <span style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, color: '#dc2626' }}>
                                            {String(countdown.days).padStart(2, '0')}d {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
                            You are on the highest tier. No upgrades available.
                          </p>
                        )}

                        {/* CTA */}
                        {upgradeTiers.length > 0 && (
                          <button
                            type="submit"
                            disabled={!isValidUpgrade}
                            style={{
                              width: '100%',
                              padding: '13px 20px',
                              borderRadius: '9px',
                              border: 'none',
                              cursor: isValidUpgrade ? 'pointer' : 'not-allowed',
                              fontSize: '14px',
                              fontWeight: 700,
                              letterSpacing: '0.2px',
                              transition: 'all 0.18s ease',
                              background: isValidUpgrade
                                ? `linear-gradient(135deg, ${(tierMeta[formData.tier] || tierMeta.Prime).accent}, ${(tierMeta[formData.tier] || tierMeta.Prime).accent}cc)`
                                : '#e2e8f0',
                              color: isValidUpgrade ? '#ffffff' : '#94a3b8',
                              boxShadow: isValidUpgrade
                                ? `0 4px 16px ${(tierMeta[formData.tier] || tierMeta.Prime).accent}35`
                                : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                            }}
                          >
                            {isValidUpgrade ? (
                              <>{(tierMeta[formData.tier] || tierMeta.Prime).icon} Upgrade to {formData.tier} →</>
                            ) : (
                              <>Select a plan above</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <button type="submit" className={`${styles.submitBtn} ${styles.fieldFull}`}>
                    Submit Application
                  </button>
                )}
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
                    {(() => {
                      if (lockedPrice !== null) {
                        return lockedPrice === 0 ? 'Free' : `₹${lockedPrice.toLocaleString('en-IN')}`;
                      }
                      const t = tiers.find(x => x.name === formData.tier);
                      if (!t) return formData.tier === 'Prime' ? '₹20,000' : formData.tier === 'Premium' ? '₹50,000' : '₹1,00,000';
                      if (t.price === 0) return 'Free';
                      if (t.discount) {
                        const discPrice = t.price - (t.price * t.discount.percentage / 100);
                        return `₹${discPrice.toLocaleString('en-IN')}`;
                      }
                      return `₹${t.price.toLocaleString('en-IN')}`;
                    })()}
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
