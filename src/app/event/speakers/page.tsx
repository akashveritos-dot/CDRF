import React from 'react';
import { query } from '@/lib/db';
import PageHero from '@/components/ui/PageHero/PageHero';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import DisasterEffects from '@/components/ui/DisasterEffects/DisasterEffects';
import { Linkedin, Twitter, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function SpeakersPage() {
  // Query all cards under the Speakers section of dcrc-26 conclave
  const speakers = await query<any[]>(
    `SELECT c.id, c.title, c.description, c.image_url as imageUrl, c.link_url as linkUrl, c.extra_data as extraData
     FROM cms_page_cards c
     JOIN cms_page_sections s ON c.section_id = s.id
     WHERE s.page_slug = 'dcrc-26' AND s.title = 'Speakers'
     ORDER BY c.display_order ASC`
  );

  const formattedSpeakers = speakers.map(sp => {
    let extra = {};
    if (sp.extraData && typeof sp.extraData === 'string') {
      try { extra = JSON.parse(sp.extraData); } catch {}
    } else if (sp.extraData && typeof sp.extraData === 'object') {
      extra = sp.extraData;
    }
    return { ...sp, extraData: extra };
  });

  return (
    <div className={styles.page}>
      <DisasterEffects theme="general" intensity="low" />

      {/* Back button */}
      <div className={styles.backContainer}>
        <Link href="/event/dcrc-26" className={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Back to Conclave</span>
        </Link>
      </div>

      <ScrollReveal direction="down">
        <PageHero
          theme="events"
          eyebrow="DCRC ’26 Conclave Panelists"
          line1="DISTINGUISHED"
          line2="SPEAKERS"
          subtitle="Meet the policy advisors, scientific researchers, corporate ESG leads, and disaster management executives steering the resilience dialogues."
        />
      </ScrollReveal>

      <div className={styles.speakersGrid}>
        {formattedSpeakers.map((sp, idx) => (
          <ScrollReveal direction="up" delay={idx * 0.05} key={sp.id || idx}>
            <div id={`speaker-${sp.id}`} className={styles.speakerCard}>
              <div className={styles.imageWrapper}>
                <img src={sp.imageUrl} alt={sp.title} className={styles.speakerPhoto} />
                {sp.linkUrl && (
                  <a
                    href={sp.linkUrl}
                    className={styles.profileBadge}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>View Profile</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <div className={styles.speakerInfo}>
                <h3 className={styles.speakerName}>{sp.title}</h3>
                <p className={styles.speakerDesc}>{sp.description}</p>
                <div className={styles.speakerSocials}>
                  {(sp.extraData?.linkedinUrl || sp.linkUrl) && (
                    <a
                      href={sp.extraData?.linkedinUrl || sp.linkUrl}
                      className={styles.socialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                    >
                      <Linkedin size={16} />
                    </a>
                  )}
                  {sp.extraData?.twitterUrl && (
                    <a
                      href={sp.extraData.twitterUrl}
                      className={styles.socialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Twitter / X"
                    >
                      <Twitter size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
