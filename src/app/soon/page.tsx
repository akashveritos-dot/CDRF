'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function ComingSoonPage() {
  // Loader status state
  const [loaderDone, setLoaderDone] = useState(false);

  // Nav scroll and mobile menu state
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [interest, setInterest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ message: string; ok: boolean } | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: '--', hours: '--', minutes: '--', seconds: '--' });
  const [isLive, setIsLive] = useState(false);
  const [tabExpanded, setTabExpanded] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const interestOptions = [
    {
      value: "Excited supporter",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opt-icon">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
          <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z" opacity="0.6"/>
          <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" opacity="0.6"/>
        </svg>
      )
    },
    {
      value: "Volunteer",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opt-icon">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
      )
    },
    {
      value: "Organization",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opt-icon">
          <rect x="2" y="10" width="20" height="12" rx="2" />
          <path d="M6 10V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
          <path d="M12 14h.01M12 18h.01M8 14h.01M8 18h.01M16 14h.01M16 18h.01" />
        </svg>
      )
    },
    {
      value: "Partner",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opt-icon">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      value: "Early supporter / investor",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opt-icon">
          <path d="M6 3h12l4 6-10 13L2 9Z"/>
          <path d="M11 3 8 9l4 13 4-13-3-6"/>
          <path d="M2 9h20"/>
        </svg>
      )
    },
    {
      value: "Media / press",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opt-icon">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
          <path d="M18 14h-8M15 18h-5M10 6h8v4h-8Z"/>
        </svg>
      )
    }
  ];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);



  // 1. Loader Effect
  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => setLoaderDone(true), 1500);
    };
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // 2. Navigation Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Scroll Reveal intersection observer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll(".reveal").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [loaderDone]);

  // 4. Countdown Timer Logic
  useEffect(() => {
    const LAUNCH = new Date("2026-06-29T09:00:00Z").getTime();
    const pad = (n: number) => String(n).padStart(2, "0");

    const tick = () => {
      const diff = LAUNCH - Date.now();
      if (diff <= 0) {
        setIsLive(true);
        return;
      }
      const d = Math.floor(diff / 864e5);
      const h = Math.floor((diff % 864e5) / 36e5);
      const m = Math.floor((diff % 36e5) / 6e4);
      const s = Math.floor((diff % 6e4) / 1e3);

      setTimeLeft({
        days: String(d),
        hours: pad(h),
        minutes: pad(m),
        seconds: pad(s)
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // 5. Atmospheric particles canvas loop
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let w = c.width = window.innerWidth;
    let h = c.height = window.innerHeight;
    let raf: number;

    const getCount = () => Math.min(Math.round(window.innerWidth / 15), window.innerWidth < 600 ? 30 : 70);

    let pts = Array.from({ length: getCount() }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - .5) * .22,
      vy: (Math.random() - .5) * .22,
      r: Math.random() * 1.5 + .4
    }));

    function init() {
      if (!c) return;
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
      pts = Array.from({ length: getCount() }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - .5) * .22,
        vy: (Math.random() - .5) * .22,
        r: Math.random() * 1.5 + .4
      }));
    }

    function draw() {
      if (!ctx || !c) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(224,83,29,.45)";
        ctx.fill();

        if (window.innerWidth >= 600) {
          for (let j = i + 1; j < pts.length; j++) {
            const q = pts[j];
            const dx = p.x - q.x;
            const dy = p.y - q.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 118) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = `rgba(34,27,22,${(1 - dist / 118) * .1})`;
              ctx.lineWidth = .6;
              ctx.stroke();
            }
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    init();
    draw();

    let to: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(to);
      to = setTimeout(() => {
        cancelAnimationFrame(raf);
        init();
        draw();
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    const handleVisibilityChange = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else draw();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(raf);
    };
  }, []);

  // 6. Form Submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus(null);

    const data = {
      name: name.trim(),
      email: email.trim(),
      organization: organization.trim(),
      interest: interest
    };

    if (!data.name || !data.email || !data.interest) {
      setSubmitStatus({ message: "Please add your name, email, and area of interest.", ok: false });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setSubmitStatus({ message: "That email doesn't look right — please check it.", ok: false });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/soon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to register interest');
      }

      setName('');
      setEmail('');
      setOrganization('');
      setInterest('');
      setSubmitSuccess(true);
      setSubmitStatus({ message: "You're on the signal! We'll reach out the moment DCRF launches. 🛰️", ok: true });
    } catch (err: any) {
      setSubmitStatus({ message: err.message || "Something interrupted the signal. Please try again in a moment.", ok: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Floating Social Tab Auto-Expand Effect
  useEffect(() => {
    // Expand tab after 2.5s (after it slides in)
    const openTimer = setTimeout(() => setTabExpanded(true), 2500);
    // Collapse tab after 8.5s (2.5s delay + 6s display time)
    const closeTimer = setTimeout(() => setTabExpanded(false), 8500);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, []);

  // 8. Custom Select Click-Outside Effect
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <div className="coming-soon-wrapper">
      <a className="skip" href="#touch">Skip to sign-up form</a>

      {/* Styled markup tags injected to guarantee single-file styling isolation */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .coming-soon-wrapper {
          --bone:    #F3EEE5;  /* warm paper */
          --bone-2:  #EAE2D5;  /* raised panel */
          --ash:     #221B16;  /* deep ash (dark sections) */
          --ash-2:   #2D241D;
          --ink:     #16110D;  /* near-black text */
          --muted:   #6B6157;  /* warm gray */
          --muted-2: #9A8F82;
          --line:    rgba(34,27,22,.14);
          --line-d:  rgba(243,238,229,.14);

          --ember:   #E0531D;  /* emergency ember — primary */
          --hazard:  #F2A100;  /* hazard amber */
          --alert:   #C42E16;  /* alert red, sparing */
          --go:      #3F8F5B;  /* safe green */

          --maxw: 1180px; 
          --radius: 4px;
          --ease: cubic-bezier(.16,.84,.34,1);
          --display: "Bricolage Grotesque", system-ui, sans-serif;
          --body: "Hanken Grotesk", system-ui, sans-serif;
          --mono: "JetBrains Mono", ui-monospace, monospace;

          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: var(--body);
          background: var(--bone);
          color: var(--ink);
          line-height: 1.6;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          min-height: 100vh;
          width: 100%;
          position: relative;
        }

        .coming-soon-wrapper * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
        }

        .coming-soon-wrapper a { 
          color: inherit; 
          text-decoration: none; 
        }

        .coming-soon-wrapper ::selection { 
          background: var(--ember); 
          color: var(--bone); 
        }

        .coming-soon-wrapper .skip { 
          position: absolute; 
          left: -999px; 
          top: 0; 
          z-index: 200; 
          background: var(--ember); 
          color: #fff; 
          padding: .7rem 1rem; 
          font-weight: 600; 
        }

        .coming-soon-wrapper .skip:focus { 
          left: 0; 
        }

        .coming-soon-wrapper :focus-visible { 
          outline: 2.5px solid var(--ember); 
          outline-offset: 3px; 
        }

        /* ===== Background field ===== */
        .coming-soon-wrapper .field { 
          position: fixed; 
          inset: 0; 
          z-index: -2; 
          overflow: hidden; 
        }

        .coming-soon-wrapper .field::before { 
          content: ""; 
          position: absolute; 
          inset: -20%;
          background:
            radial-gradient(circle at 16% 28%, rgba(224,83,29,.10), transparent 42%),
            radial-gradient(circle at 84% 68%, rgba(242,161,0,.10), transparent 46%);
          filter: blur(10px); 
        }

        .coming-soon-wrapper .topo { 
          position: absolute; 
          inset: 0; 
          opacity: .6;
          background:
            repeating-radial-gradient(circle at 22% 78%, transparent 0 40px, rgba(34,27,22,.05) 40px 41px),
            repeating-radial-gradient(circle at 86% 20%, transparent 0 48px, rgba(34,27,22,.045) 48px 49px);
          -webkit-mask-image: linear-gradient(180deg,#000 0%,#000 55%,transparent 100%);
          mask-image: linear-gradient(180deg,#000 0%,#000 55%,transparent 100%); 
        }

        .coming-soon-wrapper #particles { 
          position: fixed; 
          inset: 0; 
          z-index: -1; 
        }

        /* ===== Loader ===== */
        .coming-soon-wrapper #loader { 
          position: fixed; 
          inset: 0; 
          z-index: 300; 
          background: var(--bone); 
          display: grid; 
          place-items: center; 
          transition: opacity .7s var(--ease), visibility .7s; 
        }

        .coming-soon-wrapper #loader.done { 
          opacity: 0; 
          visibility: hidden; 
        }

        .coming-soon-wrapper .boot { 
          text-align: center; 
        }

        .coming-soon-wrapper .boot-radar { 
          width: 108px; 
          height: 108px; 
          margin: 0 auto 22px; 
          position: relative; 
          border-radius: 50%; 
          border: 1px solid var(--line); 
        }

        .coming-soon-wrapper .boot-radar::before { 
          content: ""; 
          position: absolute; 
          inset: 0; 
          border-radius: 50%; 
          background: conic-gradient(from 0deg, transparent 0deg, rgba(224,83,29,.6) 42deg, transparent 72deg); 
          animation: sweep 1.3s linear infinite; 
        }

        .coming-soon-wrapper .boot-radar::after { 
          content: ""; 
          position: absolute; 
          inset: 36%; 
          border-radius: 50%; 
          background: var(--ember); 
          box-shadow: 0 0 18px var(--ember); 
        }

        .coming-soon-wrapper .boot-text { 
          font-family: var(--mono); 
          font-size: .72rem; 
          letter-spacing: .34em; 
          color: var(--muted); 
          text-transform: uppercase; 
        }

        .coming-soon-wrapper .boot-bar { 
          width: 160px; 
          height: 2px; 
          margin: 14px auto 0; 
          background: rgba(34,27,22,.14); 
          overflow: hidden; 
        }

        .coming-soon-wrapper .boot-bar i { 
          display: block; 
          height: 100%; 
          width: 0; 
          background: linear-gradient(90deg,var(--ember),var(--hazard)); 
          animation: fill 1.6s var(--ease) forwards; 
        }

        @keyframes sweep { 
          to { transform: rotate(360deg); } 
        }

        @keyframes fill { 
          to { width: 100%; } 
        }

        /* ===== Header / Nav ===== */
        .coming-soon-wrapper header { 
          position: fixed; 
          top: 0; 
          left: 0; 
          right: 0; 
          z-index: 100; 
          padding: 1.1rem clamp(1rem,4vw,2.6rem); 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          transition: background .35s var(--ease), border-color .35s, padding .35s; 
          border-bottom: 1px solid transparent; 
        }

        .coming-soon-wrapper header.scrolled { 
          background: rgba(243,238,229,.82); 
          backdrop-filter: blur(14px); 
          -webkit-backdrop-filter: blur(14px); 
          border-bottom-color: var(--line); 
          padding-top: .75rem; 
          padding-bottom: .75rem; 
        }

        .coming-soon-wrapper .brand { 
          display: flex; 
          align-items: center; 
          gap: .6rem; 
          font-family: var(--display); 
          font-weight: 700; 
          letter-spacing: .18em; 
          font-size: 1.28rem; 
        }

        .coming-soon-wrapper .brand-mark { 
          width: 30px; 
          height: 30px; 
          border-radius: 7px; 
          position: relative; 
          flex: none; 
          background: linear-gradient(135deg, rgba(224,83,29,.16), rgba(242,161,0,.12)); 
          border: 1px solid rgba(224,83,29,.4); 
          display: grid; 
          place-items: center; 
        }

        .coming-soon-wrapper .brand-mark span { 
          width: 9px; 
          height: 9px; 
          border-radius: 50%; 
          background: var(--ember); 
          box-shadow: 0 0 10px var(--ember); 
          animation: pulse 2.4s var(--ease) infinite; 
        }

        @keyframes pulse { 
          0%, 100% { transform: scale(1); opacity: 1; } 
          50% { transform: scale(.55); opacity: .5; } 
        }

        .coming-soon-wrapper .brand small { 
          color: var(--ember); 
          font-family: var(--mono); 
          font-size: .6rem; 
          letter-spacing: .24em; 
        }

        .coming-soon-wrapper nav.links { 
          display: flex; 
          align-items: center; 
          gap: 1.9rem; 
        }

        .coming-soon-wrapper nav.links a { 
          font-size: .95rem; 
          color: var(--muted); 
          transition: color .25s; 
        }

        .coming-soon-wrapper nav.links a:hover { 
          color: var(--ink); 
        }

        .coming-soon-wrapper .nav-cta { 
          font-family: var(--display); 
          font-weight: 600; 
          font-size: .9rem; 
          padding: .6rem 1.2rem; 
          border-radius: 999px; 
          color: #fff !important; 
          background: linear-gradient(135deg,var(--ember),var(--hazard)); 
          box-shadow: 0 6px 20px rgba(224,83,29,.3); 
          transition: transform .25s var(--ease), box-shadow .25s; 
        }

        .coming-soon-wrapper .nav-cta:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 10px 28px rgba(224,83,29,.42); 
        }

        .coming-soon-wrapper .burger { 
          display: none; 
          background: none; 
          border: 1px solid var(--line); 
          border-radius: 8px; 
          padding: .55rem; 
          cursor: pointer; 
        }

        .coming-soon-wrapper .burger span { 
          display: block; 
          width: 20px; 
          height: 2px; 
          background: var(--ink); 
          margin: 4px 0; 
          transition: .3s var(--ease); 
        }

        /* ===== Layout helpers ===== */
        .coming-soon-wrapper section { 
          position: relative; 
          padding: clamp(4.5rem,10vw,7.5rem) clamp(1rem,4vw,2.6rem); 
        }

        .coming-soon-wrapper .wrap { 
          max-width: var(--maxw); 
          margin: 0 auto; 
        }

        .coming-soon-wrapper .eyebrow { 
          display: inline-flex; 
          align-items: center; 
          gap: .55rem; 
          font-family: var(--mono); 
          font-size: .7rem; 
          letter-spacing: .3em; 
          text-transform: uppercase; 
          color: var(--ember); 
          padding: .42rem .85rem; 
          border-radius: 999px; 
          border: 1px solid rgba(224,83,29,.3); 
          background: rgba(224,83,29,.06); 
        }

        .coming-soon-wrapper .eyebrow .dot { 
          width: 7px; 
          height: 7px; 
          border-radius: 50%; 
          background: var(--hazard); 
          box-shadow: 0 0 8px var(--hazard); 
          animation: pulse 2s infinite; 
        }

        .coming-soon-wrapper h1, 
        .coming-soon-wrapper h2, 
        .coming-soon-wrapper h3 { 
          font-family: var(--display); 
          line-height: 1.15; 
          letter-spacing: -.02em; 
        }

        .coming-soon-wrapper .muted { 
          color: var(--muted); 
        }

        /* ===== Hero ===== */
        .coming-soon-wrapper .hero { 
          min-height: 100vh; 
          display: flex; 
          align-items: center; 
          padding-top: 7rem; 
        }

        .coming-soon-wrapper .hero-grid { 
          display: grid; 
          grid-template-columns: 1.12fr .88fr; 
          gap: clamp(2rem,5vw,4rem); 
          align-items: center; 
          width: 100%; 
        }

        .coming-soon-wrapper .hero h1 { 
          font-size: clamp(3rem,9vw,6rem); 
          font-weight: 300; 
          margin: 1.5rem 0 1.2rem; 
        }

        .coming-soon-wrapper .hero h1 b { 
          font-weight: 700; 
          display: block;
          background: linear-gradient(108deg,var(--ember) 0%,var(--hazard) 70%,var(--alert) 120%);
          -webkit-background-clip: text; 
          background-clip: text; 
          -webkit-text-fill-color: transparent; 
          padding-bottom: 0.12em;
          margin-bottom: -0.12em;
        }

        .coming-soon-wrapper .hero p.sub { 
          font-size: clamp(1.02rem,2.2vw,1.22rem); 
          color: var(--muted); 
          max-width: 40ch; 
        }

        .coming-soon-wrapper .hero-actions { 
          display: flex; 
          flex-wrap: wrap; 
          gap: .9rem; 
          margin-top: 2.1rem; 
        }

        .coming-soon-wrapper .btn { 
          font-family: var(--display); 
          font-weight: 600; 
          font-size: 1rem; 
          padding: .95rem 1.8rem; 
          border-radius: 999px; 
          cursor: pointer; 
          border: 1px solid transparent; 
          transition: transform .25s var(--ease), box-shadow .25s, background .25s, border-color .25s; 
          display: inline-flex; 
          align-items: center; 
          gap: .6rem; 
        }

        .coming-soon-wrapper .btn-primary { 
          background: linear-gradient(135deg,var(--ember),var(--hazard)); 
          color: #fff; 
          box-shadow: 0 10px 30px rgba(224,83,29,.3); 
        }

        .coming-soon-wrapper .btn-primary:hover { 
          transform: translateY(-3px); 
          box-shadow: 0 16px 40px rgba(224,83,29,.44); 
        }

        .coming-soon-wrapper .btn-ghost { 
          background: transparent; 
          border-color: var(--line); 
          color: var(--ink); 
        }

        .coming-soon-wrapper .btn-ghost:hover { 
          transform: translateY(-3px); 
          border-color: rgba(224,83,29,.5); 
          background: rgba(224,83,29,.05); 
        }

        /* Radar */
        .coming-soon-wrapper .radar-wrap { 
          display: grid; 
          place-items: center; 
          position: relative; 
        }

        .coming-soon-wrapper .radar { 
          width: min(420px,82vw); 
          aspect-ratio: 1; 
          border-radius: 50%; 
          position: relative; 
          background: radial-gradient(circle at center, rgba(234,226,213,.9), rgba(243,238,229,.3)); 
          border: 1px solid var(--line); 
          box-shadow: 0 0 70px rgba(224,83,29,.14), inset 0 0 60px rgba(34,27,22,.06); 
        }

        .coming-soon-wrapper .radar .ring { 
          position: absolute; 
          border-radius: 50%; 
          border: 1px solid rgba(34,27,22,.12); 
          inset: 12%; 
        }

        .coming-soon-wrapper .radar .ring.r2 { inset: 26%; } 
        .coming-soon-wrapper .radar .ring.r3 { inset: 40%; }

        .coming-soon-wrapper .radar .cross,
        .coming-soon-wrapper .radar .cross::before { 
          position: absolute; 
          background: rgba(34,27,22,.1); 
        }

        .coming-soon-wrapper .radar .cross { 
          left: 0; 
          right: 0; 
          top: 50%; 
          height: 1px; 
        }

        .coming-soon-wrapper .radar .cross::before { 
          content: ""; 
          left: 50%; 
          top: -50vh; 
          width: 1px; 
          height: 100vh; 
        }

        .coming-soon-wrapper .radar .sweep { 
          position: absolute; 
          inset: 0; 
          border-radius: 50%; 
          background: conic-gradient(from 0deg, transparent 0deg, rgba(224,83,29,.32) 30deg, rgba(224,83,29,0) 78deg); 
          animation: sweep 4.5s linear infinite; 
          -webkit-mask: radial-gradient(circle,#000 0 70%,transparent 71%); 
          mask: radial-gradient(circle,#000 0 70%,transparent 71%); 
        }

        .coming-soon-wrapper .radar .core { 
          position: absolute; 
          inset: 42%; 
          border-radius: 50%; 
          background: var(--ember); 
          box-shadow: 0 0 24px var(--ember); 
          animation: pulse 2.6s infinite; 
        }

        .coming-soon-wrapper .radar .wave { 
          position: absolute; 
          inset: 42%; 
          border-radius: 50%; 
          border: 1.5px solid var(--ember); 
          opacity: 0; 
          animation: wave 3.2s var(--ease) infinite; 
        }

        .coming-soon-wrapper .radar .wave.w2 { animation-delay: 1.06s; } 
        .coming-soon-wrapper .radar .wave.w3 { animation-delay: 2.13s; }

        @keyframes wave { 
          0% { transform: scale(.4); opacity: .7; } 
          100% { transform: scale(4.6); opacity: 0; } 
        }

        .coming-soon-wrapper .blip { 
          position: absolute; 
          width: 8px; 
          height: 8px; 
          border-radius: 50%; 
          background: var(--hazard); 
          box-shadow: 0 0 12px var(--hazard); 
          opacity: 0; 
          animation: blip 4.5s ease-in-out infinite; 
        }

        @keyframes blip { 
          0%, 100% { opacity: 0; transform: scale(.5);} 
          8%, 18% { opacity: 1; transform: scale(1);} 
          40% { opacity: 0;} 
        }

        /* Countdown */
        .coming-soon-wrapper .countdown { 
          display: flex; 
          gap: .7rem; 
          margin-top: 2.4rem; 
          flex-wrap: wrap; 
        }

        .coming-soon-wrapper .cd-cell { 
          background: rgba(234,226,213,.6); 
          border: 1px solid var(--line); 
          border-radius: 8px; 
          padding: .85rem 1rem; 
          min-width: 74px; 
          text-align: center; 
          backdrop-filter: blur(6px); 
        }

        .coming-soon-wrapper .cd-cell b { 
          font-family: var(--display); 
          font-size: 1.8rem; 
          font-weight: 600; 
          display: block; 
          font-variant-numeric: tabular-nums; 
        }

        .coming-soon-wrapper .cd-cell small { 
          font-family: var(--mono); 
          font-size: .58rem; 
          letter-spacing: .2em; 
          text-transform: uppercase; 
          color: var(--muted-2); 
        }

        /* ===== Section heads ===== */
        .coming-soon-wrapper .head { 
          max-width: 640px; 
          margin-bottom: 3rem; 
        }

        .coming-soon-wrapper .head h2 { 
          font-size: clamp(2rem,5vw,3.2rem); 
          font-weight: 300; 
          margin: 1.1rem 0 .8rem; 
        }

        .coming-soon-wrapper .head h2 b { font-weight: 700; }

        .coming-soon-wrapper .head p { 
          color: var(--muted); 
          font-size: 1.05rem; 
        }

        /* ===== Dark "ash" section (drama / disaster mood) ===== */
        .coming-soon-wrapper .section--dark { 
          background: var(--ash); 
          color: var(--bone); 
        }

        .coming-soon-wrapper .section--dark::before { 
          content: ""; 
          position: absolute; 
          inset: 0; 
          opacity: .5;
          background:
            repeating-radial-gradient(circle at 20% 30%, transparent 0 44px, rgba(243,238,229,.04) 44px 45px),
            radial-gradient(circle at 80% 60%, rgba(224,83,29,.14), transparent 50%);
          pointer-events: none; 
        }

        .coming-soon-wrapper .section--dark .head h2,
        .coming-soon-wrapper .section--dark .eyebrow { 
          color: var(--bone); 
        }

        .coming-soon-wrapper .section--dark .eyebrow { 
          border-color: rgba(242,161,0,.4); 
          background: rgba(242,161,0,.08); 
          color: var(--hazard); 
        }

        .coming-soon-wrapper .section--dark .head p { 
          color: #C9BFB2; 
        }

        .coming-soon-wrapper .section--dark .wrap { 
          position: relative; 
          z-index: 1; 
        }

        /* ===== Mission cards ===== */
        .coming-soon-wrapper .cards { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 1.2rem; 
        }

        .coming-soon-wrapper .card { 
          background: rgba(45,36,29,.55); 
          border: 1px solid var(--line-d); 
          border-radius: var(--radius); 
          padding: 1.9rem 1.6rem; 
          backdrop-filter: blur(8px); 
          transition: transform .35s var(--ease), border-color .35s, box-shadow .35s; 
          position: relative; 
          overflow: hidden; 
        }

        .coming-soon-wrapper .card::after { 
          content: ""; 
          position: absolute; 
          inset: 0; 
          background: radial-gradient(circle at 50% -10%, rgba(224,83,29,.18), transparent 60%); 
          opacity: 0; 
          transition: opacity .4s; 
        }

        .coming-soon-wrapper .card:hover { 
          transform: translateY(-6px); 
          border-color: rgba(242,161,0,.4); 
          box-shadow: 0 22px 50px rgba(0,0,0,.4); 
        }

        .coming-soon-wrapper .card:hover::after { 
          opacity: 1; 
        }

        .coming-soon-wrapper .card .ic { 
          width: 48px; 
          height: 48px; 
          border-radius: 11px; 
          display: grid; 
          place-items: center; 
          margin-bottom: 1.1rem; 
          background: rgba(224,83,29,.14); 
          border: 1px solid rgba(224,83,29,.4); 
          color: var(--hazard); 
        }

        .coming-soon-wrapper .card h3 { 
          font-size: 1.25rem; 
          font-weight: 600; 
          margin-bottom: .5rem; 
          color: var(--bone); 
        }

        .coming-soon-wrapper .card p { 
          color: #C2B8AB; 
          font-size: .96rem; 
        }

        /* ===== Form / Keep in touch ===== */
        .coming-soon-wrapper .touch-grid { 
          display: grid; 
          grid-template-columns: .95fr 1.05fr; 
          gap: clamp(2rem,5vw,3.5rem); 
          align-items: start; 
        }

        .coming-soon-wrapper .touch-copy h2 { 
          font-size: clamp(2rem,5vw,3.2rem); 
          font-weight: 300; 
          margin: 1rem 0 1rem; 
        }

        .coming-soon-wrapper .touch-copy h2 b { font-weight: 700; }

        .coming-soon-wrapper .touch-copy p { 
          color: var(--muted); 
          max-width: 42ch; 
        }

        .coming-soon-wrapper .benefits { 
          list-style: none; 
          margin-top: 1.8rem; 
          display: grid; 
          gap: .9rem; 
        }

        .coming-soon-wrapper .benefits li { 
          display: flex; 
          gap: .75rem; 
          align-items: flex-start; 
          color: var(--muted); 
          font-size: .97rem; 
        }

        .coming-soon-wrapper .benefits li svg { 
          flex: none; 
          margin-top: 3px; 
          color: var(--go); 
        }

        .coming-soon-wrapper .form-card { 
          background: rgba(255,253,249,.7); 
          border: 1px solid var(--line); 
          border-radius: 14px; 
          padding: clamp(1.5rem,4vw,2.4rem); 
          backdrop-filter: blur(14px); 
          -webkit-backdrop-filter: blur(14px); 
          box-shadow: 0 30px 70px rgba(34,27,22,.12); 
          position: relative; 
          overflow: visible; 
          clip-path: none !important; 
        }

        .coming-soon-wrapper .field-row { 
          margin-bottom: 1.15rem; 
        }

        .coming-soon-wrapper .field-row label { 
          display: block; 
          font-size: .82rem; 
          font-weight: 600; 
          margin-bottom: .45rem; 
          color: var(--ink); 
        }

        .coming-soon-wrapper .field-row label .opt { 
          color: var(--muted-2); 
          font-weight: 400; 
        }

        .coming-soon-wrapper .field-row input,
        .coming-soon-wrapper .field-row select { 
          width: 100%; 
          font-family: var(--body); 
          font-size: 16px; 
          padding: .85rem 1rem; 
          border-radius: 8px; 
          color: var(--ink); 
          background: rgba(243,238,229,.7); 
          border: 1px solid var(--line); 
          transition: border-color .25s, background .25s, box-shadow .25s; 
        }

        .coming-soon-wrapper .field-row input::placeholder { 
          color: var(--muted-2); 
        }

        .coming-soon-wrapper .field-row input:focus,
        .coming-soon-wrapper .field-row select:focus { 
          outline: none; 
          border-color: var(--ember); 
          background: #fff; 
          box-shadow: 0 0 0 3px rgba(224,83,29,.15); 
        }

        .coming-soon-wrapper .field-row select { 
          appearance: none; 
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%236B6157' stroke-width='2'%3E%3Cpath d='M3 5l4 4 4-4'/%3E%3C/svg%3E"); 
          background-repeat: no-repeat; 
          background-position: right 1rem center; 
        }

        .coming-soon-wrapper .form-card .btn-primary { 
          width: 100%; 
          justify-content: center; 
          margin-top: .4rem; 
        }

        .coming-soon-wrapper .form-note { 
          font-size: .78rem; 
          color: var(--muted-2); 
          margin-top: 1rem; 
          text-align: center; 
        }

        .coming-soon-wrapper .form-note a { 
          color: var(--ember); 
        }

        .coming-soon-wrapper .form-msg { 
          margin-top: 1rem; 
          padding: .9rem 1rem; 
          border-radius: 8px; 
          font-size: .9rem; 
          display: none; 
        }

        .coming-soon-wrapper .form-msg.show { 
          display: block; 
        }

        .coming-soon-wrapper .form-msg.ok { 
          background: rgba(63,143,91,.12); 
          border: 1px solid rgba(63,143,91,.4); 
          color: #2c6b42; 
        }

        .coming-soon-wrapper .form-msg.err { 
          background: rgba(196,46,22,.1); 
          border: 1px solid rgba(196,46,22,.4); 
          color: #a3260f; 
        }

        /* ===== Platform note ===== */
        .coming-soon-wrapper .platform-card { 
          display: flex; 
          flex-wrap: wrap; 
          gap: 2rem; 
          align-items: center; 
          justify-content: space-between; 
          background: linear-gradient(135deg, rgba(224,83,29,.07), rgba(242,161,0,.06)); 
          border: 1px solid rgba(224,83,29,.22); 
          border-radius: 14px; 
          padding: clamp(1.6rem,4vw,2.4rem); 
        }

        .coming-soon-wrapper .platform-card .lbl { 
          font-family: var(--mono); 
          font-size: .66rem; 
          letter-spacing: .22em; 
          text-transform: uppercase; 
          color: var(--muted-2); 
          margin-bottom: .4rem; 
        }

        .coming-soon-wrapper .platform-card .url { 
          font-family: var(--display); 
          font-size: clamp(1.1rem,3vw,1.6rem); 
          font-weight: 600; 
        }

        .coming-soon-wrapper .platform-card .url a { 
          color: var(--ember); 
          transition: color .25s; 
        }

        .coming-soon-wrapper .platform-card .url a:hover { 
          color: var(--hazard); 
        }

        .coming-soon-wrapper .platform-card .future .url { 
          color: var(--ink); 
        }

        .coming-soon-wrapper .platform-sep { 
          width: 1px; 
          align-self: stretch; 
          background: var(--line); 
        }

        /* ===== Footer ===== */
        .coming-soon-wrapper footer { 
          background: var(--ash); 
          color: var(--bone); 
          border-top: 1px solid var(--line-d); 
          padding: 3.5rem clamp(1rem,4vw,2.6rem) 2.5rem; 
        }

        .coming-soon-wrapper .foot-grid { 
          max-width: var(--maxw); 
          margin: 0 auto; 
          display: flex; 
          flex-wrap: wrap; 
          gap: 2rem; 
          justify-content: space-between; 
          align-items: flex-start; 
        }

        .coming-soon-wrapper .foot-grid .brand { 
          color: var(--bone); 
        }

        .coming-soon-wrapper .foot-grid p { 
          color: #C2B8AB; 
          font-size: .9rem; 
          max-width: 34ch; 
          margin-top: .8rem; 
        }

        .coming-soon-wrapper .socials { 
          display: flex; 
          gap: .7rem; 
        }

        .coming-soon-wrapper .socials a { 
          width: 42px; 
          height: 42px; 
          border-radius: 10px; 
          display: grid; 
          place-items: center; 
          border: 1px solid var(--line-d); 
          color: #C2B8AB; 
          transition: .3s var(--ease); 
        }

        .coming-soon-wrapper .socials a:hover { 
          color: var(--hazard); 
          border-color: rgba(242,161,0,.45); 
          transform: translateY(-3px); 
          background: rgba(242,161,0,.08); 
        }

        .coming-soon-wrapper .foot-bottom { 
          max-width: var(--maxw); 
          margin: 2.5rem auto 0; 
          padding-top: 1.6rem; 
          border-top: 1px solid var(--line-d); 
          display: flex; 
          flex-wrap: wrap; 
          gap: .8rem; 
          justify-content: space-between; 
          color: var(--muted-2); 
          font-size: .82rem; 
        }

        .coming-soon-wrapper .foot-bottom a { 
          color: var(--hazard); 
        }

        /* ===== Scroll reveal — VARIED per section ===== */
        .coming-soon-wrapper .reveal { 
          opacity: 0; 
          transition: opacity .9s var(--ease), transform .9s var(--ease), filter .9s var(--ease), clip-path .9s var(--ease); 
          will-change: transform, opacity; 
        }

        .coming-soon-wrapper .reveal.r-up { transform: translateY(46px); }
        .coming-soon-wrapper .reveal.r-down { transform: translateY(-40px); }
        .coming-soon-wrapper .reveal.r-left { transform: translateX(-56px); }
        .coming-soon-wrapper .reveal.r-right { transform: translateX(56px); }
        .coming-soon-wrapper .reveal.r-scale { transform: scale(.88); }
        .coming-soon-wrapper .reveal.r-blur { filter: blur(16px); transform: translateY(18px); }
        .coming-soon-wrapper .reveal.r-clip { clip-path: inset(0 0 100% 0); transform: translateY(24px); }
        .coming-soon-wrapper .reveal.r-rotate { transform: translateY(40px) rotate(-3deg); transform-origin: left bottom; }
        
        .coming-soon-wrapper .reveal.in { 
          opacity: 1; 
          transform: none; 
          filter: none; 
          clip-path: none; 
        }

        .coming-soon-wrapper .reveal.r-clip.in { 
          clip-path: inset(0 0 0 0); 
        }

        .coming-soon-wrapper .reveal.d1 { transition-delay: .1s; } 
        .coming-soon-wrapper .reveal.d2 { transition-delay: .2s; } 
        .coming-soon-wrapper .reveal.d3 { transition-delay: .3s; } 
        .coming-soon-wrapper .reveal.d4 { transition-delay: .4s; }

        /* ===== Responsive ===== */
        @media (max-width: 880px) {
          .coming-soon-wrapper nav.links { 
            position: fixed; 
            inset: 0 0 0 auto; 
            width: min(80vw, 320px); 
            flex-direction: column; 
            align-items: flex-start; 
            justify-content: center; 
            gap: 1.6rem; 
            padding: 2rem; 
            background: rgba(243,238,229,.97); 
            backdrop-filter: blur(18px); 
            border-left: 1px solid var(--line); 
            transform: translateX(110%); 
            transition: transform .4s var(--ease); 
            z-index: 99; 
          }
          
          .coming-soon-wrapper nav.links.open { 
            transform: none; 
          }
          
          .coming-soon-wrapper nav.links a { 
            font-size: 1.18rem; 
          }
          
          .coming-soon-wrapper .burger { 
            display: block; 
            z-index: 100; 
          }
          
          .coming-soon-wrapper .hero-grid { 
            grid-template-columns: 1fr; 
            text-align: center; 
          }
          
          .coming-soon-wrapper .hero p.sub { 
            margin-inline: auto; 
          }
          
          .coming-soon-wrapper .hero-actions,
          .coming-soon-wrapper .eyebrow,
          .coming-soon-wrapper .countdown { 
            justify-content: center; 
          }
          
          .coming-soon-wrapper .eyebrow { 
            margin-inline: auto; 
          }
          
          .coming-soon-wrapper .radar-wrap { 
            order: -1; 
            margin-bottom: 1rem; 
          }
          
          .coming-soon-wrapper .cards { 
            grid-template-columns: 1fr; 
          }
          
          .coming-soon-wrapper .touch-grid { 
            grid-template-columns: 1fr; 
            row-gap: 3.5rem; 
          }
          
          .coming-soon-wrapper .platform-sep { 
            display: none; 
            width: auto; 
            height: 1px; 
          }
          
          .coming-soon-wrapper .platform-card { 
            flex-direction: column; 
            align-items: flex-start; 
            gap: 1.4rem; 
          }
          
          .coming-soon-wrapper .reveal.r-left,
          .coming-soon-wrapper .reveal.r-right { 
            transform: translateY(15px); 
          }
        }

        @media (max-width: 480px) {
          .coming-soon-wrapper .hero { padding-top: 6rem; }
          .coming-soon-wrapper .cd-cell { min-width: 64px; padding: .7rem .5rem; flex: 1; }
          .coming-soon-wrapper .btn { width: 100%; justify-content: center; }
        }

        /* ===== Floating LinkedIn Left Tab ===== */
        .coming-soon-wrapper .linkedin-float-tab {
          position: fixed;
          left: 0;
          top: 60%;
          transform: translateY(-50%);
          z-index: 150;
          display: flex;
          align-items: center;
          background: #0A66C2;
          color: #fff;
          border-radius: 0 30px 30px 0;
          padding: .75rem 1rem .75rem .85rem;
          box-shadow: 0 10px 30px rgba(10, 102, 194, 0.35);
          transition: transform .4s var(--ease), padding-right .4s var(--ease), box-shadow .4s, background-color .25s;
          cursor: pointer;
          font-family: var(--body);
          font-weight: 600;
          font-size: .88rem;
          text-decoration: none;
          transform: translate(-100%, -50%);
          animation: slideInTab 1s 2s var(--ease) forwards;
        }

        @keyframes slideInTab {
          to { transform: translate(0, -50%); }
        }

        .coming-soon-wrapper .linkedin-float-tab.expanded,
        .coming-soon-wrapper .linkedin-float-tab:hover {
          padding-right: 1.6rem;
          box-shadow: 0 12px 36px rgba(10, 102, 194, 0.5);
          background: #004182;
        }

        .coming-soon-wrapper .linkedin-float-tab .tab-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 0;
          transition: margin-right .35s var(--ease);
          position: relative;
        }

        .coming-soon-wrapper .linkedin-float-tab .tab-icon::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.7);
          opacity: 0;
          transform: scale(0.8);
          animation: tabPulse 2s infinite;
        }

        @keyframes tabPulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .coming-soon-wrapper .linkedin-float-tab.expanded .tab-icon,
        .coming-soon-wrapper .linkedin-float-tab:hover .tab-icon {
          margin-right: .65rem;
        }

        .coming-soon-wrapper .linkedin-float-tab .tab-text {
          max-width: 0;
          overflow: hidden;
          white-space: nowrap;
          transition: max-width .35s var(--ease), opacity .35s;
          opacity: 0;
        }

        .coming-soon-wrapper .linkedin-float-tab.expanded .tab-text,
        .coming-soon-wrapper .linkedin-float-tab:hover .tab-text {
          max-width: 190px;
          opacity: 1;
        }

        @media (max-width: 600px) {
          .coming-soon-wrapper .linkedin-float-tab {
            top: 75%;
            padding: .65rem .85rem .65rem .75rem;
            font-size: .82rem;
          }
          .coming-soon-wrapper .linkedin-float-tab.expanded,
          .coming-soon-wrapper .linkedin-float-tab:hover {
            padding-right: 1.2rem;
          }
        }

        /* ===== Custom Select Dropdown UI ===== */
        .coming-soon-wrapper .custom-select-container {
          position: relative;
          width: 100%;
        }

        .coming-soon-wrapper .custom-select-trigger {
          width: 100%;
          font-family: var(--body);
          font-size: 16px;
          padding: .85rem 1rem;
          border-radius: 8px;
          color: var(--muted-2);
          background: rgba(243,238,229,.7);
          border: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          text-align: left;
          transition: border-color .25s, background .25s, box-shadow .25s;
        }

        .coming-soon-wrapper .custom-select-trigger.has-val {
          color: var(--ink);
          font-weight: 500;
        }

        .coming-soon-wrapper .custom-select-trigger:focus,
        .coming-soon-wrapper .custom-select-trigger.open {
          outline: none;
          border-color: var(--ember);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(224,83,29,.15);
        }

        .coming-soon-wrapper .custom-select-trigger .chevron-icon {
          color: var(--muted);
          transition: transform .25s var(--ease);
        }

        .coming-soon-wrapper .custom-select-trigger.open .chevron-icon {
          transform: rotate(180deg);
        }

        .coming-soon-wrapper .custom-select-options {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 10;
          background: #FFFDF9;
          border: 1px solid var(--line);
          border-radius: 8px;
          box-shadow: 0 12px 30px rgba(34,27,22,.12);
          list-style: none;
          padding: .4rem;
          margin: 0;
          overflow: hidden;
          animation: slideSelectOptions .2s var(--ease) forwards;
          transform-origin: top center;
        }

        @keyframes slideSelectOptions {
          from {
            opacity: 0;
            transform: scaleY(.95);
          }
          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        .coming-soon-wrapper .custom-select-option {
          padding: .75rem .85rem;
          border-radius: 5px;
          cursor: pointer;
          font-size: .95rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--muted);
          transition: background .2s, color .2s;
        }

        .coming-soon-wrapper .custom-select-option:hover {
          background: rgba(224,83,29,.07);
          color: var(--ember);
        }

        .coming-soon-wrapper .custom-select-option.selected {
          background: rgba(224,83,29,.1);
          color: var(--ember);
          font-weight: 600;
        }

        .coming-soon-wrapper .custom-select-option .check-icon {
          color: var(--ember);
        }

        .coming-soon-wrapper .custom-select-trigger .opt-icon {
          color: var(--ember);
          flex: none;
        }

        .coming-soon-wrapper .custom-select-option .opt-icon {
          color: var(--muted);
          transition: color .2s;
          flex: none;
        }

        .coming-soon-wrapper .custom-select-option:hover .opt-icon,
        .coming-soon-wrapper .custom-select-option.selected .opt-icon {
          color: var(--ember);
        }

        /* ===== Reduced motion ===== */
        @media (prefers-reduced-motion: reduce) {
          .coming-soon-wrapper * { 
            animation: none !important; 
            transition-duration: .01ms !important; 
            scroll-behavior: auto; 
          }
          .coming-soon-wrapper .reveal { 
            opacity: 1; 
            transform: none; 
            filter: none; 
            clip-path: none; 
          }
        }
      `}} />

      <div className="field" aria-hidden="true">
        <div className="topo"></div>
      </div>
      <canvas ref={canvasRef} id="particles" aria-hidden="true"></canvas>

      {/* Loader */}
      <div id="loader" className={loaderDone ? 'done' : ''} role="status" aria-label="Loading DCRF">
        <div className="boot">
          <div className="boot-radar"></div>
          <div className="boot-text">Establishing signal</div>
          <div className="boot-bar"><i></i></div>
        </div>
      </div>

      {/* Nav */}
      <header id="header" className={scrolled ? 'scrolled' : ''}>
        <a className="brand" href="#top" aria-label="DCRF home">
          DCRF
        </a>

        <nav className={`links ${menuOpen ? 'open' : ''}`} id="navLinks" aria-label="Primary">
          <a href="#mission" onClick={() => setMenuOpen(false)}>Mission</a>
          <a href="#touch" onClick={() => setMenuOpen(false)}>Keep in Touch</a>
          <a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a>
          <a className="nav-cta" href="#touch" onClick={() => setMenuOpen(false)}>Join Early</a>
        </nav>

        <button
          className="burger"
          id="burger"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="navLinks"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero" aria-labelledby="hero-h">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="eyebrow reveal r-up">
                <span className="dot"></span>Launching Soon · dcrf.org
              </span>

              <h1 id="hero-h" className="reveal r-up d1">DCRF is <b>Launching Soon</b></h1>

              <p className="sub reveal r-up d2">
                We're building the future of disaster preparedness, emergency response, and community resilience —
                a coordinated platform that helps people, volunteers, and organizations act faster when it matters most.
              </p>

              <div className="hero-actions reveal r-up d3">
                <a className="btn btn-primary" href="#touch">Keep in Touch With Us →</a>
                <a className="btn btn-ghost" href="https://cdrf.vercel.app/" target="_blank" rel="noopener noreferrer">Visit current platform</a>
              </div>

              {isLive ? (
                <div className="countdown reveal r-up d4" id="countdown">
                  <div className="cd-cell" style={{ minWidth: 'auto', flex: 1 }}>
                    <b style={{ color: 'var(--go)' }}>We are live!</b>
                    <small>dcrf.org</small>
                  </div>
                </div>
              ) : (
                <div className="countdown reveal r-up d4" id="countdown" aria-label="Time until launch">
                  <div className="cd-cell"><b>{timeLeft.days}</b><small>Days</small></div>
                  <div className="cd-cell"><b>{timeLeft.hours}</b><small>Hours</small></div>
                  <div className="cd-cell"><b>{timeLeft.minutes}</b><small>Minutes</small></div>
                  <div className="cd-cell"><b>{timeLeft.seconds}</b><small>Seconds</small></div>
                </div>
              )}
            </div>

            <div className="radar-wrap reveal r-scale d2" aria-hidden="true">
              <div className="radar">
                <div className="ring"></div>
                <div className="ring r2"></div>
                <div className="ring r3"></div>
                <div className="cross"></div>
                <div className="sweep"></div>
                <div className="wave"></div>
                <div className="wave w2"></div>
                <div className="wave w3"></div>
                <div className="core"></div>
                <span className="blip" style={{ top: '28%', left: '64%', animationDelay: '.6s' }}></span>
                <span className="blip" style={{ top: '68%', left: '34%', animationDelay: '2.2s' }}></span>
                <span className="blip" style={{ top: '40%', left: '78%', animationDelay: '3.4s' }}></span>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section id="mission" className="section--dark" aria-labelledby="mission-h">
          <div className="wrap">
            <div className="head">
              <span className="eyebrow reveal r-left">Why DCRF</span>
              <h2 id="mission-h" className="reveal r-clip d1">Preparedness, <b>coordinated.</b></h2>
              <p className="reveal r-left d2">
                DCRF connects the people and resources that make communities resilient — before, during, and after an emergency.
                Built for clarity and speed, designed for everyone.
              </p>
            </div>

            <div className="cards">
              <article className="card reveal r-up d1">
                <div className="ic" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3>Be ready, not reactive</h3>
                <p>Plans, checklists, and local alerts in one place so households and teams know exactly what to do when conditions change.</p>
              </article>

              <article className="card reveal r-up d2">
                <div className="ic" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12h4l3 8 4-16 3 8h6" />
                  </svg>
                </div>
                <h3>Respond together</h3>
                <p>Coordinate volunteers, organizations, and partners on a shared signal — matching needs to the people who can help fastest.</p>
              </article>

              <article className="card reveal r-up d3">
                <div className="ic" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                  </svg>
                </div>
                <h3>Build resilience</h3>
                <p>Turn every event into shared knowledge — so communities recover stronger and prepare smarter for what comes next.</p>
              </article>
            </div>
          </div>
        </section>

        {/* KEEP IN TOUCH / FORM */}
        <section id="touch" aria-labelledby="touch-h">
          <div className="wrap touch-grid">
            <div className="touch-copy">
              <span className="eyebrow reveal r-right">
                <span className="dot"></span>Keep in Touch With Us
              </span>

              <h2 id="touch-h" className="reveal r-right d1">Be on the signal <b>when we go live.</b></h2>

              <p className="reveal r-right d2">
                Whether you're an excited supporter, a volunteer, an organization, or a potential partner —
                register your interest and we'll reach out the moment DCRF launches at dcrf.org.
              </p>

              <ul className="benefits reveal r-right d3">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Early access and launch-day invites
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Volunteer & partner onboarding first
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Updates on milestones — no spam, ever
                </li>
              </ul>
            </div>

            <div className="form-card reveal r-scale d1">
              {submitSuccess ? (
                <div className="form-msg show ok" role="status" aria-live="polite" style={{ display: 'block', fontSize: '1.05rem', lineHeight: '1.5', textAlign: 'center', padding: '1.5rem 1.2rem', margin: '0' }}>
                  You're on the signal! We'll reach out the moment DCRF launches. 🛰️
                </div>
              ) : (
                <form id="interestForm" onSubmit={handleFormSubmit} noValidate>
                  <div className="field-row">
                    <label htmlFor="f-name">Full name</label>
                    <input
                      id="f-name"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="field-row">
                    <label htmlFor="f-email">Email address</label>
                    <input
                      id="f-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="field-row">
                    <label htmlFor="f-org">Organization <span className="opt">(optional)</span></label>
                    <input
                      id="f-org"
                      name="organization"
                      type="text"
                      placeholder="Company, NGO, agency, or community group"
                      autoComplete="organization"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                    />
                  </div>

                  <div className="field-row" ref={dropdownRef}>
                    <label id="l-interest">Area of interest</label>
                    <div className="custom-select-container">
                      <button
                        type="button"
                        className={`custom-select-trigger ${interest ? 'has-val' : ''} ${dropdownOpen ? 'open' : ''}`}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        aria-haspopup="listbox"
                        aria-expanded={dropdownOpen}
                        aria-labelledby="l-interest"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {interest && interestOptions.find(o => o.value === interest)?.icon}
                          <span>{interest || "Select one…"}</span>
                        </div>
                        <svg className="chevron-icon" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>

                      {dropdownOpen && (
                        <ul className="custom-select-options" role="listbox" aria-labelledby="l-interest">
                          {interestOptions.map((opt) => (
                            <li
                              key={opt.value}
                              role="option"
                              aria-selected={interest === opt.value}
                              className={`custom-select-option ${interest === opt.value ? 'selected' : ''}`}
                              onClick={() => {
                                setInterest(opt.value);
                                setDropdownOpen(false);
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                {opt.icon}
                                <span>{opt.value}</span>
                              </div>
                              {interest === opt.value && (
                                <svg className="check-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" id="submitBtn" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending…' : 'Register my interest →'}
                  </button>

                  {submitStatus && (
                    <div className={`form-msg show ${submitStatus.ok ? 'ok' : 'err'}`} role="status" aria-live="polite">
                      {submitStatus.message}
                    </div>
                  )}

                  <p className="form-note">
                    Your details connect directly to our secure interest list. Prefer the form?{' '}
                    <a href="https://cdrf.vercel.app/" target="_blank" rel="noopener noreferrer">Reach us on the current site.</a>
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* PLATFORM NOTE */}
        <section id="platform" aria-labelledby="platform-h">
          <div className="wrap">
            <div className="head">
              <span className="eyebrow reveal r-up">The Platform</span>
              <h2 id="platform-h" className="reveal r-blur d1">Today and <b>what's next.</b></h2>
              <p className="reveal r-up d2">Our current platform is live now. The official, full-scale DCRF experience launches soon at its new home.</p>
            </div>

            <div className="platform-card reveal r-rotate d1">
              <div className="current">
                <div className="lbl">Current website · live now</div>
                <div className="url">
                  <a href="https://cdrf.vercel.app/" target="_blank" rel="noopener noreferrer">cdrf.vercel.app ↗</a>
                </div>
              </div>
              <div className="platform-sep" aria-hidden="true"></div>
              <div className="future">
                <div className="lbl">Official platform · launching soon</div>
                <div className="url">dcrf.org</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="foot-grid">
          <div>
            <a className="brand" href="#top">
              DCRF
            </a>
            <p>Disaster response & emergency preparedness — building community resilience, together.</p>
          </div>

          <nav className="socials" aria-label="Social media">
            <a 
              href="https://www.linkedin.com/company/disaster-and-climate-resilience-federation/" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="DCRF on LinkedIn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3V9zm6 0h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21H9V9z" />
              </svg>
            </a>
          </nav>
        </div>

        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} DCRF. Launching soon at dcrf.org.</span>
          <span>Current platform: <a href="https://cdrf.vercel.app/" target="_blank" rel="noopener noreferrer">cdrf.vercel.app</a></span>
        </div>
      </footer>

      {/* Floating LinkedIn Left Tab */}
      <a 
        href="https://www.linkedin.com/company/disaster-and-climate-resilience-federation/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`linkedin-float-tab ${tabExpanded ? 'expanded' : ''}`}
        title="Follow us on LinkedIn to keep updated"
      >
        <span className="tab-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3V9zm6 0h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21H9V9z" />
          </svg>
        </span>
        <span className="tab-text">Follow us to keep updated</span>
      </a>
    </div>
  );
}
