'use client';

import React, { useState, useEffect } from 'react';
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
  const [hash, setHash] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
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
    </>
  );
}
