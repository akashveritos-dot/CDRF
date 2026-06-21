'use client';

import React from 'react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import PageHero from '@/components/ui/PageHero/PageHero';
import FlipCards from '@/components/ui/FlipCards/FlipCards';
import NumberedAccordion from '@/components/ui/NumberedAccordion/NumberedAccordion';
import AnimatedStats from '@/components/ui/AnimatedStats/AnimatedStats';
import KanbanColumns from '@/components/ui/KanbanColumns/KanbanColumns';
import { Shield, Zap, Users, MapPin, BookOpen, AlertTriangle } from 'lucide-react';

export interface PageData {
  slug: string;
  title: string;
  category: string;
  description: string;
  videoUrl?: string;
  imageUrl?: string;
  content: string;
}

export interface CouncilMember {
  id: string;
  name: string;
  role: string;
  roleBadgeColor: string;
  avatarInitials: string;
  profileImage?: string;
  bio: string;
  linkedinUrl?: string;
  organization?: string;
  displayOrder: number;
}

interface AboutPageClientProps {
  slug: string;
  pageData: PageData;
  councilMembers: CouncilMember[];
}

const getFallbackImage = (slug: string) => {
  switch (slug) {
    case 'mission-vision':
      return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80';
    case 'charter-10-point-agenda':
      return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
    case 'governing-council':
      return 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80';
    case 'advisory-council':
      return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80';
    case 'working-group':
      return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80';
    default:
      return 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=800&q=80';
  }
};

// ── MISSION & VISION stats ────────────────────────────────────────────
const missionStats = [
  { value: 3, suffix: 'L+', prefix: '₹', label: 'Annual Climate Cost', description: 'Crore loss to India annually', color: '#b91c1c' },
  { value: 500, suffix: '+', label: 'Delegates Engaged', description: 'From 12+ sectors nationwide', color: '#7c3aed' },
  { value: 4, label: 'Working Groups', description: 'Technical national committees', color: '#0f766e' },
  { value: 26, label: 'States Covered', description: 'DCRF active advisory network', color: '#b45309' },
];

// ── CHARTER items — parse from HTML or fallback to static ─────────────
const charterItems = [
  { number: 1, title: 'Institutional Convergence Framework', body: 'Establish a unified governance model bridging corporate CSR, scientific bodies and government agencies for disaster risk reduction.' },
  { number: 2, title: 'Early Warning Infrastructure Deployment', body: 'Mobilize industry partners to co-fund community-level early warning sensor arrays in 100 high-risk districts.' },
  { number: 3, title: 'Climate Finance & ESG Redirection', body: 'Create mechanisms to redirect ESG capital from post-disaster relief toward preventive localized resilience measures.' },
  { number: 4, title: 'Heat Action Plan Standardization', body: 'Develop a national-level Heat Action Protocol adaptable for cities exceeding 1 million population.' },
  { number: 5, title: 'GLOF & Himalayan Monitoring', body: 'Partner with ISRO and IITs to establish satellite-linked Glacial Lake Outburst Flood monitoring networks.' },
  { number: 6, title: 'Annual Disaster & Climate Index', body: 'Publish a yearly evidence-based index ranking districts by multi-hazard exposure, preparedness, and CSR investment ratios.' },
  { number: 7, title: 'Coastal & Delta Resilience', body: 'Coordinate with coastal state governments to document traditional shelter architectures and integrate modern early warning systems.' },
  { number: 8, title: 'Academic Research Integration', body: 'Create formal research pipelines between TERI, CEEW, WRI, and IIT systems for applied disaster science peer-reviewed outputs.' },
  { number: 9, title: 'NGO-Corporate Matchmaking', body: 'Launch a structured platform matching corporate CSR leads with local NGOs and community bodies for co-deployed resilience projects.' },
  { number: 10, title: 'DCRC Annual Conclave', body: 'Convene an annual multi-stakeholder summit for policy launches, disaster-tech startups, and DCRF Recognition Awards.' },
];

// ── WORKING GROUP kanban columns ─────────────────────────────────────
const workingColumns = [
  {
    heading: 'Early Warning Systems',
    accent: '#b91c1c',
    cards: [
      { title: 'IoT Sensor Networks', description: 'Deploy ground-level sensors in 100 high-risk districts for flood/cyclone alerts', tag: 'Active', tagColor: '#b91c1c' },
      { title: 'Community Alert SMS', description: 'Last-mile warning dissemination to rural populations in local languages', tag: 'Pilot', tagColor: '#b91c1c' },
    ],
  },
  {
    heading: 'Himalayan Climate',
    accent: '#0f766e',
    cards: [
      { title: 'GLOF Mapping', description: 'ISRO satellite imagery analysis for glacial lake outburst flood risk zones', tag: 'Research', tagColor: '#0f766e' },
      { title: 'Snowpack Monitoring', description: 'Winter snowpack data integration with downstream water management systems', tag: 'Ongoing', tagColor: '#0f766e' },
    ],
  },
  {
    heading: 'Urban Heat Action',
    accent: '#b45309',
    cards: [
      { title: 'Heat Protocol Draft', description: 'Municipal framework for cities 1M+ covering cool-roof mandates and cooling centers', tag: 'Review', tagColor: '#b45309' },
      { title: 'Cool-Roof CSR Drive', description: 'Matching corporate funding with urban slum cool-roof installation programmes', tag: 'Active', tagColor: '#b45309' },
    ],
  },
  {
    heading: 'ESG Finance',
    accent: '#7c3aed',
    cards: [
      { title: 'CSR Redirection Fund', description: 'Pre-disaster resilience investment fund structure for DRR-focused ESG mandates', tag: 'Proposed', tagColor: '#7c3aed' },
      { title: 'Impact Reporting', description: 'Standardized disaster-risk ESG reporting templates aligned with SEBI ESG disclosures', tag: 'Draft', tagColor: '#7c3aed' },
    ],
  },
];

export default function AboutPageClient({ slug, pageData, councilMembers }: AboutPageClientProps) {
  const displayImage = pageData.imageUrl || (!pageData.videoUrl ? getFallbackImage(slug) : undefined);

  // ── GOVERNING / ADVISORY COUNCIL ────────────────────────────────
  if (slug === 'governing-council' || slug === 'advisory-council') {
    const displayMembers = slug === 'advisory-council'
      ? councilMembers.filter(m => m.role.toLowerCase().includes('advisor'))
      : councilMembers.filter(m => !m.role.toLowerCase().includes('advisor'));

    return (
      <div className={styles.page}>
        <ScrollReveal direction="down">
          <PageHero
            theme={slug === 'advisory-council' ? 'advisory' : 'council'}
            eyebrow={slug === 'advisory-council' ? 'Expert Advisors · DCRF' : 'DCRF Leadership'}
            line1={slug === 'advisory-council' ? 'ADVISORY' : 'GOVERNING'}
            line2="COUNCIL"
            subtitle={pageData.description}
          />
        </ScrollReveal>

        {pageData.content && (
          <ScrollReveal direction="up" delay={0.1}>
            <div className={styles.introCard}>
              <div className={styles.bodyText} dangerouslySetInnerHTML={{ __html: pageData.content }} />
            </div>
          </ScrollReveal>
        )}

        {displayMembers.length > 0 && (
          <section className={styles.councilSection}>
            <ScrollReveal direction="up" delay={0.15}>
              <h2 className={styles.sectionTitle}>
                {slug === 'governing-council' ? 'Council Leadership' : 'Advisory Board Scholars'}
              </h2>
              <p className={styles.sectionHint}>Tap any card to learn more</p>
            </ScrollReveal>
            {/* ★ 3D Flip Cards ★ */}
            <FlipCards members={displayMembers} />
          </section>
        )}
      </div>
    );
  }

  // ── MISSION & VISION ───────────────────────────────────────────
  if (slug === 'mission-vision') {
    return (
      <div className={styles.page}>
        <ScrollReveal direction="down">
          <PageHero
            theme="mission"
            eyebrow="Our Purpose · DCRF"
            line1="MISSION"
            line2="& VISION"
            subtitle={pageData.description}
          />
        </ScrollReveal>

        {/* Animated stat counters */}
        <ScrollReveal direction="up" delay={0.1}>
          <AnimatedStats stats={missionStats} />
        </ScrollReveal>

        {/* Content + image */}
        <div className={styles.grid}>
          <ScrollReveal direction="right" delay={0.15}>
            <div className={styles.bodyText} dangerouslySetInnerHTML={{ __html: pageData.content }} />
          </ScrollReveal>
          {displayImage && (
            <ScrollReveal direction="left" delay={0.2}>
              <div className={styles.imageWrapper}>
                <img src={displayImage} alt={pageData.title} className={styles.image} />
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    );
  }

  // ── CHARTER — 10 POINT AGENDA ──────────────────────────────────
  if (slug === 'charter-10-point-agenda') {
    return (
      <div className={styles.page}>
        <ScrollReveal direction="down">
          <PageHero
            theme="charter"
            eyebrow="Governance Framework · DCRF"
            line1="CHARTER"
            line2="10-POINT"
            subtitle={pageData.description}
          />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.1}>
          {/* ★ Numbered accordion ★ */}
          <NumberedAccordion items={charterItems} />
        </ScrollReveal>
      </div>
    );
  }

  // ── WORKING GROUP ──────────────────────────────────────────────
  if (slug === 'working-group') {
    return (
      <div className={styles.page}>
        <ScrollReveal direction="down">
          <PageHero
            theme="working"
            eyebrow="Technical Committees · DCRF"
            line1="WORKING"
            line2="GROUP"
            subtitle={pageData.description}
          />
        </ScrollReveal>

        {pageData.content && (
          <ScrollReveal direction="up" delay={0.1}>
            <div className={styles.introCard}>
              <div className={styles.bodyText} dangerouslySetInnerHTML={{ __html: pageData.content }} />
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal direction="up" delay={0.15}>
          <h2 className={styles.sectionTitle}>Active Working Committees</h2>
        </ScrollReveal>

        {/* ★ Kanban columns ★ */}
        <KanbanColumns columns={workingColumns} />
      </div>
    );
  }

  // ── GENERIC FALLBACK ──────────────────────────────────────────
  return (
    <div className={styles.page}>
      <ScrollReveal direction="down">
        <PageHero
          theme="about"
          eyebrow="DCRF"
          line1={pageData.title.split(' ')[0].toUpperCase()}
          line2={pageData.title.split(' ').slice(1).join(' ').toUpperCase()}
          subtitle={pageData.description}
        />
      </ScrollReveal>

      <div className={styles.grid}>
        <ScrollReveal direction="right" delay={0.1}>
          <div className={styles.bodyText} dangerouslySetInnerHTML={{ __html: pageData.content }} />
        </ScrollReveal>
        {(displayImage || pageData.videoUrl) && (
          <ScrollReveal direction="left" delay={0.2}>
            <div className={styles.mediaSection}>
              {pageData.videoUrl && (
                <div className={styles.videoWrapper}>
                  <iframe
                    src={pageData.videoUrl}
                    title={`${pageData.title} Video Presentation`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              {displayImage && !pageData.videoUrl && (
                <div className={styles.imageWrapper}>
                  <img src={displayImage} alt={pageData.title} className={styles.image} />
                </div>
              )}
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
