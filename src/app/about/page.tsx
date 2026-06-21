'use client';

import React from 'react';
import styles from './page.module.css';
import { partners } from '@/data/dataStore';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import PageHero from '@/components/ui/PageHero/PageHero';

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <ScrollReveal direction="down">
        <PageHero
          theme="about"
          eyebrow="Est. June 4, 2026 · New Delhi"
          line1="ABOUT"
          line2="FEDERATION"
          subtitle="A joint multi-stakeholder alliance driving convergence across climate science, media coordinates, and corporate social investments."
        />
      </ScrollReveal>

      {/* Core Narrative & Partners Split */}
      <div className={styles.grid}>
        <ScrollReveal direction="right" delay={0.1}>
          <div className={styles.bodyText}>
            <p>
              The <strong>Disaster & Climate Resilience Federation (DCRF)</strong> was established on <strong>4 June 2026</strong> as a landmark
              joint venture unifying the research and corporate outreach of TCU Impact Foundation with the technical expertise of the Disaster & Climate Action Federation (DiCAF).
            </p>
            <p>
              India faces climate-induced disasters of increasing severity and frequency. Floods, heatwaves, cyclones and land subsidence collectively cost the national economy over ₹3 Lakh Crore annually, alongside displacing millions. DCRF acts as an institutional bridge coordinating corporate CSR funds, scientific research databases, and municipal guidelines.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="left" delay={0.2}>
          <div className={styles.partnersGrid}>
            {partners.map((partner) => (
              <div
                key={partner.id}
                className={styles.pcard}
                style={{ borderLeft: `4px solid ${partner.borderColor}` }}
              >
                <h4>{partner.name}</h4>
                <p>{partner.description}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* Mission & Vision Statements */}
      <div className={styles.missionSec}>
        <ScrollReveal direction="up" delay={0.1}>
          <div className={styles.missionCard}>
            <h3>Our Mission</h3>
            <p>
              To unify corporates, NGOs, academic networks, and government advisors into a single proactive resilience ecosystem. Moving funding structures from post-disaster response into pre-event localized preparedness.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.2}>
          <div className={styles.missionCard}>
            <h3>Our Vision</h3>
            <p>
              A climate-resilient India where localized early warnings, Heat Action Protocols, and flood infrastructure safeguard vulnerable communities, fueled by structured corporate CSR convergence.
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Vertical Timeline */}
      <section className={styles.timelineSec}>
        <ScrollReveal direction="up">
          <h2>Federation Milestones</h2>
        </ScrollReveal>

        <div className={styles.timeline}>
          {/* Milestone 1 */}
          <ScrollReveal direction="left" delay={0.1} className={styles.timelineNode}>
            <div className={styles.timelineDot} />
            <div className={styles.timelineDate}>June 4, 2026</div>
            <div className={styles.timelineContent}>
              <h4>Federation Establishment</h4>
              <p>
                DCRF was formally established in New Delhi as a joint alliance of TCUIF and DiCAF to bridge the gaps in corporate engagement and disaster intelligence.
              </p>
            </div>
          </ScrollReveal>

          {/* Milestone 2 */}
          <ScrollReveal direction="left" delay={0.2} className={styles.timelineNode}>
            <div className={styles.timelineDot} />
            <div className={styles.timelineDate}>July 2026</div>
            <div className={styles.timelineContent}>
              <h4>Resilience Working Groups Convened</h4>
              <p>
                Launching four national committees steering Early Warning systems, GLOF monitoring models, Heat action guidelines, and ESG investments tracking.
              </p>
            </div>
          </ScrollReveal>

          {/* Milestone 3 */}
          <ScrollReveal direction="left" delay={0.3} className={styles.timelineNode}>
            <div className={styles.timelineDot} />
            <div className={styles.timelineDate}>November 26–27, 2026</div>
            <div className={styles.timelineContent}>
              <h4>DCRC ’26 Conclave Summit</h4>
              <p>
                Coordinating the flagship Conclave and launches of the Annual Disaster & Climate Action Index Report alongside technical exhibition zones.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
