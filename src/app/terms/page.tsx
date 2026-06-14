'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';

interface Section {
  id: string;
  title: string;
  number: string;
}

const SECTIONS: Section[] = [
  { id: 'acceptance', title: 'Acceptance of Agreement', number: '01' },
  { id: 'membership', title: 'Membership Eligibility & Registration', number: '02' },
  { id: 'data-use', title: 'Intellectual Property & Data Usage Guidelines', number: '03' },
  { id: 'telemetry', title: 'Early Warning Telemetry & Hazards Policy', number: '04' },
  { id: 'liability', title: 'Limitation of Liability & Indemnification', number: '05' },
  { id: 'governance', title: 'Governing Law & Legal Secretariat', number: '06' }
];

export default function TermsOfUse() {
  const [activeSection, setActiveSection] = useState('acceptance');
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
      const offset = 100; // Offset for sticky headers
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
      {/* Sleek Gradient Header */}
      <div className={styles.hero}>
        <ScrollReveal direction="down">
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Terms of Use</h1>
            <p className={styles.subtitle}>
              Effective Date: June 4, 2026. Review the legal agreement governing your participation and usage of the Disaster & Climate Resilience Federation (DCRF) portal.
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Two Column Layout */}
      <div className={styles.layout}>
        {/* Sticky Table of Contents */}
        <aside className={styles.sidebar}>
          <ScrollReveal direction="right" delay={0.1}>
            <h3 className={styles.sidebarTitle}>Navigation</h3>
            <ul className={styles.tocList}>
              {SECTIONS.map((sec) => (
                <li key={sec.id}>
                  <button
                    onClick={() => handleScrollToSection(sec.id)}
                    className={`${styles.tocLink} ${activeSection === sec.id ? styles.activeTocLink : ''}`}
                    style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }}
                  >
                    Section {sec.number}: {sec.title}
                  </button>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </aside>

        {/* Content Clauses */}
        <main className={styles.content}>
          <ScrollReveal direction="up" delay={0.1}>
            <section id="acceptance" className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>01</span> Acceptance of Agreement
              </h2>
              <div className={styles.textBlock}>
                <p>
                  By accessing, browsing, registering for, or using the portal, data assets, and community networks of the <strong>Disaster & Climate Resilience Federation (DCRF)</strong>, you represent that you have read, understood, and agreed to be bound by these Terms of Use, establishing a binding legal contract between you (or the organization you represent) and DCRF.
                </p>
                <p>
                  If you are entering into this agreement on behalf of a corporation, municipal body, NGO, or academic institution, you represent that you possess the requisite authority to bind such entity. If you do not accept these terms, you are prohibited from utilizing DCRF services.
                </p>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <section id="membership" className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>02</span> Membership Eligibility & Registration
              </h2>
              <div className={styles.textBlock}>
                <p>
                  DCRF is a multi-stakeholder alliance driving convergence across climate science, media, and corporate social investments. Membership tiers (Institutional Partner, Patron Member, Advisory Board, Working Groups) are granted following validation of credentials by the DCRF Secretariat.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <strong>Accuracy of Credentials:</strong> Members must provide true, complete, and current information during onboarding and alert subscriptions.
                  </li>
                  <li className={styles.listItem}>
                    <strong>Code of Conduct:</strong> Representatives participating in working groups, governing councils, or Monthly Webinars must engage in cooperative, constructive dialogue in accordance with DCRF charter policies.
                  </li>
                  <li className={styles.listItem}>
                    <strong>Account Integrity:</strong> Credentials provided to access admin dashboards or emergency scraping queues must not be shared or leaked under any circumstances.
                  </li>
                </ul>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <section id="data-use" className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>03</span> Intellectual Property & Data Usage Guidelines
              </h2>
              <div className={styles.textBlock}>
                <p>
                  All publications, research dossiers, policy reports, system codebases, media templates, and layout styling are owned by DCRF, its founders (TCUIF and DiCAF), or licensed partners.
                </p>
                <p>
                  Subject to your compliance with these terms, DCRF grants members a non-exclusive, non-transferable, revocable license to access policy briefs and utilize public data visualizers strictly for non-commercial corporate planning, municipal preparation, academic research, and CSR strategy development.
                </p>
                <div className={styles.alertBox}>
                  <div className={styles.alertTitle}>Prohibited Commercial Exploitation</div>
                  You may not scrape, compile, sell, license, or commercially redistribute DCRF policy data, hazard mapping indexes, or membership rosters without written, notarized authorization from the Secretariat.
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <section id="telemetry" className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>04</span> Early Warning Telemetry & Hazards Policy
              </h2>
              <div className={styles.textBlock}>
                <p>
                  The DCRF portal aggregates real-time weather warnings, heatwave thresholds, flood risk alerts, and historical municipal metrics. This telemetry is sourced from automated feeds, public scraper systems, and weather API integrations.
                </p>
                <p>
                  These alerts are compiled to support community alerts and public education and must never replace official emergency directives issued by the India Meteorological Department (IMD), National Disaster Management Authority (NDMA), or local State Disaster Management Authorities (SDMAs).
                </p>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <section id="liability" className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>05</span> Limitation of Liability & Indemnification
              </h2>
              <div className={styles.textBlock}>
                <p>
                  DCRF, TCUIF, DiCAF, and their respective officers, trustees, advisors, and volunteers make no representations or warranties, express or implied, regarding the accuracy, completeness, timeliness, or reliability of any telemetry data, news updates, or policy briefs.
                </p>
                <p>
                  All content is provided on an "as is" and "as available" basis. Under no circumstances shall DCRF be held liable for any loss, damage, or disruption arising from decision-making processes, infrastructure planning, or investment strategies executed in reliance on portal materials.
                </p>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <section id="governance" className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>06</span> Governing Law & Legal Secretariat
              </h2>
              <div className={styles.textBlock}>
                <p>
                  These Terms of Use, your access to DCRF portals, and any related legal disputes shall be governed by, and interpreted in accordance with, the laws of the Republic of India.
                </p>
                <p>
                  Any dispute, controversy, or claim arising out of this agreement shall be subject to the exclusive jurisdiction of the competent courts located in New Delhi, India.
                </p>
              </div>
            </section>
          </ScrollReveal>
        </main>
      </div>
    </div>
  );
}
