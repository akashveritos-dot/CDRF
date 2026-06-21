'use client';

import React, { useState } from 'react';
import { Loader2, Mail, Phone, MapPin, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import DisasterEffects from '@/components/ui/DisasterEffects/DisasterEffects';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mapMode, setMapMode] = useState<'road' | 'satellite'>('road');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, subject, message })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit contact request.');
      }

      setIsSuccess(true);
      setSuccessMsg(data.message || 'Thank you! Your query has been logged. Our secretariat will contact you shortly.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <DisasterEffects theme="general" intensity="low" />
      {/* Page Header */}
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <h1 className={styles.title}>Contact the Secretariat</h1>
          <p style={{ color: 'var(--wine-red-primary)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            DCRF Emergency Coordination Center
          </p>
          <p className={styles.subtitle}>
            Reach out to our operations room or submit a query directly to our policy coordination staff.
          </p>
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
                  DCRF Secretariat Office
                </h4>
                <p style={{ paddingLeft: '28px' }}>
                  Core 4B, 2nd Floor, India Habitat Centre (IHC),<br />
                  Lodhi Road, New Delhi — 110003
                </p>
              </div>

              <div className={styles.addressBlock}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={18} style={{ color: 'var(--wine-red-primary)' }} />
                  Electronic Communications
                </h4>
                <p style={{ paddingLeft: '28px' }}>
                  <strong>General queries:</strong> info@dcrf.org<br />
                  <strong>Secretariat:</strong> secretariat@dcrf.org
                </p>
              </div>

              <div className={styles.addressBlock}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={18} style={{ color: 'var(--wine-red-primary)' }} />
                  Hotline Numbers
                </h4>
                <p style={{ paddingLeft: '28px' }}>
                  <strong>Phone:</strong> +91 11 4355 6700<br />
                  <strong>Operations:</strong> +91 11 4355 6709
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
                    <button
                      type="button"
                      onClick={() => setMapMode('road')}
                      className={`${styles.modeBtn} ${mapMode === 'road' ? styles.modeBtnActive : ''}`}
                    >
                      ROAD
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapMode('satellite')}
                      className={`${styles.modeBtn} ${mapMode === 'satellite' ? styles.modeBtnActive : ''}`}
                    >
                      SATELLITE
                    </button>
                  </div>
                </div>

                <div className={`${styles.mapWrapper} radar-sweep-container`}>
                  {mapMode === 'satellite' && <div className="radar-sweep-line" />}
                  
                  <iframe
                    key={mapMode}
                    title="DCRF India Habitat Centre HQ Map"
                    src={
                      mapMode === 'road'
                        ? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.2086973305417!2d77.22220131508174!3d28.593531382434522!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d04ed283b8b17%3A0xd64d0bcfa053229b!2sIndia%20Habitat%20Centre!5e0!3m2!1sen!2sin!4v1655000000000!5m2!1sen!2sin"
                        : "https://maps.google.com/maps?q=India%20Habitat%20Centre,%20New%20Delhi&t=k&z=17&output=embed"
                    }
                    loading="lazy"
                    allowFullScreen
                  />

                  {/* Telemetry overlay inside map */}
                  <div className={styles.mapTelemetry}>
                    <div className="monospaced-tel" style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.95)', lineHeight: '1.4' }}>
                      LOC: India Habitat Centre, IHC, New Delhi<br />
                      LAT: 28.5935° N | LON: 77.2222° E<br />
                      ALT: 216m • SCAN: ACTIVE
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
                  <button 
                    onClick={() => setIsSuccess(false)} 
                    className={styles.submitBtn}
                    style={{ margin: '20px auto 0' }}
                  >
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
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g. Vikramaditya Roy"
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
                      <label className={styles.label}>Subject</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g. DCRC Conclave Sponsorship"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Message Details</label>
                      <textarea
                        className={styles.textarea}
                        placeholder="Write your request or message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                    </div>

                    {error && (
                      <div className={styles.errorText}>
                        <AlertTriangle size={14} />
                        <span>{error}</span>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isLoading} 
                      className={styles.submitBtn}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className={styles.spinner} />
                          Logging Request...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Submit Query Form
                        </>
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
