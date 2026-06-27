'use client';

import React, { useState } from 'react';
import { Loader2, Mail, Phone, MapPin, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import DisasterEffects from '@/components/ui/DisasterEffects/DisasterEffects';
import PageHero from '@/components/ui/PageHero/PageHero';

interface ContactInfo {
  title: string;
  value: string;
  type: string;
}

interface ContactData {
  officeName: string;
  address: string;
  lat: string;
  lon: string;
  alt: string;
  contacts: ContactInfo[];
}

export default function ContactClient({ contactData }: { contactData: ContactData }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mapMode, setMapMode] = useState<'road' | 'satellite'>('road');

  const emails = contactData.contacts.filter(c => c.type === 'email');
  const phones = contactData.contacts.filter(c => c.type === 'phone');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit contact request.');
      }

      setIsSuccess(true);
      setSuccessMsg(data.message || 'Thank you! Your query has been logged. Our secretariat will contact you shortly.');
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <DisasterEffects theme="general" intensity="low" />

      {/* ── Premium Hero ────────────────────────────────────── */}
      <ScrollReveal direction="down">
        <PageHero
          theme="council"
          eyebrow="DCRF Emergency Coordination Center"
          line1="Contact"
          line2="Secretariat"
          subtitle="Reach out to our operations room or submit a query directly to our policy coordination staff."
        />
      </ScrollReveal>

      {/* ── Animated Info Tiles ─────────────────────────────── */}
      <ScrollReveal direction="up" delay={0.08}>
        <div className={styles.infoTiles}>
          <div className={styles.infoTile}>
            <div className={styles.infoTileIcon}><MapPin size={22} /></div>
            <div>
              <div className={styles.infoTileLabel}>Headquarters</div>
              <div className={styles.infoTileValue}>{contactData.officeName}</div>
              <div className={styles.infoTileSub}>{contactData.address.split(',').slice(-2).join(',').trim()}</div>
            </div>
          </div>
          <div className={styles.infoTile}>
            <div className={styles.infoTileIcon}><Mail size={22} /></div>
            <div>
              <div className={styles.infoTileLabel}>Email</div>
              {emails.map((e, i) => (
                <div key={i} className={i === 0 ? styles.infoTileValue : styles.infoTileSub}>{e.value}</div>
              ))}
            </div>
          </div>
          <div className={styles.infoTile}>
            <div className={styles.infoTileIcon}><Phone size={22} /></div>
            <div>
              <div className={styles.infoTileLabel}>Hotline</div>
              {phones.map((p, i) => (
                <div key={i} className={i === 0 ? styles.infoTileValue : styles.infoTileSub}>
                  {p.title !== 'Phone' ? `${p.title}: ` : ''}{p.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Two Columns Grid */}
      <div className={styles.grid}>
        {/* Left: Office details and map */}
        <div id="address">
          <ScrollReveal direction="right" delay={0.1}>
            <div className={styles.addressSection}>
              <h2 className={styles.sectionTitle}>Headquarters</h2>
              
              <div className={styles.addressBlock}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MapPin size={18} style={{ color: 'var(--wine-red-primary)' }} />
                  {contactData.officeName}
                </h4>
                <p style={{ paddingLeft: '28px' }}>
                  {contactData.address}
                </p>
              </div>

              <div className={styles.addressBlock}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={18} style={{ color: 'var(--wine-red-primary)' }} />
                  Electronic Communications
                </h4>
                <p style={{ paddingLeft: '28px' }}>
                  {emails.map((e, i) => (
                    <React.Fragment key={i}>
                      <strong>{e.title}:</strong> {e.value}<br />
                    </React.Fragment>
                  ))}
                </p>
              </div>

              <div className={styles.addressBlock}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={18} style={{ color: 'var(--wine-red-primary)' }} />
                  Hotline Numbers
                </h4>
                <p style={{ paddingLeft: '28px' }}>
                  {phones.map((p, i) => (
                    <React.Fragment key={i}>
                      <strong>{p.title}:</strong> {p.value}<br />
                    </React.Fragment>
                  ))}
                </p>
              </div>

              {/* Map embed */}
              <div className={styles.mapContainer}>
                <div className={styles.mapHeader}>
                  <div className={styles.mapStatus}>
                    <span className="pulse-dot" style={{ width: '8px', height: '8px' }} />
                    <span className="monospaced-tel" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-default)' }}>
                      OPERATIONS ROOM GPS // ONLINE
                    </span>
                  </div>
                  <div className={styles.mapModes}>
                    <button type="button" onClick={() => setMapMode('road')}
                      className={`${styles.modeBtn} ${mapMode === 'road' ? styles.modeBtnActive : ''}`}>ROAD</button>
                    <button type="button" onClick={() => setMapMode('satellite')}
                      className={`${styles.modeBtn} ${mapMode === 'satellite' ? styles.modeBtnActive : ''}`}>SATELLITE</button>
                  </div>
                </div>

                <div className={`${styles.mapWrapper} radar-sweep-container`}>
                  {mapMode === 'satellite' && <div className="radar-sweep-line" />}
                  <iframe
                    key={mapMode}
                    title="DCRF HQ Map"
                    src={
                      mapMode === 'road'
                        ? `https://maps.google.com/maps?q=${contactData.lat},${contactData.lon}&t=m&z=17&output=embed`
                        : `https://maps.google.com/maps?q=${contactData.lat},${contactData.lon}&t=k&z=17&output=embed`
                    }
                    loading="lazy"
                    allowFullScreen
                  />
                  <div className={styles.mapTelemetry}>
                    <div className="monospaced-tel" style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.95)', lineHeight: '1.4' }}>
                      LOC: {contactData.officeName}<br />
                      LAT: {contactData.lat}° N | LON: {contactData.lon}° E<br />
                      ALT: {contactData.alt} • SCAN: ACTIVE
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Right: Query form */}
        <div id="form">
          <ScrollReveal direction="left" delay={0.15}>
            <div className={styles.formSection}>
              {isSuccess ? (
                <div className={styles.successBox}>
                  <CheckCircle size={40} style={{ color: 'var(--accessible-green)', marginBottom: '16px', display: 'inline-block' }} />
                  <h3 className={styles.successTitle}>Query Submitted</h3>
                  <p className={styles.successText}>{successMsg}</p>
                  <button onClick={() => setIsSuccess(false)} className={styles.submitBtn} style={{ margin: '20px auto 0' }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className={styles.sectionTitle}>Query Submission</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>
                    Have questions regarding partnerships, summits, or data indices? Log a direct request below.
                  </p>

                  <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Full Name</label>
                      <input type="text" className={styles.input} placeholder="e.g. Vikramaditya Roy"
                        value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email Address</label>
                      <input type="email" className={styles.input} placeholder="name@organization.org"
                        value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Subject</label>
                      <input type="text" className={styles.input} placeholder="e.g. DCRC Conclave Sponsorship"
                        value={subject} onChange={(e) => setSubject(e.target.value)} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Message Details</label>
                      <textarea className={styles.textarea} placeholder="Write your request or message here..."
                        value={message} onChange={(e) => setMessage(e.target.value)} required />
                    </div>

                    {error && (
                      <div className={styles.errorText}>
                        <AlertTriangle size={14} />
                        <span>{error}</span>
                      </div>
                    )}

                    <button type="submit" disabled={isLoading} className={styles.submitBtn}>
                      {isLoading ? (
                        <><Loader2 size={16} className={styles.spinner} /> Logging Request...</>
                      ) : (
                        <><Send size={14} /> Submit Query Form</>
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
