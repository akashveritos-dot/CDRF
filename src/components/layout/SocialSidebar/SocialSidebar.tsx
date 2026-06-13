'use client';

import React from 'react';
import { Linkedin, Facebook, Youtube } from 'lucide-react';
import styles from './SocialSidebar.module.css';

const SocialSidebar = () => {
  const socialLinks = [
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/thecsruniverse/',
      icon: <Linkedin size={24} />,
      color: '#0A66C2',
      hoverColor: '#004182'
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/thecsruniverse.official/',
      icon: <Facebook size={24} />,
      color: '#1877F2',
      hoverColor: '#0C63D4'
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@thecsruniverse',
      icon: <Youtube size={24} />,
      color: '#FF0000',
      hoverColor: '#CC0000'
    }
  ];

  return (
    <div className={styles.socialSidebar}>
      <div className={styles.socialContainer}>
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            style={
              {
                '--social-color': social.color,
                '--social-hover-color': social.hoverColor
              } as React.CSSProperties
            }
            aria-label={`Visit our ${social.name} page`}
          >
            <div className={styles.iconWrapper}>
              {social.icon}
            </div>
            <span className={styles.socialLabel}>{social.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialSidebar;
