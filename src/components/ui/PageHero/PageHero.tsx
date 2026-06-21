'use client';

import React from 'react';
import styles from './PageHero.module.css';

export type HeroTheme =
  | 'gallery'       // OUR / GALLERY — dark outline style
  | 'about'         // ABOUT / FEDERATION — split color
  | 'news'          // LATEST / NEWS — skewed accent
  | 'council'       // GOVERNING / COUNCIL — vertical rule
  | 'advisory'      // ADVISORY / COUNCIL — gradient text
  | 'working'       // WORKING / GROUP — ticker style
  | 'mission'       // MISSION / & VISION — reveal
  | 'charter'       // CHARTER / 10-POINT — numbered
  | 'events'        // EVENTS / & MORE — bold slash
  | 'reports'       // REPORTS / & DATA — data feel
  | 'contact'       // GET IN / TOUCH — light pulse
  | 'gallery';

interface PageHeroProps {
  theme: HeroTheme;
  eyebrow?: string;
  line1: string;
  line2: string;
  subtitle?: string;
  align?: 'center' | 'left';
}

export default function PageHero({
  theme,
  eyebrow,
  line1,
  line2,
  subtitle,
  align = 'center',
}: PageHeroProps) {
  return (
    <div className={`${styles.hero} ${styles[theme]} ${align === 'left' ? styles.left : ''}`}>
      {eyebrow && (
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          {eyebrow}
        </div>
      )}

      <h1 className={styles.title} aria-label={`${line1} ${line2}`}>
        <span className={styles.line1}>{line1}</span>
        <span className={styles.line2}>{line2}</span>
      </h1>

      {subtitle && (
        <p className={styles.subtitle}>{subtitle}</p>
      )}

      <div className={styles.accentBar} />
    </div>
  );
}
