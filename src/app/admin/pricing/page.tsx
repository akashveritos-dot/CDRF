'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Edit,
  Trash2,
  Plus,
  Loader2,
  CheckCircle,
  Calendar,
  Percent,
  Tag,
  AlertCircle,
  X,
  Settings,
  Check
} from 'lucide-react';
import styles from './page.module.css';
import ActionLoader from '@/components/ui/ActionLoader/ActionLoader';

// Fixed list of available benefits to toggle
const BENEFIT_LIST = [
  'News & analytical information sharing',
  'Capacity building programmes',
  'Stakeholder engagements',
  'Event participation (DCRC)',
  'National Delegation participation',
  'International Delegation participation',
  'Advisory Committee membership'
];

interface Plan {
  id: number;
  name: string;
  price: number;
  priceSubText: string;
  isPopular: boolean;
  durationMonths: number;
  features: Record<string, boolean>;
}

interface Discount {
  id: number;
  tierName: string;
  title: string;
  percentage: number;
  startDate: string;
  endDate: string;
}

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing States
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    price: 0,
    priceSubText: '',
    isPopular: false,
    durationMonths: 12,
    features: {} as Record<string, boolean>
  });

  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [discountForm, setDiscountForm] = useState({
    tierName: 'Prime',
    title: '',
    percentage: 10,
    startDate: '',
    endDate: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch Pricing Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pricing');
      if (!res.ok) throw new Error('Failed to load pricing configurations');
      const data = await res.json();
      setPlans(data.plans || []);
      setDiscounts(data.discounts || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format Date for datetime-local Input
  const formatDateForDatetimeLocal = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Format Date for Display
  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Open Edit Plan Modal
  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      price: plan.price,
      priceSubText: plan.priceSubText || '',
      isPopular: plan.isPopular,
      durationMonths: plan.durationMonths ?? 12,
      features: { ...plan.features }
    });
    setError('');
    setSuccessMsg('');
    setIsPlanModalOpen(true);
  };

  // Toggle Plan Feature Checkbox
  const handleFeatureToggle = (featureName: string) => {
    setPlanForm(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureName]: !prev.features[featureName]
      }
    }));
  };

  // Submit Edit Plan
  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setError('');
    setIsSaving(true);
    setActionLoading('Saving pricing tier changes...');
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingPlan.name,
          ...planForm
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update plan');

      setSuccessMsg(`Plan ${editingPlan.name} updated successfully.`);
      setTimeout(() => setIsPlanModalOpen(false), 800);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save plan changes.');
    } finally {
      setIsSaving(false);
      setActionLoading(null);
    }
  };

  // Open Add Discount Modal
  const handleAddDiscount = () => {
    setEditingDiscount(null);
    setDiscountForm({
      tierName: 'Prime',
      title: 'Early Bird Sale',
      percentage: 10,
      startDate: formatDateForDatetimeLocal(new Date().toISOString()),
      endDate: formatDateForDatetimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    });
    setError('');
    setSuccessMsg('');
    setIsDiscountModalOpen(true);
  };

  // Open Edit Discount Modal
  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    setDiscountForm({
      tierName: discount.tierName,
      title: discount.title,
      percentage: discount.percentage,
      startDate: formatDateForDatetimeLocal(discount.startDate),
      endDate: formatDateForDatetimeLocal(discount.endDate)
    });
    setError('');
    setSuccessMsg('');
    setIsDiscountModalOpen(true);
  };

  // Submit Discount
  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    setActionLoading('Saving discount campaign...');
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save discount campaign');

      setSuccessMsg('Discount campaign configured successfully.');
      setTimeout(() => setIsDiscountModalOpen(false), 800);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save discount campaign.');
    } finally {
      setIsSaving(false);
      setActionLoading(null);
    }
  };

  // Clear / Delete Discount
  const handleDeleteDiscount = async (tierName: string) => {
    if (!confirm(`Are you sure you want to permanently clear the discount campaign for the ${tierName} tier?`)) return;
    setIsSaving(true);
    setActionLoading('Deleting discount campaign...');
    try {
      const res = await fetch(`/api/admin/pricing?tierName=${encodeURIComponent(tierName)}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to clear campaign.');
    } finally {
      setIsSaving(false);
      setActionLoading(null);
    }
  };

  // Check Discount Status (Active, Upcoming, Expired)
  const getDiscountStatus = (discount: Discount) => {
    const today = new Date();
    const start = new Date(discount.startDate);
    const end = new Date(discount.endDate);

    if (today < start) return { text: 'Scheduled', style: styles.statusScheduled };
    if (today > end) return { text: 'Expired', style: styles.statusExpired };
    return { text: 'Active', style: styles.statusActive };
  };

  // Helper to preview calculations on the fly
  const getSelectedPlanPrice = () => {
    const selected = plans.find(p => p.name === discountForm.tierName);
    return selected ? selected.price : 0;
  };

  const previewOriginalPrice = getSelectedPlanPrice();
  const previewDiscountedPrice = previewOriginalPrice - (previewOriginalPrice * (discountForm.percentage / 100));

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <Award className={styles.headerIcon} size={28} />
          <div>
            <h1>Membership Plan Pricing & Campaigns</h1>
            <p>Manage operational plan structures, corporate tier benefit toggles, and dynamic percent discount events.</p>
          </div>
        </div>
        <button onClick={handleAddDiscount} className={styles.addBtn}>
          <Plus size={16} />
          Configure Discount Campaign
        </button>
      </div>

      {error && !isPlanModalOpen && !isDiscountModalOpen && (
        <div className={styles.errorBox}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingBlock}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Polling payment structures and campaign records...</span>
        </div>
      ) : (
        <div className={styles.dashboardGrid}>
          {/* Left: Dynamic Pricing Tiers HUD */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Settings size={18} />
              <h2>Active Tier Pricing Configurations</h2>
            </div>
            
            <div className={styles.plansList}>
              {plans.map(plan => {
                const planDiscount = discounts.find(d => d.tierName === plan.name);
                const isDiscountActive = planDiscount && getDiscountStatus(planDiscount).text === 'Active';

                return (
                  <div key={plan.id} className={styles.planCard}>
                    <div className={styles.planMeta}>
                      <div>
                        <h3 className={styles.planName}>{plan.name} Tier</h3>
                        <p className={styles.planSub}>{plan.priceSubText || 'No description set'}</p>
                        {plan.name !== 'Basic' && (
                          <p className={styles.planSub} style={{ color: '#60a5fa', fontSize: '11px', marginTop: '2px' }}>
                            ⏱ {plan.durationMonths ?? 12}-month validity
                          </p>
                        )}
                      </div>
                      <div className={plan.isPopular ? styles.popularTag : styles.hidden}>
                        POPULAR
                      </div>
                    </div>

                    <div className={styles.planPriceWrapper}>
                      {isDiscountActive && planDiscount ? (
                        <div className={styles.discountedGrid}>
                          <span className={styles.originalPriceStrike}>
                            ₹{plan.price.toLocaleString('en-IN')}
                          </span>
                          <span className={styles.activePrice}>
                            ₹{(plan.price - (plan.price * planDiscount.percentage / 100)).toLocaleString('en-IN')}
                          </span>
                          <span className={styles.discountBadge}>
                            {planDiscount.percentage}% OFF — {planDiscount.title}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.normalPrice}>
                          {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
                        </span>
                      )}
                    </div>

                    {/* Quick list of enabled features */}
                    <div className={styles.featuresPreviewList}>
                      <strong>Enabled Benefits:</strong>
                      <div className={styles.featureChipsContainer}>
                        {BENEFIT_LIST.filter(b => plan.features[b]).map(b => (
                          <span key={b} className={styles.featureChip}>
                            <Check size={10} style={{ marginRight: '4px' }} /> {b}
                          </span>
                        ))}
                        {BENEFIT_LIST.filter(b => plan.features[b]).length === 0 && (
                          <span className={styles.noFeaturesChip}>No benefits enabled</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      <button onClick={() => handleEditPlan(plan)} className={styles.editCardBtn}>
                        <Edit size={14} style={{ marginRight: '6px' }} /> Edit Tier Data
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Discount Campaigns HUD */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Tag size={18} />
              <h2>Scheduled Discount campaigns</h2>
            </div>

            {discounts.length > 0 ? (
              <div className={styles.discountsList}>
                {discounts.map(d => {
                  const status = getDiscountStatus(d);
                  const plan = plans.find(p => p.name === d.tierName);
                  const planOriginalPrice = plan ? plan.price : 0;
                  const discountedValue = planOriginalPrice - (planOriginalPrice * d.percentage / 100);

                  return (
                    <div key={d.id} className={styles.discountCard}>
                      <div className={styles.discountHeader}>
                        <div>
                          <h4 className={styles.discountTitle}>{d.title}</h4>
                          <p className={styles.discountTarget}>Applies to: <strong>{d.tierName} Tier</strong></p>
                        </div>
                        <span className={`${styles.statusLabel} ${status.style}`}>
                          {status.text}
                        </span>
                      </div>

                      <div className={styles.discountDetails}>
                        <div className={styles.detailItem}>
                          <Percent size={14} />
                          <span>Percentage: <strong>{d.percentage}% Off</strong></span>
                        </div>
                        <div className={styles.detailItem}>
                          <Calendar size={14} />
                          <span>Duration: <strong>{formatDateForDisplay(d.startDate)} to {formatDateForDisplay(d.endDate)}</strong></span>
                        </div>
                        <div className={styles.detailItem}>
                          <Award size={14} />
                          <span>Math: <del>₹{planOriginalPrice.toLocaleString('en-IN')}</del> → <strong>₹{discountedValue.toLocaleString('en-IN')}</strong></span>
                        </div>
                      </div>

                      <div className={styles.discountActions}>
                        <button onClick={() => handleEditDiscount(d)} disabled={isSaving} className={styles.editMiniBtn}>
                          <Edit size={12} /> Edit Campaign
                        </button>
                        <button onClick={() => handleDeleteDiscount(d.tierName)} disabled={isSaving} className={styles.deleteMiniBtn}>
                          <Trash2 size={12} /> Clear Campaign
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyDiscounts}>
                <Tag size={36} />
                <h3>No campaigns configured.</h3>
                <p>Click "Configure Discount Campaign" at the top right to start a percentage sale for a membership tier.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Editor Modal */}
      {isPlanModalOpen && editingPlan && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit Plan: {editingPlan.name} Tier</h2>
              <button onClick={() => setIsPlanModalOpen(false)} className={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className={styles.modalError}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className={styles.modalSuccess}>
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handlePlanSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                {/* Numeric Price */}
                <div className={styles.inputGroup}>
                  <label htmlFor="price">Base Tier Price (INR)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required
                    min={0}
                    value={planForm.price}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className={styles.inputField}
                    disabled={editingPlan.name === 'Basic'}
                  />
                  {editingPlan.name === 'Basic' && (
                    <span className={styles.fieldHelp}>Basic registration is structurally free.</span>
                  )}
                </div>

                {/* Sub Text */}
                <div className={styles.inputGroup}>
                  <label htmlFor="priceSubText">Price Subtitle / Description</label>
                  <input
                    type="text"
                    id="priceSubText"
                    name="priceSubText"
                    required
                    value={planForm.priceSubText}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, priceSubText: e.target.value }))}
                    placeholder="e.g. Per Annum — NGO & Academia"
                    className={styles.inputField}
                  />
                </div>

                {/* Duration Months */}
                {editingPlan.name !== 'Basic' && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="durationMonths">Membership Duration (Months)</label>
                    <input
                      type="number"
                      id="durationMonths"
                      name="durationMonths"
                      required
                      min={1}
                      max={120}
                      value={planForm.durationMonths}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, durationMonths: parseInt(e.target.value) || 12 }))}
                      className={styles.inputField}
                      placeholder="12"
                    />
                    <span className={styles.fieldHelp}>How long this membership tier is valid after purchase (e.g. 12 = 1 year, 6 = 6 months).</span>
                  </div>
                )}

                {/* Popular toggle */}
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="isPopular"
                    name="isPopular"
                    checked={planForm.isPopular}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, isPopular: e.target.checked }))}
                    className={styles.checkboxField}
                  />
                  <label htmlFor="isPopular" style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>
                    Feature as "Most Popular" Plan
                  </label>
                </div>

                {/* Feature Checklist */}
                <div className={styles.featuresGrid}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Configure Plan Benefits</label>
                  <div className={styles.checklist}>
                    {BENEFIT_LIST.map(feature => (
                      <div key={feature} className={styles.checklistRow}>
                        <input
                          type="checkbox"
                          id={`feat-${feature}`}
                          checked={!!planForm.features[feature]}
                          onChange={() => handleFeatureToggle(feature)}
                          className={styles.checkboxField}
                        />
                        <label htmlFor={`feat-${feature}`} className={styles.checklistLabel}>
                          {feature}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <Loader2 size={14} className={styles.spinner} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Manager Modal */}
      {isDiscountModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingDiscount ? 'Modify Discount Campaign' : 'Configure New Discount Campaign'}</h2>
              <button onClick={() => setIsDiscountModalOpen(false)} className={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className={styles.modalError}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className={styles.modalSuccess}>
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleDiscountSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                {/* Select Tier */}
                <div className={styles.inputGroup}>
                  <label htmlFor="tierName">Select Plan Tier</label>
                  <select
                    id="tierName"
                    name="tierName"
                    value={discountForm.tierName}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, tierName: e.target.value }))}
                    className={styles.inputField}
                    disabled={!!editingDiscount}
                  >
                    <option value="Prime">Prime Tier</option>
                    <option value="Premium">Premium Tier</option>
                    <option value="Gold">Gold Tier</option>
                  </select>
                </div>

                {/* Campaign Name */}
                <div className={styles.inputGroup}>
                  <label htmlFor="title">Campaign Name / Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={discountForm.title}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Early Bird Sale, Monsoon Discount"
                    className={styles.inputField}
                  />
                </div>

                {/* Percentage */}
                <div className={styles.inputGroup}>
                  <label htmlFor="percentage">Discount Percentage (%)</label>
                  <input
                    type="number"
                    id="percentage"
                    name="percentage"
                    required
                    min={1}
                    max={100}
                    value={discountForm.percentage}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, percentage: Math.min(100, Math.max(1, parseInt(e.target.value) || 0)) }))}
                    className={styles.inputField}
                  />
                </div>

                {/* Date Fields */}
                <div className={styles.datesRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="startDate">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      id="startDate"
                      name="startDate"
                      required
                      value={discountForm.startDate}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="endDate">End Date & Time</label>
                    <input
                      type="datetime-local"
                      id="endDate"
                      name="endDate"
                      required
                      value={discountForm.endDate}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                {/* Live Preview Console Box */}
                <div className={styles.previewBox}>
                  <strong>LIVE HUD CALCULATION PREVIEW:</strong>
                  <div className={styles.previewRow}>
                    <span>Plan Tier Selected:</span>
                    <span>{discountForm.tierName}</span>
                  </div>
                  <div className={styles.previewRow}>
                    <span>Original Base Price:</span>
                    <span>₹{previewOriginalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.previewRow}>
                    <span>Discount Percentage:</span>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>-{discountForm.percentage}%</span>
                  </div>
                  <div className={styles.previewDivider}></div>
                  <div className={styles.previewRow} style={{ fontSize: '15px', fontWeight: 'bold' }}>
                    <span>Effective Campaign Price:</span>
                    <span style={{ color: '#10b981' }}>₹{previewDiscountedPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsDiscountModalOpen(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <Loader2 size={14} className={styles.spinner} /> : 'Save Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ActionLoader message={actionLoading} />
    </div>
  );
}
