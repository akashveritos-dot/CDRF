'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Linkedin, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
    }
  };

  // Council pages custom layout (fully dynamic members filtering based on role)
  if (slug === 'governing-council' || slug === 'advisory-council') {
    const displayMembers = slug === 'advisory-council'
      ? councilMembers.filter(m => m.role.toLowerCase().includes('advisor'))
      : councilMembers.filter(m => !m.role.toLowerCase().includes('advisor'));
    
    return (
      <div className={styles.page}>
        {/* Page Header */}
        <ScrollReveal direction="down">
          <div className={styles.header}>
            <h1 className={styles.title}>{pageData.title}</h1>
            <p className={styles.subtitle}>{pageData.description}</p>
          </div>
        </ScrollReveal>

        {/* Intro Card Section */}
        {pageData.content && (
          <ScrollReveal direction="up" delay={0.1}>
            <div className={styles.introCard}>
              <div 
                className={styles.bodyText}
                dangerouslySetInnerHTML={{ __html: pageData.content }}
              />
            </div>
          </ScrollReveal>
        )}

        {/* Council Members Section */}
        {displayMembers.length > 0 && (
          <section className={styles.councilSection}>
            <ScrollReveal direction="up" delay={0.15}>
              <h2 className={styles.sectionTitle}>
                {slug === 'governing-council' ? 'Council Leadership' : 'Advisory Board Scholars'}
              </h2>
            </ScrollReveal>
            
            <motion.div 
              className={styles.premiumCouncilGrid}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {displayMembers.map((member) => {
                // Determine badge style
                let badgeClass = styles.badgeDefault;
                if (member.roleBadgeColor === 'gold') badgeClass = styles.badgeGold;
                else if (member.roleBadgeColor === 'finance') badgeClass = styles.badgeFinance;
                
                return (
                  <motion.div 
                    key={member.id} 
                    className={styles.premiumMemberCard}
                    variants={cardVariants}
                  >
                    <div className={styles.memberCardTop}>
                      {member.profileImage ? (
                        <div className={styles.memberCardImageWrap}>
                          <img
                            src={member.profileImage}
                            alt={member.name}
                            className={styles.memberCardImage}
                          />
                        </div>
                      ) : (
                        <div className={styles.memberCardAvatar}>
                          {member.avatarInitials}
                        </div>
                      )}

                      <div className={styles.memberCardMeta}>
                        <h3 className={styles.memberNameText}>{member.name}</h3>
                        <span className={`${styles.roleBadge} ${badgeClass}`}>
                          {member.role}
                        </span>
                      </div>
                    </div>

                    <div className={styles.memberCardDivider} />

                    <p className={styles.memberCardBio}>{member.bio}</p>

                    {member.organization && (
                      <div className={styles.memberCardOrg}>
                        <span>Organization:</span> {member.organization}
                      </div>
                    )}

                    {member.linkedinUrl && (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.premiumLinkedinLink}
                        aria-label={`${member.name} LinkedIn Profile`}
                      >
                        <Linkedin size={16} />
                        <span>Profile</span>
                      </a>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </section>
        )}
      </div>
    );
  }

  // Fallback layout (used for mission-vision, charter-10-point-agenda, working-group, etc.)
  return (
    <div className={styles.page}>
      {/* Page Header */}
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <h1 className={styles.title}>{pageData.title}</h1>
          <p className={styles.subtitle}>{pageData.description}</p>
        </div>
      </ScrollReveal>

      {/* Grid Layout for content + media */}
      <div className={styles.grid}>
        <ScrollReveal direction="right" delay={0.1}>
          <div 
            className={`${styles.bodyText} ${
              slug === 'working-group' ? styles.workingGroupContent : ''
            } ${
              slug === 'mission-vision' ? styles.missionVisionContent : ''
            } ${
              slug === 'charter-10-point-agenda' ? styles.charterContent : ''
            }`}
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
    </div>
  );
}
