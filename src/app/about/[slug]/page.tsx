'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Linkedin, AlertTriangle } from 'lucide-react';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';

interface PageData {
  slug: string;
  title: string;
  category: string;
  description: string;
  videoUrl?: string;
  imageUrl?: string;
  content: string;
}

interface CouncilMember {
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

// Fallback high-quality placeholder images based on page context/slug
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

export default function AboutSubpage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const slug = params.slug;
  
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPage() {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/pages/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('This page does not exist or has not been published yet.');
          }
          throw new Error('Failed to load page content.');
        }
        const data = await res.json();
        setPageData(data);

        if (slug === 'governing-council' || slug === 'advisory-council') {
          const councilRes = await fetch('/api/councils');
          if (councilRes.ok) {
            const councilData = await councilRes.json();
            setCouncilMembers(councilData);
          }
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred.');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadPage();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 size={36} className={styles.spinner} />
        <span>Loading Secretariat Intelligence...</span>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className={styles.errorState}>
        <AlertTriangle size={48} className={styles.spinner} />
        <h2 className={styles.errorTitle}>Intelligence Cache Offline</h2>
        <p>{error || 'Page data missing.'}</p>
      </div>
    );
  }

  // Resolve dummy image fallback if no image/video is present
  const displayImage = pageData.imageUrl || (!pageData.videoUrl ? getFallbackImage(slug) : undefined);

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <h1 className={styles.title}>{pageData.title}</h1>
          <p style={{ color: 'var(--wine-red-primary)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>DCRF Operational Node</p>
          <p className={styles.subtitle}>{pageData.description}</p>
        </div>
      </ScrollReveal>

      {/* Grid Layout for content + media */}
      <div className={styles.grid}>
        <ScrollReveal direction="right" delay={0.1}>
          <div 
            className={styles.bodyText}
            dangerouslySetInnerHTML={{ __html: pageData.content }}
          />
        </ScrollReveal>

        {/* Media Block on Right */}
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
                  <img
                    src={displayImage}
                    alt={pageData.title}
                    className={styles.image}
                  />
                </div>
              )}
            </div>
          </ScrollReveal>
        )}
      </div>

      {/* Dynamic Section: The Paradigm Shift for Mission & Vision */}
      {slug === 'mission-vision' && (
        <ScrollReveal direction="up" delay={0.25}>
          <section className={styles.comparisonSection}>
            <h2 className={styles.comparisonTitle}>The Resilient Shift</h2>
            <div className={styles.comparisonGrid}>
              
              {/* Old Paradigm Column */}
              <div className={styles.comparisonColumn}>
                <h3 className={`${styles.comparisonColumnHeader} ${styles.oldHeader}`}>
                  Traditional Relief (Reactive)
                </h3>
                <div className={styles.comparisonItem}>
                  <span className={styles.comparisonItemTitle}>Post-Event Funding</span>
                  <span className={styles.comparisonItemDesc}>
                    Capital flows primarily after devastation has occurred, acting as emergency charity checkouts.
                  </span>
                </div>
                <div className={styles.comparisonItem}>
                  <span className={styles.comparisonItemTitle}>Uncoordinated Action</span>
                  <span className={styles.comparisonItemDesc}>
                    Disjointed relief efforts by isolated agencies leading to delays and duplication of resources.
                  </span>
                </div>
                <div className={styles.comparisonItem}>
                  <span className={styles.comparisonItemTitle}>Ad-Hoc Preparedness</span>
                  <span className={styles.comparisonItemDesc}>
                    Lack of active warning sensor arrays and parameters, keeping communities vulnerable.
                  </span>
                </div>
              </div>

              {/* New Paradigm Column */}
              <div className={styles.comparisonColumn}>
                <h3 className={`${styles.comparisonColumnHeader} ${styles.newHeader}`}>
                  DCRF Resilience (Proactive)
                </h3>
                <div className={styles.comparisonItem}>
                  <span className={styles.comparisonItemTitle}>Pre-Event Capital Routing</span>
                  <span className={styles.comparisonItemDesc}>
                    Strategic ESG/CSR funds directed permanently into structural safeguards and telemetry setups.
                  </span>
                </div>
                <div className={styles.comparisonItem}>
                  <span className={styles.comparisonItemTitle}>Multi-Stakeholder Convergence</span>
                  <span className={styles.comparisonItemDesc}>
                    Unifying corporates, researchers, NGOs, and municipal authorities under one command node.
                  </span>
                </div>
                <div className={styles.comparisonItem}>
                  <span className={styles.comparisonItemTitle}>Telemetry Early Warnings</span>
                  <span className={styles.comparisonItemDesc}>
                    Real-time landslide, GLOF, heatwave, and river flooding sensors keeping communities safe.
                  </span>
                </div>
              </div>

            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Council Members List (Plain on White Paper design) */}
      {(slug === 'governing-council' || slug === 'advisory-council') && councilMembers.length > 0 && (
        <section className={styles.councilSection}>
          <ScrollReveal direction="up">
            <h2 className={styles.sectionTitle}>
              {slug === 'governing-council' ? 'Council Leadership' : 'Advisory Experts'}
            </h2>
          </ScrollReveal>
          
          <div className={styles.councilGrid}>
            {councilMembers.map((member, idx) => (
              <ScrollReveal 
                key={member.id} 
                direction="up" 
                delay={0.05 * idx}
              >
                <div className={styles.memberCard}>
                  {member.profileImage ? (
                    <img
                      src={member.profileImage}
                      alt={member.name}
                      className={styles.memberImage}
                    />
                  ) : (
                    <div className={styles.avatar}>
                      {member.avatarInitials}
                    </div>
                  )}

                  <h3 className={styles.memberName}>{member.name}</h3>
                  <div className={styles.memberRole}>{member.role}</div>
                  {member.organization && (
                    <div className={styles.memberOrg}>{member.organization}</div>
                  )}
                  <p className={styles.memberBio}>{member.bio}</p>

                  {member.linkedinUrl && (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkedinLink}
                      aria-label={`${member.name} LinkedIn Profile`}
                    >
                      <Linkedin size={18} />
                    </a>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
