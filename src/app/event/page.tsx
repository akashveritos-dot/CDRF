'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { eventFeatures } from '@/data/dataStore';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { Calendar, MapPin, Users, Award, Shield } from 'lucide-react';

const scheduleDay1 = [
  { time: '09:30 - 10:30', title: 'Inaugural Plenary & Keynote address', desc: 'Welcome address by Secretary General DCRF. Launch of the Annual Disaster & Climate Action Index Report by NDMA officials.' },
  { time: '11:00 - 12:30', title: 'Panel: Aligning CSR & ESG Capital for Pre-Disaster Resilience', desc: 'Directing corporate giving from post-disaster response to localized mitigation tools, early warning arrays, and municipal cooling structures.' },
  { time: '14:00 - 15:30', title: 'Panel: Himalayan Glacier Retreat & Downstream Flooding', desc: 'Technical assessments from ISRO researchers and glacier geologists mapping GLOF patterns and water secure zones through 2050.' },
  { time: '16:00 - 17:30', title: 'Working Group: Heat Action Plan deployment guides', desc: 'Municipal frameworks for Indian cities over 1 million population. Early warning, cool roofs, and cooling centers.' }
];

const scheduleDay2 = [
  { time: '09:30 - 11:30', title: 'Disaster-Tech start-up Pitch & Showcase', desc: 'Geospatial mapping systems, drone surveillance models, real-time IoT sensors, and climate risk analytics startups presenting prototypes.' },
  { time: '12:00 - 13:30', title: 'Panel: Climate-Induced Migration & Community Shelters', desc: 'Socio-economic vulnerabilities, delta erosion, and traditional coastal shelter architectures integrating modern Early Warning systems.' },
  { time: '14:30 - 16:00', title: 'Federation Networking & Working Group alignment', desc: 'Interactive workshop matching corporate CSR leads with local NGOs and research bodies to deploy resilience projects.' },
  { time: '16:30 - 17:30', title: 'DCRF Recognition Awards Ceremony', desc: 'Honoring Best Corporate Response, Best NGO Initiative, Disaster-Tech Innovator, and Climate Resilient Community Awards.' }
];

export default function EventPage() {
  const [activeTab, setActiveTab] = useState('Day 1');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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

  // Calculate live countdown to Nov 26, 2026
  useEffect(() => {
    const targetDate = new Date('2026-11-26T09:30:00+05:30').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          designation: formData.designation,
          role: formData.role
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register interest');

      setIsRegistered(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.page}>
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <h1 className={styles.title}>DCRC 2026 Conclave</h1>
          <p className={styles.subtitle}>
            India’s premier annual convening forum mapping disaster technologies, policy briefs, and corporate CSR resilience frameworks.
          </p>
        </div>
      </ScrollReveal>

      {/* Main Conclave Banner */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className={styles.banner}>
          <div>
            <div className={styles.eventEyebrow}>Hybrid Conclave • New Delhi</div>
            <h3>Disaster & Climate Resilience Conclave 2026</h3>
            <p>
              Under the theme <strong>"Convergence for Action"</strong>, DCRC ’26 will gather 500+ delegates from ministries,
              global agencies (UNDRR, World Bank), major corporates, NGOs, and IIT researchers to map joint resilience operations.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} style={{ color: 'var(--gold-light)' }} />
                Nov 26–27, 2026
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} style={{ color: 'var(--gold-light)' }} />
                India International Centre, New Delhi
              </span>
            </div>
          </div>
          <div className={styles.dateCard}>
            <div className={styles.dateMonth}>November</div>
            <div className={styles.dateDay}>26–27</div>
            <div className={styles.dateYear}>2026 • New Delhi</div>
          </div>
        </div>
      </ScrollReveal>

      {/* Countdown Widget */}
      <ScrollReveal direction="up">
        <div className={styles.countdownSec}>
          <span className={styles.countdownLabel}>Conclave Commencing In:</span>
          <div className={styles.countdownGrid}>
            <div className={styles.cdItem}>
              <span className={styles.cdVal}>{countdown.days}</span>
              <span className={styles.cdLabel}>Days</span>
            </div>
            <div className={styles.cdItem}>
              <span className={styles.cdVal}>{countdown.hours}</span>
              <span className={styles.cdLabel}>Hours</span>
            </div>
            <div className={styles.cdItem}>
              <span className={styles.cdVal}>{countdown.minutes}</span>
              <span className={styles.cdLabel}>Min</span>
            </div>
            <div className={styles.cdItem}>
              <span className={styles.cdVal}>{countdown.seconds}</span>
              <span className={styles.cdLabel}>Sec</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Features Grid */}
      <div className={styles.featuresGrid}>
        {eventFeatures.map((feat, idx) => (
          <ScrollReveal
            key={feat.id}
            direction="up"
            delay={0.05 * (idx % 3)}
          >
            <div className={styles.featCard}>
              <div className={styles.featIcon}>{feat.icon}</div>
              <h5>{feat.title}</h5>
              <p>{feat.description}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Schedule Program */}
      <section className={styles.scheduleSec}>
        <ScrollReveal direction="up">
          <h2>Conclave Agenda Program</h2>
        </ScrollReveal>

        {/* Agenda tabs */}
        <ScrollReveal direction="up" delay={0.1}>
          <div className={styles.scheduleTabs}>
            {['Day 1', 'Day 2'].map((day) => (
              <button
                key={day}
                className={`${styles.scheduleTab} ${activeTab === day ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(day)}
              >
                {day} Schedule
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Timeline lists */}
        <div className={styles.timeline}>
          {(activeTab === 'Day 1' ? scheduleDay1 : scheduleDay2).map((item, idx) => (
            <ScrollReveal
              key={idx}
              direction="left"
              delay={0.05 * idx}
            >
              <div className={styles.tRow}>
                <div className={styles.tTime}>{item.time}</div>
                <div className={styles.tDetails}>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Registration form */}
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
                  <select
                    name="role"
                    className={styles.select}
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  >
                    <option value="In-Person Delegate">In-Person Delegate (India International Centre)</option>
                    <option value="Virtual Delegate">Virtual Delegate (Live Web Stream)</option>
                    <option value="Sponsor / Exhibition partner">Exhibitor (Disaster-Tech Expo pavilion)</option>
                    <option value="Media representative">Media delegate / Press pass</option>
                  </select>
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
    </div>
  );
}
