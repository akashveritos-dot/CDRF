'use client';
import React, { useState } from 'react';
import { Linkedin } from 'lucide-react';
import styles from './FlipCards.module.css';

export interface FlipCardMember {
  id: string | number;
  name: string;
  role: string;
  roleBadgeColor?: string;
  avatarInitials?: string;
  profileImage?: string;
  bio?: string;
  linkedinUrl?: string;
  organization?: string;
}

interface FlipCardsProps {
  members: FlipCardMember[];
}

export default function FlipCards({ members }: FlipCardsProps) {
  const [flipped, setFlipped] = useState<Set<string | number>>(new Set());

  const toggle = (id: string | number) => {
    setFlipped(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const badgeColor = (color?: string) => {
    if (color === 'gold') return styles.badgeGold;
    if (color === 'finance') return styles.badgeTeal;
    return styles.badgeDefault;
  };

  return (
    <div className={styles.grid}>
      {members.map((m, idx) => (
        <div
          key={m.id}
          className={`${styles.cardWrap} ${flipped.has(m.id) ? styles.isFlipped : ''}`}
          onClick={() => toggle(m.id)}
          style={{ animationDelay: `${idx * 0.07}s` }}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && toggle(m.id)}
          aria-label={`${m.name} — click to flip`}
        >
          <div className={styles.card}>
            {/* ── Front ── */}
            <div className={styles.front}>
              <div className={styles.imgWrap}>
                {m.profileImage ? (
                  <img src={m.profileImage} alt={m.name} className={styles.img} />
                ) : (
                  <div className={styles.initials}>{m.avatarInitials || m.name[0]}</div>
                )}
                <div className={styles.shimmer} />
              </div>
              <div className={styles.nameRow}>
                <h3 className={styles.name}>{m.name}</h3>
                <span className={`${styles.badge} ${badgeColor(m.roleBadgeColor)}`}>{m.role}</span>
              </div>
              {m.organization && <p className={styles.org}>{m.organization}</p>}
              <div className={styles.flipHint}>Tap to know more →</div>
            </div>

            {/* ── Back ── */}
            <div className={styles.back}>
              <div className={styles.backTop}>
                <div className={styles.backAvatar}>
                  {m.profileImage ? (
                    <img src={m.profileImage} alt={m.name} className={styles.backAvatarImg} />
                  ) : (
                    m.avatarInitials || m.name[0]
                  )}
                </div>
                <div>
                  <p className={styles.backName}>{m.name}</p>
                  <span className={`${styles.badge} ${badgeColor(m.roleBadgeColor)}`}>{m.role}</span>
                </div>
              </div>
              <p className={styles.bio}>{m.bio || 'No bio available.'}</p>
              {m.linkedinUrl && (
                <a
                  href={m.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkedinBtn}
                  onClick={e => e.stopPropagation()}
                >
                  <Linkedin size={13} fill="currentColor" stroke="none" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
