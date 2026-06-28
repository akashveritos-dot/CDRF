'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Mail, User, Bell, CheckCircle2, Home, Info, Calendar, BookOpen, Facebook, Linkedin, Youtube, Newspaper, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Navbar.module.css';
import { useTelemetry } from '@/context/TelemetryContext';

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
      { name: 'Dcrc ’26 Conclave', path: '/event/dcrc-26' }
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
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  useEffect(() => {
    setActiveSubmenu(null);
    setIsSocialOpen(false);
  }, [pathname]);

  const { data: telemetryData } = useTelemetry();
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

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

  // Dynamically compile weather alerts list from local geolocation and regional telemetry
  useEffect(() => {
    const baseAlerts = [
      {
        city: 'Mumbai',
        state: 'Maharashtra',
        temp: 31,
        type: 'storm',
        alert: 'Severe Thunderstorm Warning: Storm systems tracking inland. Heavy rainfall and high winds predicted.',
        emoji: '⛈️'
      },
      {
        city: 'Chennai',
        state: 'Tamil Nadu',
        temp: 28,
        type: 'flood',
        alert: 'Rainfall Alert: High intensity monsoon showers active. Avoid waterlogged areas.',
        emoji: '☔'
      },
      {
        city: 'Delhi',
        state: 'Delhi',
        temp: 39,
        type: 'heat',
        alert: 'Heatwave Advisory: Peak temperature warning in effect. High UV index.',
        emoji: '☀️'
      },
      {
        city: 'Kolkata',
        state: 'West Bengal',
        temp: 29,
        type: 'storm',
        alert: 'Thunderstorm Alert: Active convection cells with frequent lightning activity.',
        emoji: '⛈️'
      }
    ];

    const compiled: any[] = [];

    // 1. Prioritize geolocated city if a warning is active
    if (weatherAlert && weatherAlert.liveTheme) {
      compiled.push({
        city: weatherAlert.locationName.city,
        state: weatherAlert.locationName.state || '',
        temp: weatherAlert.temperature,
        type: weatherAlert.liveTheme,
        alert: weatherAlert.liveTheme === 'storm'
          ? `Severe Storm Alert: High convection cell active in ${weatherAlert.locationName.city}.`
          : `Heavy Rainfall Warning: Active precipitation registered in ${weatherAlert.locationName.city}.`,
        emoji: weatherAlert.liveTheme === 'storm' ? '⛈️' : '☔'
      });
    } else if (weatherAlert) {
      // Show local weather as a normal status if no severe alert
      compiled.push({
        city: weatherAlert.locationName.city,
        state: weatherAlert.locationName.state || '',
        temp: weatherAlert.temperature,
        type: 'general',
        alert: `Local Weather: Ambient temperature is normal in ${weatherAlert.locationName.city}.`,
        emoji: '🌤️'
      });
    }

    // 2. Add other cities from database/telemetry
    const telemetryTemps = telemetryData.cityTemps || [];
    telemetryTemps.forEach((t: any) => {
      // Avoid duplicates
      if (weatherAlert && weatherAlert.locationName.city.toLowerCase() === t.city.toLowerCase()) {
        return;
      }

      let type = 'general';
      let emoji = '🌤️';
      let msg = `Normal seasonal temperature recorded in ${t.city}.`;

      if (t.temp >= 35) {
        type = 'heat';
        emoji = '☀️';
        msg = `Heatwave Warning: Extreme temperature of ${t.temp}°C registered in ${t.city}.`;
      } else if (t.city === 'Mumbai') {
        type = 'storm';
        emoji = '⛈️';
        msg = `Severe Thunderstorm Warning: Local weather warning active for ${t.city}.`;
      } else if (t.city === 'Chennai') {
        type = 'flood';
        emoji = '☔';
        msg = `Rainfall Warning: Coastal weather advisory issued for ${t.city}.`;
      }

      compiled.push({
        city: t.city,
        state: '',
        temp: t.temp,
        type,
        alert: msg,
        emoji
      });
    });

    if (compiled.length === 0) {
      setActiveAlerts(baseAlerts);
    } else {
      setActiveAlerts(compiled);
    }
  }, [weatherAlert, telemetryData.cityTemps]);

  // No auto-open — popup only opens on explicit user click

  // Rotate through alerts sequentially
  useEffect(() => {
    if (activeAlerts.length <= 1 || !showAlertPopup) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeAlerts.length);
    }, 6000); // 6 seconds slide duration

    return () => clearInterval(timer);
  }, [activeAlerts.length, showAlertPopup]);

  const dismissAlertPopup = () => {
    setShowAlertPopup(false);
    sessionStorage.setItem('dcrs_alert_dismissed', 'true');
  };

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
          <img 
            src="/dcrf-Photoroom.png" 
            alt="DCRF Logo" 
            className={styles.logoImage}
            width="150"
            height="45"
          />
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
          {/* Weather Alert Trigger Button (Circle Icon) — desktop only */}
          <button 
            onClick={() => setShowAlertPopup(prev => !prev)} 
            className={`${styles.weatherCircleBtn} ${activeAlerts.some(a => a.type === 'storm' || a.type === 'flood' || a.type === 'heat') ? styles.weatherCircleBtnAlert : ''}`}
            title="Open active weather alerts"
            aria-label="Open weather alerts"
          >
            <Bell size={16} className={styles.bellIcon} />
            {activeAlerts.some(a => a.type === 'storm' || a.type === 'flood' || a.type === 'heat') && (
              <span className={styles.bellBadge}>
                {activeAlerts.filter(a => a.type === 'storm' || a.type === 'flood' || a.type === 'heat').length}
              </span>
            )}
          </button>

          <button onClick={() => setIsSubscribeOpen(true)} className={styles.subscribeBtn}>
            Subscribe
          </button>
          <Link href="/membership#join" className={styles.cta}>
            Join DCRF
          </Link>
        </div>

        {/* Mobile Join Button */}
        <Link href="/membership#join" className={styles.mobileCtaBtn}>
          Join
        </Link>

        {/* Mobile Subscribe Button */}
        <button onClick={() => setIsSubscribeOpen(true)} className={styles.mobileSubscribeBtn}>
          Subscribe
        </button>

        {/* Mobile Social Media Floating Dropdown — home page only */}
        {pathname === '/' && (
          <div className={styles.mobileSocialDropdownContainer}>
            <button
              onClick={() => setIsSocialOpen(!isSocialOpen)}
              className={`${styles.mobileSocialToggle} ${isSocialOpen ? styles.activeToggle : ''}`}
              aria-label="Toggle social links"
            >
              <ChevronDown size={16} className={`${styles.mobileSocialCaret} ${isSocialOpen ? styles.mobileSocialCaretRotated : ''}`} />
            </button>

            <AnimatePresence>
              {isSocialOpen && (
                <motion.div
                  className={styles.mobileSocialMenu}
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <a
                    href="https://www.linkedin.com/company/disaster-and-climate-resilience-federation/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mobileSocialIconLink}
                    style={{ color: '#0A66C2' }}
                    onClick={() => setIsSocialOpen(false)}
                  >
                    <Linkedin size={18} />
                  </a>
                  <a
                    href="https://www.facebook.com/thecsruniverse.official/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mobileSocialIconLink}
                    style={{ color: '#1877F2' }}
                    onClick={() => setIsSocialOpen(false)}
                  >
                    <Facebook size={18} />
                  </a>
                  <a
                    href="https://www.youtube.com/@thecsruniverse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mobileSocialIconLink}
                    style={{ color: '#FF0000' }}
                    onClick={() => setIsSocialOpen(false)}
                  >
                    <Youtube size={18} />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

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
        
      {/* Subscription Modal */}
      <AnimatePresence>
        {isSubscribeOpen && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSubscribeModal}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalClose} onClick={closeSubscribeModal} aria-label="Close modal">
                <X size={20} />
              </button>

              {isSubmitted ? (
                <motion.div 
                  className={styles.successMessage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className={styles.successIconWrapper}>
                    <CheckCircle2 size={36} className={styles.successIcon} />
                  </div>
                  <h4 className={styles.successTitle}>Subscription Confirmed!</h4>
                  <p className={styles.successDesc}>
                    {successMsg || "You have successfully subscribed to the DCRF Policy Briefs and newsletter updates."}
                  </p>
                  <button onClick={closeSubscribeModal} className={styles.modalSubmit} style={{ minWidth: '150px', marginTop: '10px' }}>
                    Awesome, Thanks!
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className={styles.modalIconWrapper}>
                    <div className={styles.modalIconCircle}>
                      <Bell size={24} className={styles.modalIcon} />
                    </div>
                  </div>
                  
                  <h3 className={styles.modalTitle}>Subscribe to DCRF</h3>
                  <p className={styles.modalDesc}>
                    Get real-time crisis bulletins, policy reports, and climate resilience briefings delivered directly to your inbox.
                  </p>
                  
                  <form onSubmit={handleModalSubscribe} className={styles.modalForm}>
                    <div className={styles.inputWrapper}>
                      <User size={16} className={styles.inputIcon} />
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Full Name"
                        value={subName}
                        onChange={(e) => setSubName(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.inputWrapper}>
                      <Mail size={16} className={styles.inputIcon} />
                      <input
                        type="email"
                        className={styles.formInput}
                        placeholder="Email Address"
                        value={subEmail}
                        onChange={(e) => setSubEmail(e.target.value)}
                        required
                      />
                    </div>

                    {subError && (
                      <div className={styles.errorText}>
                        <span>⚠️ {subError}</span>
                      </div>
                    )}

                    <button type="submit" disabled={subLoading} className={styles.modalSubmit}>
                      {subLoading ? 'Subscribing...' : 'Subscribe Now'}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>
       {/* Mobile Glassmorphic Bottom Dock / Menu */}
      <div className={styles.bottomNav}>
        <div className={styles.bottomNavContainer}>
          <Link
            href="/"
            className={`${styles.bottomTab} ${pathname === '/' && !activeSubmenu ? styles.bottomTabActive : ''}`}
            onClick={() => setActiveSubmenu(null)}
          >
            <Home size={20} />
            <span>Home</span>
          </Link>

          <Link
            href="/news"
            className={`${styles.bottomTab} ${pathname === '/news' && !activeSubmenu ? styles.bottomTabActive : ''}`}
            onClick={() => setActiveSubmenu(null)}
          >
            <Newspaper size={20} />
            <span>News</span>
          </Link>

          <button
            className={`${styles.bottomTab} ${activeSubmenu === 'Events' ? styles.bottomTabActive : ''}`}
            onClick={() => setActiveSubmenu(activeSubmenu === 'Events' ? null : 'Events')}
          >
            <Calendar size={20} />
            <span>Events</span>
          </button>

          <button
            className={`${styles.bottomTab} ${activeSubmenu === 'Insights' ? styles.bottomTabActive : ''}`}
            onClick={() => setActiveSubmenu(activeSubmenu === 'Insights' ? null : 'Insights')}
          >
            <BookOpen size={20} />
            <span>Insights</span>
          </button>

          <button
            className={`${styles.bottomTab} ${activeSubmenu === 'More' ? styles.bottomTabActive : ''}`}
            onClick={() => setActiveSubmenu(activeSubmenu === 'More' ? null : 'More')}
          >
            <Menu size={20} />
            <span>More</span>
          </button>

          <button
            className={styles.bottomTab}
            onClick={() => {
              window.dispatchEvent(new Event('dcrs-toggle-chat'));
              setActiveSubmenu(null);
            }}
          >
            <MessageSquare size={20} />
            <span>Chat</span>
          </button>

          {/* Bell Alert Tab — mobile */}
          <button
            className={`${styles.bottomTab} ${showAlertPopup ? styles.bottomTabActive : ''}`}
            onClick={() => { setShowAlertPopup(prev => !prev); setActiveSubmenu(null); }}
            aria-label="Weather alerts"
          >
            <span className={styles.bellTabWrap}>
              <Bell size={20} />
              {activeAlerts.some(a => a.type === 'storm' || a.type === 'flood' || a.type === 'heat') && (
                <span className={styles.bellBadgeMobile}>
                  {activeAlerts.filter(a => a.type === 'storm' || a.type === 'flood' || a.type === 'heat').length}
                </span>
              )}
            </span>
            <span>Alerts</span>
          </button>
        </div>

        {/* Floating Submenus Rendered Above */}
        <AnimatePresence>
          {activeSubmenu && (
            <motion.div
              className={styles.bottomSubmenuWrapper}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className={styles.bottomSubmenuCard}>
                <div className={styles.submenuHeader}>
                  <h4>{activeSubmenu === 'More' ? 'Menu' : activeSubmenu} Links</h4>
                  <button onClick={() => setActiveSubmenu(null)} aria-label="Close submenu">
                    <X size={14} />
                  </button>
                </div>
                <div className={styles.submenuLinksList}>
                  {activeSubmenu === 'Events' && (
                    <>
                      <Link href="/event/dcrc-26" className={pathname === '/event/dcrc-26' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>Dcrc &apos;26 Conclave</Link>
                    </>
                  )}
                  {activeSubmenu === 'Insights' && (
                    <>
                      <Link href="/reports" className={pathname === '/reports' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>Policy Reports</Link>
                      <Link href="/insights/map" className={pathname === '/insights/map' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>Hazard Map</Link>
                      <Link href="/podcasts" className={pathname === '/podcasts' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>Podcasts</Link>
                      <Link href="/insights/event-videos" className={pathname === '/insights/event-videos' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>Event Videos</Link>
                    </>
                  )}
                  {activeSubmenu === 'More' && (
                    <>
                      <div className={styles.submenuSectionHeader}>About DCRF</div>
                      <Link href="/about/mission-vision" className={pathname === '/about/mission-vision' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>Mission & Vision</Link>
                      <Link href="/about/charter-10-point-agenda" className={pathname === '/about/charter-10-point-agenda' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>10 Point Agenda</Link>
                      <Link href="/about/governing-council" className={pathname === '/about/governing-council' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>Governing Council</Link>
                      <Link href="/about/advisory-council" className={pathname === '/about/advisory-council' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>Advisory Council</Link>
                      <Link href="/about/working-group" className={pathname === '/about/working-group' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>Working Group</Link>
                      
                      <div className={styles.submenuSectionHeader} style={{ marginTop: '14px' }}>Federation</div>
                      <Link href="/membership" className={pathname === '/membership' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>Membership Tiers</Link>
                      <Link href="/gallery" className={pathname === '/gallery' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>Gallery</Link>
                      <Link href="/contact" className={pathname === '/contact' ? styles.activeSubLink : ''} onClick={() => setActiveSubmenu(null)}>Contact Us</Link>
                      
                      <div className={styles.popupSocialDivider} />
                      <div className={styles.popupSocialHeader}>Follow DCRF</div>
                      <div className={styles.popupSocialLinks}>
                        <a
                          href="https://www.linkedin.com/company/disaster-and-climate-resilience-federation/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.popupSocialLink}
                        >
                          <Linkedin size={14} />
                          <span>LinkedIn</span>
                        </a>
                        <a
                          href="https://www.facebook.com/thecsruniverse.official/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.popupSocialLink}
                        >
                          <Facebook size={14} />
                          <span>Facebook</span>
                        </a>
                        <a
                          href="https://www.youtube.com/@thecsruniverse"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.popupSocialLink}
                        >
                          <Youtube size={14} />
                          <span>YouTube</span>
                        </a>
                      </div>

                      <div className={styles.popupSocialDivider} />
                      <div className={styles.popupSocialHeader}>Telemetry</div>
                      <button
                        onClick={() => {
                          setShowAlertPopup(true);
                          setActiveSubmenu(null);
                        }}
                        className={styles.submenuAlertBtn}
                      >
                        <Bell size={12} style={{ display: 'inline', marginRight: '6px' }} />
                        Active Weather Alerts
                      </button>

                      <button
                        onClick={() => {
                          setIsSubscribeOpen(true);
                          setActiveSubmenu(null);
                        }}
                        className={styles.submenuSubscribeBtn}
                      >
                        Subscribe to Updates
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Weather Alert Rotator Popup */}
      <AnimatePresence>
        {showAlertPopup && activeAlerts.length > 0 && (
          <>
            {/* Mobile backdrop tap-to-close */}
            <motion.div
              className={styles.alertMobileBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismissAlertPopup}
            />
            <motion.div
              className={`${styles.weatherPopupAlert} ${
                activeAlerts[currentSlideIndex].type === 'storm' 
                  ? styles.weatherPopupStorm 
                  : activeAlerts[currentSlideIndex].type === 'heat' 
                    ? styles.weatherPopupHeat 
                    : ''
              }`}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            >
              <div className={styles.alertHeader}>
                <div className={styles.alertTitleRow}>
                  <span className={styles.alertPulseDot} />
                  <span className={styles.alertHeaderLabel}>
                    {activeAlerts[currentSlideIndex].type === 'storm' 
                      ? '⚠️ Severe Alert' 
                      : activeAlerts[currentSlideIndex].type === 'flood' 
                        ? '⚠️ Weather Alert' 
                        : activeAlerts[currentSlideIndex].type === 'heat' 
                          ? '⚠️ Heat Advisory' 
                          : 'ℹ️ Info'}
                  </span>
                </div>
                <button 
                  onClick={dismissAlertPopup}
                  className={styles.alertCloseBtn}
                  aria-label="Close weather alert"
                >
                  <X size={14} />
                </button>
              </div>

              <div className={styles.alertContent}>
                <span className={styles.alertContentEmoji}>
                  {activeAlerts[currentSlideIndex].emoji}
                </span>
                <div className={styles.alertTextGroup}>
                  <div className={styles.alertCityRow}>
                    <span className={styles.alertCityName}>
                      {activeAlerts[currentSlideIndex].city}
                    </span>
                    {activeAlerts[currentSlideIndex].state && (
                      <span className={styles.alertStateName}>
                        , {activeAlerts[currentSlideIndex].state}
                      </span>
                    )}
                    <span className={styles.alertTemp}>
                      &bull; {activeAlerts[currentSlideIndex].temp}°C
                    </span>
                  </div>
                  <p className={styles.alertMsgText}>
                    {activeAlerts[currentSlideIndex].alert}
                  </p>
                </div>
              </div>

              {/* Linear Progress Bar Timer */}
              <div className={styles.alertProgressContainer}>
                <div 
                  key={currentSlideIndex}
                  className={`${styles.alertProgressBar} ${
                    activeAlerts[currentSlideIndex].type === 'storm' 
                      ? styles.progressBarStorm 
                      : activeAlerts[currentSlideIndex].type === 'heat' 
                        ? styles.progressBarHeat 
                        : ''
                  }`}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
