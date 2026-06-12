'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './page.module.css';
import {
  heroStats as fallbackHeroStats,
  cityTemps as fallbackCityTemps,
  stripStats,
  disasterEvents as fallbackDisasterEvents,
  partners
} from '@/data/dataStore';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import CountUp from '@/components/ui/CountUp/CountUp';
import IndiaMap from '@/components/insights/IndiaMap/IndiaMap';
import ClimateGauge from '@/components/insights/ClimateGauge/ClimateGauge';
import LossChart from '@/components/insights/LossChart/LossChart';
import DonutChart from '@/components/insights/DonutChart/DonutChart';
import Heatmap from '@/components/insights/Heatmap/Heatmap';
import { Shield, ArrowRight, Calendar, Users, FileText, Globe, Waves, Flame, Wind, Mountain, Droplets, Activity } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState<any[]>(fallbackHeroStats);
  const [temps, setTemps] = useState<any[]>(fallbackCityTemps);
  const [events, setEvents] = useState<any[]>(fallbackDisasterEvents);
  const [lossesData, setLossesData] = useState<any[] | undefined>(undefined);
  const [shareData, setShareData] = useState<any[] | undefined>(undefined);
  const [heatmapData, setHeatmapData] = useState<number[][] | undefined>(undefined);

  useEffect(() => {
    async function loadTelemetry() {
      try {
        const res = await fetch('/api/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (data.heroStats) setStats(data.heroStats);
          if (data.cityTemps) setTemps(data.cityTemps);
          if (data.disasterEvents) setEvents(data.disasterEvents);
          if (data.economicLosses) setLossesData(data.economicLosses);
          if (data.lossShare) setShareData(data.lossShare);
          if (data.heatmapData) setHeatmapData(data.heatmapData);
        }
      } catch (err) {
        console.warn('Failed to fetch home telemetry API:', err);
      }
    }
    loadTelemetry();
    const pollInterval = setInterval(loadTelemetry, 8000);
    return () => clearInterval(pollInterval);
  }, []);

  const getEventIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'floods':
        return <Waves size={15} className={styles.eventIcon} style={{ color: 'var(--blue-primary)' }} />;
      case 'heatwaves':
        return <Flame size={15} className={styles.eventIcon} style={{ color: 'var(--red-primary)' }} />;
      case 'cyclones':
        return <Wind size={15} className={styles.eventIcon} style={{ color: 'var(--purple-primary)' }} />;
      case 'landslides':
        return <Mountain size={15} className={styles.eventIcon} style={{ color: 'var(--navy-light)' }} />;
      case 'droughts':
        return <Droplets size={15} className={styles.eventIcon} style={{ color: 'var(--orange-primary)' }} />;
      case 'earthquakes':
        return <Activity size={15} className={styles.eventIcon} style={{ color: 'var(--gold-primary)' }} />;
      default:
        return null;
    }
  };

  const getEventTrend = (label: string) => {
    switch (label.toLowerCase()) {
      case 'floods':
        return <span className={`${styles.trendBadge} ${styles.trendUp}`}>+12.4% ▲</span>;
      case 'heatwaves':
        return <span className={`${styles.trendBadge} ${styles.trendUp}`}>+18.7% ▲</span>;
      case 'cyclones':
        return <span className={`${styles.trendBadge} ${styles.trendDown}`}>-4.2% ▼</span>;
      case 'landslides':
        return <span className={`${styles.trendBadge} ${styles.trendUp}`}>+8.1% ▲</span>;
      case 'droughts':
        return <span className={`${styles.trendBadge} ${styles.trendUp}`}>+14.3% ▲</span>;
      default:
        return <span className={`${styles.trendBadge} ${styles.trendStable}`}>Stable</span>;
    }
  };

  return (
    <div>
      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOrb} />
        
        <div className={styles.heroContent}>
          <ScrollReveal direction="up" delay={0.1}>
            <div className={styles.heroEyebrow}>
              <Shield size={12} style={{ color: 'var(--gold-light)' }} />
              Founded 2026 • New Delhi, India
            </div>
            <h1>
              Building <em>Resilience</em>
              <br />
              Through Knowledge,
              <br />
              Convergence & Action
            </h1>
            <p className={styles.heroSub}>
              India’s premier multi-stakeholder federation unifying corporates, NGOs, academia,
              and government bodies to advance disaster preparedness and climate resilience — from early warning to sustainable recovery.
            </p>
            <div className={styles.heroActions}>
              <Link href="/membership#join" className={styles.btnPrimary}>
                Become a Member
                <ArrowRight size={16} />
              </Link>
              <a href="#insights" className={styles.btnOutline}>
                Explore Data Insights
              </a>
            </div>
          </ScrollReveal>

          {/* Right Climate Widget Panel */}
          <ScrollReveal direction="left" delay={0.3}>
            <div className={`${styles.heroPanel} glass-panel radar-sweep-container`} style={{ padding: '0', overflow: 'hidden' }}>
              <div className="radar-sweep-line" />
              
              <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden' }}>
                <img 
                  src="/climate_radar_dashboard.png" 
                  alt="DCRF India Climate Radar Monitor" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(10, 20, 36, 0.95))' }} />
                
                {/* Floating Warning Tag */}
                <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(153, 27, 27, 0.9)', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 700, color: 'var(--white)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <span className="pulse-dot" style={{ width: '6px', height: '6px', boxShadow: 'none', background: 'white' }} />
                  Early Warning Feed Active
                </div>
              </div>
              
              <div style={{ padding: '24px 28px 28px' }}>
                <div className={styles.panelTitle} style={{ color: 'var(--white)' }}>
                  <span className="pulse-dot sonar-emitter">
                    <span className="sonar-pulse" />
                  </span>
                  India Climate Monitor • Live
                </div>
                
                <div className={styles.dstatGrid}>
                  {stats.map((stat) => (
                    <div key={stat.id} className={styles.dstat} style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className={`${styles.dstatNum} ${
                        stat.type === 'red' ? styles.numRed : 
                        stat.type === 'amber' ? styles.numAmber : 
                        stat.type === 'teal' ? styles.numTeal : styles.numBlue
                      }`}>
                        <CountUp end={stat.count} suffix={stat.suffix} decimals={stat.count % 1 !== 0 ? 1 : 0} />
                      </div>
                      <div className={styles.dstatLabel} style={{ color: 'var(--gray-400)' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className={styles.tempsHeader} style={{ color: 'var(--white)', opacity: 0.9 }}>Heat Index — Major Cities</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {temps.map((city) => (
                    <div key={city.city} className={styles.tempRow}>
                      <span className={styles.tempCity} style={{ color: 'var(--gray-300)' }}>{city.city}</span>
                      <div className={styles.tempBarWrap} style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <motion.div 
                          className={styles.tempBarFill} 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${city.percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          style={{ background: 'linear-gradient(90deg, var(--gold-light), var(--red-primary))' }}
                        />
                      </div>
                      <span className={styles.tempVal} style={{ color: 'var(--white)' }}>{city.temp}°C</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* STATS STRIP SECTION */}
      <section className={styles.statsStrip}>
        {stripStats.map((stat, idx) => (
          <div key={stat.id} className={styles.stripStat}>
            <div className={styles.stripNum}>
              <CountUp end={stat.count} suffix={stat.suffix} decimals={stat.count % 1 !== 0 ? 1 : 0} />
            </div>
            <div className={styles.stripLabel}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* INTERACTIVE DATA INSIGHTS DASHBOARD */}
      <section id="insights" className={styles.section}>
        <ScrollReveal direction="up">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>Data Insights</div>
            <h2 className={styles.sectionTitle}>India Disaster & Climate Dashboard</h2>
            <p className={styles.sectionSub}>
              Real-time modeling of climate-driven hazards in India. Toggle states to inspect hazard indices, historical GDP loss, and rainfall severity grids.
            </p>
          </div>
        </ScrollReveal>

        <div className={styles.dashGrid}>
          {/* India Map Card - Wide Column */}
          <div className={styles.wideCard}>
            <ScrollReveal direction="up" delay={0.1}>
              <IndiaMap />
            </ScrollReveal>
          </div>

          {/* Temperature Anomaly Dial */}
          <ScrollReveal direction="up" delay={0.2} className={styles.dashCardReveal}>
            <ClimateGauge />
          </ScrollReveal>

          {/* Disaster Event Bars */}
          <ScrollReveal direction="up" delay={0.3} className={styles.dashCardReveal}>
            <div className={styles.barChartCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-default)' }}>Disaster Events by Type (2020–2025)</span>
                <span style={{ fontSize: '11px', background: 'var(--bg-surface-alt)', padding: '4px 10px', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)', fontWeight: 600 }}>Events / Year</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', flex: 1 }}>
                {events.map((item, idx) => (
                  <div key={item.label} className={styles.barRow}>
                    <div className={styles.barLabelGroup}>
                      {getEventIcon(item.label)}
                      <span className={styles.barLabel}>{item.label}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <motion.div
                        className={`${styles.barFill} ${
                          (item.class_name || item.class) === 'bf-floods' ? styles.bfFloods :
                          (item.class_name || item.class) === 'bf-heat' ? styles.bfHeat :
                          (item.class_name || item.class) === 'bf-cyclone' ? styles.bfCyclone :
                          (item.class_name || item.class) === 'bf-land' ? styles.bfLand :
                          (item.class_name || item.class) === 'bf-drought' ? styles.bfDrought : styles.bfQuake
                        }`}
                        initial={{ width: 0 }}
                        whileInView={{ width: item.percentage }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: idx * 0.05 }}
                      >
                        <span className={styles.barValue}>{item.count}</span>
                      </motion.div>
                    </div>
                    <div className={styles.trendWrapper}>
                      {getEventTrend(item.label)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Economic Losses Chart - Wide Column */}
          <div className={styles.wideCard}>
            <ScrollReveal direction="up" delay={0.1}>
              <LossChart data={lossesData} />
            </ScrollReveal>
          </div>

          {/* Donut Loss Share */}
          <ScrollReveal direction="up" delay={0.2} className={styles.dashCardReveal}>
            <DonutChart data={shareData} />
          </ScrollReveal>

          {/* Monsoon Rainfall Heatmap */}
          <ScrollReveal direction="up" delay={0.3} className={styles.dashCardReveal}>
            <Heatmap data={heatmapData} />
          </ScrollReveal>
        </div>
      </section>

      {/* TWO PILLARS FRAMEWORK */}
      <section className={styles.sectionAlt}>
        <ScrollReveal direction="up">
          <div className={styles.sectionHeader} style={{ textAlign: 'center' }}>
            <div className={styles.sectionEyebrow}>Our Framework</div>
            <h2 className={styles.sectionTitle}>Two Pillars of DCRF</h2>
            <p className={styles.sectionSub} style={{ margin: '0 auto' }}>
              DCRF operates across two core institutional lines — coordinating policies and standards for national resilience alongside driving flagship convergence conclaves.
            </p>
          </div>
        </ScrollReveal>

        <div className={styles.pillarsGrid}>
          <ScrollReveal direction="right" delay={0.1}>
            <div className={styles.pillarCard}>
              <div className={styles.pillarNum}>I</div>
              <h3>Climate Federation Backbone</h3>
              <p>
                A multi-stakeholder institutional platform unifying corporates, NGOs, academic institutions and government bodies. Defines the sector’s collective advocacy voice, coordinating working groups, guidelines, and annual policy status indices.
              </p>
              <div className={styles.ptags}>
                <span className={styles.tag}>National Working Groups</span>
                <span className={styles.tag}>Corporate Bylaws</span>
                <span className={styles.tag}>Advocacy Briefings</span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={0.2}>
            <div className={styles.pillarCard}>
              <div className={styles.pillarNum}>II</div>
              <h3>Annual Resilience Conclave</h3>
              <p>
                India’s premier convening summit on climate action — a hybrid conference gathering policy makers, disaster technologists, and communities. Launches research indices and coordinates technical showcases and partnership deals.
              </p>
              <div className={styles.ptags}>
                <span className={styles.tag}>Conference & Panels</span>
                <span className={styles.tag}>Disaster-Tech Expo</span>
                <span className={styles.tag}>Federation Awards</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FLAGSHIP EVENT (DCRC 2026) SPOTLIGHT */}
      <section className={styles.section}>
        <div className={styles.eventSec}>
          <ScrollReveal direction="up">
            <div className={styles.eventHero}>
              <div>
                <div className={styles.eventEyebrow}>Flagship Conclave • New Delhi</div>
                <h3>Disaster & Climate Resilience Conclave 2026</h3>
                <p>
                  Gathering India’s foremost disaster managers, sustainability leaders, and government directors. Re-directing CSR capital towards local-level mitigation and technology deployments.
                </p>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '20px' }}>
                  <Link href="/event" className={styles.btnPrimary}>
                    View Conclave Details
                    <Calendar size={14} />
                  </Link>
                  <Link href="/event#register" className={styles.btnOutline}>
                    Register Interest
                  </Link>
                </div>
              </div>
              <div className={styles.ebox}>
                <div className={styles.eboxMonth}>November</div>
                <div className={styles.eboxDay}>26 / 27</div>
                <div className={styles.eboxYear}>2026 • New Delhi</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className={styles.ctaSec}>
        <ScrollReveal direction="up">
          <h2>Join India’s Resilience Movement</h2>
          <p>
            Unifying resources, technology, and community networks to safeguard vulnerable populations from climate hazards. Join our tiered membership network today.
          </p>
          <div className={styles.ctaBtns}>
            <Link href="/membership" className={styles.btnPrimary}>
              Explore Membership Tiers
              <Users size={16} />
            </Link>
            <a href="mailto:dcrf@thecsruniverse.com" className={styles.btnOutline}>
              Write to the Secretariat
              <Globe size={16} />
            </a>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
