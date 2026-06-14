'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import styles from './Navbar.module.css';

interface Submenu {
  name: string;
  path: string;
}

interface MenuLink {
  name: string;
  path: string;
  submenus?: Submenu[];
}

const menuLinks: MenuLink[] = [
  { name: 'Home', path: '/' },
  {
    name: 'About Us',
    path: '/about/mission-vision',
    submenus: [
      { name: 'Mission & Vision', path: '/about/mission-vision' },
      { name: 'Charter - 10 Point Agenda', path: '/about/charter-10-point-agenda' },
      { name: 'Governing Council', path: '/about/governing-council' },
      { name: 'Advisory Council', path: '/about/advisory-council' },
      { name: 'Working Group', path: '/about/working-group' }
    ]
  },
  { name: 'Membership', path: '/membership' },
  {
    name: 'Upcoming Events',
    path: '/event/dcrc-26',
    submenus: [
      { name: 'DCRC ’26 Conclave', path: '/event/dcrc-26' },
      { name: 'Monthly Webinars', path: '/event/monthly-webinars' }
    ]
  },
  {
    name: 'Insights',
    path: '/news',
    submenus: [
      { name: 'News Feed', path: '/news' },
      { name: 'Policy Reports', path: '/reports' },
      { name: 'Hazard Map', path: '/insights/map' },
      { name: 'Podcasts', path: '/podcasts' },
      { name: 'Event Videos', path: '/insights/event-videos' }
    ]
  },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Contact Us', path: '/contact' }
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const [hash, setHash] = useState('');
  const pathname = usePathname();
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});

  const [weatherAlert, setWeatherAlert] = useState<{
    liveTheme: 'flood' | 'storm' | null;
    temperature: number | null;
    locationName: { city: string; state: string };
  } | null>(null);

  useEffect(() => {
    const handleWeatherUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setWeatherAlert({
          liveTheme: customEvent.detail.liveTheme,
          temperature: customEvent.detail.temperature,
          locationName: customEvent.detail.locationName
        });
      }
    };

    if (typeof window !== 'undefined' && window.__dcrsWeatherData) {
      setWeatherAlert({
        liveTheme: window.__dcrsWeatherData.liveTheme,
        temperature: window.__dcrsWeatherData.temperature,
        locationName: window.__dcrsWeatherData.locationName
      });
    }

    window.addEventListener('dcrs-weather-update', handleWeatherUpdate);
    return () => window.removeEventListener('dcrs-weather-update', handleWeatherUpdate);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      if (currentScrollY > 120) {
        if (currentScrollY > lastScrollYRef.current && !isOpen) {
          setVisible(false);
        } else {
          setVisible(true);
        }
      } else {
        setVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('public-menu-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('public-menu-open');
    }

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('public-menu-open');
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

  const toggleMobileExpanded = (name: string, e: React.MouseEvent) => {
    e.preventDefault();
    setMobileExpanded((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const isLinkActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' && !hash;
    }
    if (path.startsWith('/#')) {
      return pathname === '/' && hash === path.substring(1);
    }
    // Anchor routes
    if (path.includes('#')) {
      const [urlPath, urlHash] = path.split('#');
      return pathname === urlPath && hash === '#' + urlHash;
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
          {weatherAlert?.liveTheme && (
            <span className={`${styles.weatherNavTag} ${weatherAlert.liveTheme === 'storm' ? styles.weatherNavTagStorm : ''}`}>
              <span className={styles.weatherNavDot} />
              <span className={styles.weatherNavText}>
                {weatherAlert.liveTheme === 'storm' ? '⛈️' : '☔'} {weatherAlert.locationName.city} {weatherAlert.temperature}°C
              </span>
            </span>
          )}
        </Link>

        {/* Desktop Links */}
        <div className={styles.navLinks}>
          {menuLinks.map((link) => {
            if (link.submenus) {
              return (
                <div key={link.name} className={styles.dropdownContainer}>
                  <Link
                    href={link.path}
                    className={`${styles.dropdownTrigger} ${isLinkActive(link.path) ? styles.activeLink : ''}`}
                  >
                    {link.name}
                    <ChevronDown size={12} className={styles.caret} />
                  </Link>
                  <div className={styles.dropdownMenu}>
                    {link.submenus.map((sub) => (
                      <Link
                        key={sub.path}
                        href={sub.path}
                        className={isLinkActive(sub.path) ? styles.activeSubLink : ''}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={link.path}
                href={link.path}
                className={isLinkActive(link.path) ? styles.activeLink : ''}
              >
                {link.name}
              </Link>
            );
          })}
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
          {menuLinks.map((link) => {
            if (link.submenus) {
              const isExpanded = !!mobileExpanded[link.name];
              return (
                <div key={link.name} className={styles.mobileAccordionContainer}>
                  <button
                    onClick={(e) => toggleMobileExpanded(link.name, e)}
                    className={styles.mobileAccordionTrigger}
                  >
                    <span>{link.name}</span>
                    <ChevronDown size={16} className={`${styles.mobileCaret} ${isExpanded ? styles.mobileCaretRotated : ''}`} />
                  </button>
                  <div className={`${styles.mobileAccordionMenu} ${isExpanded ? styles.mobileAccordionMenuExpanded : ''}`}>
                    {link.submenus.map((sub) => (
                      <Link
                        key={sub.path}
                        href={sub.path}
                        onClick={closeMenu}
                        className={`${styles.mobileSubLink} ${isLinkActive(sub.path) ? styles.activeSubLink : ''}`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={closeMenu}
                className={isLinkActive(link.path) ? styles.activeLink : ''}
              >
                {link.name}
              </Link>
            );
          })}
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
              <div style={{ fontSize: '40px', color: 'var(--wine-red-primary)' }}>✓</div>
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
                  <div className={styles.errorText}>
                    <span>⚠️ {subError}</span>
                  </div>
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
