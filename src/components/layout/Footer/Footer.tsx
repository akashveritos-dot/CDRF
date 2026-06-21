'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribedMessage, setSubscribedMessage] = useState('✓ Thank you for subscribing!');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      try {
        const response = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.alreadyExists) {
            setSubscribedMessage('You are already subscribed!');
          } else {
            setSubscribedMessage('✓ Thank you for subscribing!');
          }
          setSubscribed(true);
          setEmail('');
          setTimeout(() => setSubscribed(false), 5000);
        }
      } catch (error) {
        console.error('Failed to subscribe:', error);
      }
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brandCol}>
          <div className={styles.footerLogoWrapper}>
            <img 
              src="/dcrf_icon-Photoroom.png" 
              alt="DCRF Icon" 
              className={styles.footerLogo}
              width="48"
              height="48"
            />
            <h3>Disaster & Climate Resilience Federation</h3>
          </div>
          <p>
            A joint initiative of TCU Impact Foundation (TCUIF) and DiCAF. Building resilience
            through knowledge, convergence and action. Secretariat: New Delhi, India. Est. 4 June 2026.
          </p>
          <div className={styles.newsletter}>
            <h4>Subscribe to Policy Briefs</h4>
            {subscribed ? (
              <p style={{ color: 'var(--red-light)', fontSize: '13px', fontWeight: 600 }}>
                {subscribedMessage}
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className={styles.formGroup}>
                <input
                  type="email"
                  placeholder="Enter email address"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className={styles.btn}>
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div className={styles.col}>
          <h5>Federation</h5>
          <div className={styles.linksList}>
            <Link href="/about">About DCRF</Link>
            <Link href="/about#framework">Our Pillars</Link>
            <Link href="/council">Governing Council</Link>
            <Link href="/membership">Membership Tiers</Link>
          </div>
        </div>

        <div className={styles.col}>
          <h5>Knowledge</h5>
          <div className={styles.linksList}>
            <Link href="/news">News & Stories</Link>
            <Link href="/reports">Reports & Briefs</Link>
            <Link href="/podcasts">Podcasts</Link>
            <Link href="/#insights">Data Insights</Link>
          </div>
        </div>

        <div className={styles.col}>
          <h5>Partners & Links</h5>
          <div className={styles.linksList}>
            <Link href="/event">DCRC ’26 Conclave</Link>
            <a href="https://thecsruniverse.com" target="_blank" rel="noopener noreferrer">
              TheCSRUniverse ↗
            </a>
            <a href="https://dicaf.org" target="_blank" rel="noopener noreferrer">
              DiCAF ThinkTank ↗
            </a>
            <a href="https://disastersnews.com" target="_blank" rel="noopener noreferrer">
              disastersnews.com ↗
            </a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.metaRow}>
          <p className={styles.copyright}>© {new Date().getFullYear()} Disaster & Climate Resilience Federation (DCRF). All rights reserved.</p>
          <p className={styles.jointVenture}>
            TCUIF & DiCAF joint venture • Under Indian Law • Secretariat: New Delhi, India
          </p>
        </div>
        <div className={styles.legalLinks}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Use</Link>
          <Link href="/contact">Contact Support</Link>
        </div>
      </div>
    </footer>
  );
}
