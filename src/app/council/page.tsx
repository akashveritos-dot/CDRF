'use client';

import React from 'react';
import styles from './page.module.css';
import { councilMembers } from '@/data/dataStore';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { Linkedin } from 'lucide-react';

export default function CouncilPage() {
  const getBadgeClass = (color?: string) => {
    switch (color) {
      case 'gold': return styles.badgeGold;
      case 'finance': return styles.badgeFinance;
      default: return '';
    }
  };

  return (
    <div className={styles.page}>
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <h1 className={styles.title}>Governing & Executive Council</h1>
          <p className={styles.subtitle}>
            DCRF is steered by a joint council combining academic research, corporate sustainability pipelines, and technical disaster risk analytics.
          </p>
        </div>
      </ScrollReveal>

      {/* Leadership Profile Cards Grid */}
      <div className={styles.grid}>
        {councilMembers.map((member, idx) => {
          const isHighlight = member.id === 'bm'; // Highlight convener card
          return (
            <ScrollReveal
              key={member.id}
              direction="up"
              delay={0.05 * idx}
            >
              <div className={`${styles.card} ${isHighlight ? styles.highlightCard : ''}`}>
                <div className={styles.profileHeader}>
                  <div className={`${styles.avatar} ${isHighlight ? styles.avatarGold : ''}`}>
                    {member.avatarInitials}
                  </div>
                  <div className={styles.identity}>
                    <h3>{member.name}</h3>
                    <span className={`${styles.badge} ${getBadgeClass(member.roleBadgeColor)}`}>
                      {member.role}
                    </span>
                  </div>
                </div>

                <p className={styles.bio}>{member.bio}</p>

                {member.linkedinUrl ? (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkedin}
                  >
                    <Linkedin size={12} fill="currentColor" stroke="none" />
                    LinkedIn Profile
                  </a>
                ) : (
                  <span className={styles.orgMuted}>{member.organization}</span>
                )}
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Advisory & Technical Board details */}
      <section className={styles.advisorySec}>
        <ScrollReveal direction="up">
          <h2>Advisory Council & Working Groups</h2>
          <div className={styles.advisoryBox}>
            <p>
              In addition to the Governing Council, DCRF invites technical advisors and coordinators from partner organizations
              including TERI, CEEW, WRI, and IITs to steer specific research working groups. Our core focus areas cover
              <strong> Early Warning Systems</strong>, <strong>Himalayan Climate Melt</strong>, <strong>Urban Heat Action Plans</strong>,
              and <strong>CSR Adaptation Finance Frameworks</strong>.
            </p>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
