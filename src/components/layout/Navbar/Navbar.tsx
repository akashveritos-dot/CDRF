'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

const menuLinks = [
  { name: 'Home', path: '/' },
  { name: 'Insights & Map', path: '/#insights' }, // Maps directly to home dashboard anchor, or /insights if desired
  { name: 'News', path: '/news' },
  { name: 'Reports', path: '/reports' },
  { name: 'Podcasts', path: '/podcasts' },
  { name: 'Membership', path: '/membership' },
  { name: 'Council', path: '/council' },
  { name: 'DCRC ’26', path: '/event' },
  { name: 'About', path: '/about' }
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const [hash, setHash] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 1. Add background blur / shadow when scrolled past 40px
      if (currentScrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // 2. Hide / show navbar based on scroll direction
      // Don't hide navbar on mobile when menu is open
      if (currentScrollY > 120) {
        if (currentScrollY > lastScrollYRef.current && !isOpen) {
          setVisible(false); // Scrolling down, hide it
        } else {
          setVisible(true);  // Scrolling up, show it
        }
      } else {
        setVisible(true);    // Always show at the top
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  // Close menu when scrolling on mobile
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollWhileMenuOpen = () => {
      setIsOpen(false);
    };

    window.addEventListener('scroll', handleScrollWhileMenuOpen, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollWhileMenuOpen);
  }, [isOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    setHash(window.location.hash);

    const handleHashChange = () => {
      setHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [pathname]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Helper to determine if link is active
  const isLinkActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' && !hash;
    }
    // If it's a home page anchor like /#insights
    if (path.startsWith('/#')) {
      return pathname === '/' && hash === path.substring(1);
    }
    return pathname.startsWith(path);
  };

  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [subName, setSubName] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleModalSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError('');
    setSubLoading(true);

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: subEmail, name: subName })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.alreadyExists) {
          setSubError(data.message);
        } else {
          setSuccessMsg('You have successfully subscribed to the DCRF Policy Briefs and newsletter updates.');
          setIsSubmitted(true);
          setSubName('');
          setSubEmail('');
        }
      } else {
        const errData = await response.json();
        setSubError(errData.error || 'Failed to subscribe');
      }
    } catch (err) {
      setSubError('An unexpected error occurred. Please try again.');
    } finally {
      setSubLoading(false);
    }
  };

  const closeSubscribeModal = () => {
    setIsSubscribeOpen(false);
    setIsSubmitted(false);
    setSubError('');
    setSuccessMsg('');
  };

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''} ${!visible ? styles.hidden : ''}`}>
        <Link href="/" className={styles.brand} onClick={closeMenu}>
          <div className={styles.logoBox}>DCRF</div>
          <span className={styles.name}>
            DCRF
            <span className={styles.nameSpan}>Disaster & Climate Resilience</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className={styles.navLinks}>
          {menuLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={isLinkActive(link.path) ? styles.activeLink : ''}
            >
              {link.name}
            </Link>
          ))}
          <button onClick={() => setIsSubscribeOpen(true)} className={styles.subscribeBtn}>
            Subscribe
          </button>
          <Link href="/membership#join" className={styles.cta}>
            Join DCRF
          </Link>
        </div>

        {/* Hamburger Trigger */}
        <button className={styles.hamburger} onClick={toggleMenu} aria-label="Toggle navigation menu">
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {/* Mobile Side Drawer */}
        <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
          {menuLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              onClick={closeMenu}
              className={isLinkActive(link.path) ? styles.activeLink : ''}
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={() => {
              setIsSubscribeOpen(true);
              closeMenu();
            }}
            className={styles.drawerSubscribeBtn}
            style={{ width: '100%', marginTop: '10px' }}
          >
            Subscribe
          </button>
          <Link href="/membership#join" className={styles.drawerCta} onClick={closeMenu}>
            Join DCRF
          </Link>
        </div>

        {/* Mobile drawer backdrop */}
        <div
          className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
          onClick={closeMenu}
        />
      </nav>

      {/* Subscription Modal */}
      <div
        className={`${styles.modalOverlay} ${isSubscribeOpen ? styles.modalOverlayActive : ''}`}
        onClick={closeSubscribeModal}
      >
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <button className={styles.modalClose} onClick={closeSubscribeModal} aria-label="Close modal">
            <X size={20} />
          </button>

          {isSubmitted ? (
            <div className={styles.successMessage}>
              <div style={{ fontSize: '40px', color: 'var(--red-primary)' }}>✓</div>
              <h4 className={styles.successTitle}>Thank You!</h4>
              <p className={styles.successDesc}>
                {successMsg}
              </p>
              <button onClick={closeSubscribeModal} className={styles.modalSubmit} style={{ minWidth: '120px' }}>
                Close
              </button>
            </div>
          ) : (
            <>
              <h3 className={styles.modalTitle}>Subscribe to DCRF</h3>
              <p className={styles.modalDesc}>
                Stay updated with the latest disaster briefs, policy guidelines, and climate action notifications.
              </p>
              
              <form onSubmit={handleModalSubscribe} className={styles.modalForm}>
                <label className={styles.formLabel}>
                  Full Name
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Rahul Sharma"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    required
                  />
                </label>

                <label className={styles.formLabel}>
                  Email Address
                  <input
                    type="email"
                    className={styles.formInput}
                    placeholder="name@organization.org"
                    value={subEmail}
                    onChange={(e) => setSubEmail(e.target.value)}
                    required
                  />
                </label>

                {subError && (
                  <p style={{ color: 'var(--red-primary)', fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
                    ⚠️ {subError}
                  </p>
                )}

                <button type="submit" disabled={subLoading} className={styles.modalSubmit}>
                  {subLoading ? 'Subscribing...' : 'Submit Subscription'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
