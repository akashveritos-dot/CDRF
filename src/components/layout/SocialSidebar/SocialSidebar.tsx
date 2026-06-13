'use client';

import React from 'react';
import { Linkedin, Facebook, Youtube } from 'lucide-react';
import styles from './SocialSidebar.module.css';

const SocialSidebar = () => {
  const socialLinks = [
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/disaster-and-climate-resilience-federation/',
      icon: <Linkedin className={styles.brandSvg} strokeWidth={1.5} />,
      color: '#0A66C2',
      hoverColor: '#004182',
      glow: 'rgba(10, 102, 194, 0.5)'
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/thecsruniverse.official/',
      icon: <Facebook className={styles.brandSvg} strokeWidth={1.5} />,
      color: '#1877F2',
      hoverColor: '#0C63D4',
      glow: 'rgba(24, 119, 242, 0.5)'
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@thecsruniverse',
      icon: <Youtube className={styles.brandSvg} strokeWidth={1.5} />,
      color: '#FF0000',
      hoverColor: '#CC0000',
      glow: 'rgba(255, 0, 0, 0.5)'
    }
  ];

  return (
    <div className={styles.socialSidebar}>
      <div className={styles.socialContainer}>
        {socialLinks.map((social) => (
          <div key={social.name} className={styles.socialItem}>
            <a
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              style={
                {
                  '--social-color': social.color,
                  '--social-hover-color': social.hoverColor,
                  '--social-glow': social.glow
                } as React.CSSProperties
              }
              aria-label={`Visit our ${social.name} page`}
            >
              <div className={styles.iconWrapper}>
                {social.icon}
              </div>
            </a>
            <span className={styles.socialLabel}>{social.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialSidebar;
