'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import PageHero from '@/components/ui/PageHero/PageHero';

interface Section {
  id: string;
  title: string;
  number: string;
}

const SECTIONS: Section[] = [
  { id: 'collection', title: 'Information We Collect', number: '01' },
  { id: 'usage', title: 'How We Use Your Data', number: '02' },
  { id: 'cookies', title: 'Cookies & Analytics Telemetry', number: '03' },
  { id: 'sharing', title: 'Data Sharing & Partnerships', number: '04' },
  { id: 'rights', title: 'Your Rights (DPDP Compliance)', number: '05' },
  { id: 'security', title: 'Data Security Protocols', number: '06' }
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('collection');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) {
        sectionRefs.current[sec.id] = el;
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Premium Hero ────────────────────────────────────── */}
      <ScrollReveal direction="down">
        <PageHero
          theme="reports"
          eyebrow="Effective: June 4, 2026"
          line1="PRIVACY"
          line2="POLICY"
          subtitle="How the Disaster &amp; Climate Resilience Federation protects and manages your digital footprints and registration information."
        />
      </ScrollReveal>

      {/* Two Column Layout */}
      <div className={styles.layout}>
        {/* Sticky Table of Contents */}
        <aside className={styles.sidebar}>
          <ScrollReveal direction="right" delay={0.1}>
            <div className={styles.sidebarLabel}>Table of Contents</div>
            <ul className={styles.tocList}>
              {SECTIONS.map((sec) => (
                <li key={sec.id}>
                  <button
                    onClick={() => handleScrollToSection(sec.id)}
                    className={`${styles.tocLink} ${activeSection === sec.id ? styles.activeTocLink : ''}`}
                  >
                    <span className={styles.tocNum}>{sec.number}</span>
                    {sec.title}
                  </button>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </aside>

        {/* Content Clauses */}
        <main className={styles.content}>
          <ScrollReveal direction="up" delay={0.1}>
            <section id="collection" className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>01</span> Information We Collect
              </h2>
              <div className={styles.textBlock}>
                <p>
                  To support community alerts and coordinate climate resilience efforts, DCRF collects information voluntarily provided by portal users, institutional representatives, and conclave attendees.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <strong>Registration & Onboarding:</strong> Full name, professional email, organizational affiliation, contact telephone number, and CSR funding tier selections.
                  </li>
                  <li className={styles.listItem}>
                    <strong>Chatbot Assistant interactions:</strong> Query text, page pathname, and timestamp data.
                  </li>
                  <li className={styles.listItem}>
                    <strong>Audit Logs:</strong> Admin/Superadmin adjustments (IP addresses, location metadata, timestamp records, and action names).
                  </li>
                </ul>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <section id="usage" className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>02</span> How We Use Your Data
              </h2>
              <div className={styles.textBlock}>
                <p>
                  DCRF collects and utilizes user information strictly in service of the federation's core resilience objectives:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    Disseminating critical policy updates, early warnings, and hazard warnings to newsletter subscribers.
                  </li>
                  <li className={styles.listItem}>
                    Managing working groups, advisory boards, and conclave registrations.
                  </li>
                  <li className={styles.listItem}>
                    Securing system actions through immutable audit logging to track credentials usage and content changes.
                  </li>
                  <li className={styles.listItem}>
                    Enhancing AI chatbot responses by reviewing query frequencies and page telemetry.
                  </li>
                </ul>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <section id="cookies" className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>03</span> Cookies & Analytics Telemetry
              </h2>
              <div className={styles.textBlock}>
                <p>
                  Our system utilizes technical cookies to maintain active admin sessions and analyze general visitor counts. We collect standard device indicators (browser version, OS, generic city location based on IP) to optimize page responsiveness.
                </p>
                <p>
                  We do not run tracking pixels or behavioral advertising arrays targeting user profiles.
                </p>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <section id="sharing" className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>04</span> Data Sharing & Partnerships
              </h2>
              <div className={styles.textBlock}>
                <p>
                  DCRF is a joint venture of TCUIF and DiCAF. Your information is accessed by the secretariat staff of these founding entities to process applications and manage events.
                </p>
                <p>
                  We do not sell, rent, or lease rosters of members or conclave registrants to commercial marketing entities.
                </p>
                <div className={styles.alertBox}>
                  <div className={styles.alertTitle}>Emergency Coordination Disclosure</div>
                  We may share aggregated, non-personally identifiable disaster metrics with government disaster authorities (e.g. NDMA, SDMAs) to support humanitarian response efforts.
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <section id="rights" className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>05</span> Your Rights (DPDP Compliance)
              </h2>
              <div className={styles.textBlock}>
                <p>
                  In compliance with the <strong>Digital Personal Data Protection (DPDP) Act</strong> of India, you hold the following rights:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    Right to access a summary of your personal data processed by DCRF.
                  </li>
                  <li className={styles.listItem}>
                    Right to correct, update, or complete erroneous profile data.
                  </li>
                  <li className={styles.listItem}>
                    Right to withdraw consent and request erasure of your registration.
                  </li>
                </ul>
                <p>
                  To exercise these rights, please contact our Secretariat via the Contact Support link or email us directly at the address listed on the contact page.
                </p>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <section id="security" className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>06</span> Data Security Protocols
              </h2>
              <div className={styles.textBlock}>
                <p>
                  We enforce security practices to safeguard all registration information:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    Passwords and sensitive credentials are encrypted using secure cryptographic hashing algorithms before storage.
                  </li>
                  <li className={styles.listItem}>
                    Admin control panels are restricted through session validation and security rules.
                  </li>
                  <li className={styles.listItem}>
                    System activities and modifications are audited and recorded in read-only tables to prevent unauthorized edits.
                  </li>
                </ul>
              </div>
            </section>
          </ScrollReveal>
        </main>
      </div>
    </div>
  );
}
