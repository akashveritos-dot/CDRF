'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './page.module.css';
import {
  heroStats as fallbackHeroStats,
  cityTemps as fallbackCityTemps,
  disasterEvents as fallbackDisasterEvents,
  partners,
  councilMembers as fallbackCouncilMembers
} from '@/data/dataStore';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import CountUp from '@/components/ui/CountUp/CountUp';
import DisasterBackground from '@/components/ui/DisasterBackground/DisasterBackground';
import DynamicSkyBackground from '@/components/ui/DynamicSkyBackground/DynamicSkyBackground';
import DisasterEffects from '@/components/ui/DisasterEffects/DisasterEffects';
import WordTypingEffect from '@/components/ui/WordTypingEffect/WordTypingEffect';
import IndiaMap from '@/components/insights/IndiaMap/IndiaMap';
import ClimateGauge from '@/components/insights/ClimateGauge/ClimateGauge';
import LossChart from '@/components/insights/LossChart/LossChart';
import DonutChart from '@/components/insights/DonutChart/DonutChart';
import Heatmap from '@/components/insights/Heatmap/Heatmap';
import {
  Shield,
  ArrowRight,
  Calendar,
  Users,
  FileText,
  Globe,
  Waves,
  Flame,
  Wind,
  Mountain,
  Droplets,
  Activity,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  Thermometer,
  ShieldAlert,
  Download,
  Linkedin
} from 'lucide-react';

const categoryFallbacks: Record<string, string> = {
  earthquake: 'https://images.unsplash.com/photo-1594897030264-ab7d87efc473?auto=format&fit=crop&w=800&q=80',
  flood: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?auto=format&fit=crop&w=800&q=80',
  wildfire: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=800&q=80',
  cyclone: 'https://images.unsplash.com/photo-1527482797697-8795b05a133d?auto=format&fit=crop&w=800&q=80',
  storm: 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=800&q=80',
  landslide: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  drought: 'https://images.unsplash.com/photo-1473116763269-b552f58d6f67?auto=format&fit=crop&w=800&q=80',
  climate: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
  environment: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80',
  sustainability: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
  breaking: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
};

const getRelativeTime = (dateString: string) => {
  try {
    const pubDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - pubDate.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) {
      return pubDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (diffDays > 1) return `${diffDays} days ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffHours >= 1) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins >= 1) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  } catch (e) {
    return 'Recently';
  }
};

const getCategoryIcon = (tag: string) => {
  switch (tag?.toLowerCase()) {
    case 'flood':
    case 'floods':
      return <Waves size={16} />;
    case 'earthquake':
    case 'earthquakes':
      return <Activity size={16} />;
    case 'wildfire':
    case 'wildfires':
      return <Flame size={16} />;
    case 'cyclone':
    case 'cyclones':
      return <Wind size={16} />;
    case 'landslide':
    case 'landslides':
      return <Mountain size={16} />;
    case 'drought':
    case 'droughts':
      return <Droplets size={16} />;
    case 'storm':
    case 'storms':
      return <Wind size={16} style={{ transform: 'rotate(45deg)' }} />;
    case 'climate':
      return <Thermometer size={16} />;
    default:
      return <FileText size={16} />;
  }
};

export default function Home() {
  const [stats, setStats] = useState<any[]>(fallbackHeroStats);
  const [temps, setTemps] = useState<any[]>(fallbackCityTemps);
  const [events, setEvents] = useState<any[]>(fallbackDisasterEvents);
  const [lossesData, setLossesData] = useState<any[] | undefined>(undefined);
  const [shareData, setShareData] = useState<any[] | undefined>(undefined);
  const [heatmapData, setHeatmapData] = useState<number[][] | undefined>(undefined);
  const [councilMembers, setCouncilMembers] = useState<any[]>(fallbackCouncilMembers);

  // Dynamic statistics, news, and reports
  const [homeStats, setHomeStats] = useState<any>({
    activeIncidents: 705,
    countriesAffected: 6,
    reportsPublished: 6,
    disasterCategories: 10,
    alertsIssued: 7
  });
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [latestReports, setLatestReports] = useState<any[]>([]);

  useEffect(() => {
    async function loadTelemetry() {
      try {
        const res = await fetch('/api/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (data.heroStats) setStats(data.heroStats);
          if (data.disasterEvents) setEvents(data.disasterEvents);
          if (data.economicLosses) setLossesData(data.economicLosses);
          if (data.lossShare) setShareData(data.lossShare);
          if (data.heatmapData) setHeatmapData(data.heatmapData);
          if (data.homepageStats) setHomeStats(data.homepageStats);

          // Fetch real-time temperatures for Chennai, Delhi, Kolkata, and Mumbai from Open-Meteo
          try {
            const weatherRes = await fetch(
              'https://api.open-meteo.com/v1/forecast?latitude=13.0827,28.6139,22.5726,19.0760&longitude=80.2707,77.2090,88.3639,72.8777&current=temperature_2m'
            );
            if (weatherRes.ok) {
              const weatherData = await weatherRes.json();
              if (Array.isArray(weatherData)) {
                const updatedTemps = [
                  {
                    city: 'Chennai',
                    temp: Math.round(weatherData[0].current.temperature_2m),
                    percentage: Math.round((weatherData[0].current.temperature_2m / 50) * 100)
                  },
                  {
                    city: 'Delhi',
                    temp: Math.round(weatherData[1].current.temperature_2m),
                    percentage: Math.round((weatherData[1].current.temperature_2m / 50) * 100)
                  },
                  {
                    city: 'Kolkata',
                    temp: Math.round(weatherData[2].current.temperature_2m),
                    percentage: Math.round((weatherData[2].current.temperature_2m / 50) * 100)
                  },
                  {
                    city: 'Mumbai',
                    temp: Math.round(weatherData[3].current.temperature_2m),
                    percentage: Math.round((weatherData[3].current.temperature_2m / 50) * 100)
                  }
                ];
                updatedTemps.sort((a, b) => b.temp - a.temp);
                setTemps(updatedTemps);
              } else if (data.cityTemps) {
                const sortedTemps = [...data.cityTemps].sort((a, b) => b.temp - a.temp);
                setTemps(sortedTemps);
              }
            } else if (data.cityTemps) {
              const sortedTemps = [...data.cityTemps].sort((a, b) => b.temp - a.temp);
              setTemps(sortedTemps);
            }
          } catch (weatherErr) {
            console.warn('Failed to fetch real-time city temperatures:', weatherErr);
            if (data.cityTemps) {
              const sortedTemps = [...data.cityTemps].sort((a, b) => b.temp - a.temp);
              setTemps(sortedTemps);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch home telemetry API:', err);
      }
    }

    async function loadContent() {
      try {
        const [newsRes, reportsRes, councilRes] = await Promise.all([
          fetch('/api/news'),
          fetch('/api/reports'),
          fetch('/api/councils')
        ]);
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          setLatestNews(newsData.slice(0, 3));
        }
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setLatestReports(reportsData.slice(0, 3));
        }
        if (councilRes.ok) {
          const councilData = await councilRes.json();
          if (councilData && councilData.length > 0) {
            setCouncilMembers(councilData);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch content feeds:', err);
      }
    }

    loadTelemetry();
    loadContent();
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

  const dashboardStatsList = [
    { id: 'incidents', count: homeStats.activeIncidents, suffix: '+', label: 'Active Incidents' },
    { id: 'countries', count: homeStats.countriesAffected, suffix: '', label: 'Countries Affected' },
    { id: 'reports', count: homeStats.reportsPublished, suffix: '+', label: 'Reports Published' },
    { id: 'alerts', count: homeStats.alertsIssued, suffix: '+', label: 'Alerts Issued' }
  ];



  return (
    <div>
      <DisasterEffects theme="general" intensity="low" />
      {/* HERO SECTION - REDESIGNED PREMIUM LIGHT THEME */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />

        <div className={styles.heroContent}>
          <ScrollReveal direction="up" delay={0.1}>
            <div className={styles.heroEyebrow}>
              <Shield size={12} style={{ color: 'var(--red-primary)' }} />
              Founded 2026 • New Delhi, India
            </div>
            <h1>
              <WordTypingEffect />
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
                Explore Command Dashboard
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={0.3}>
            <div className={`${styles.heroPanel} ${styles.heroPanelLight}`}>
              <div className={styles.panelTitle}>
                <span className="pulse-dot sonar-emitter">
                  <span className="sonar-pulse" />
                </span>
                India Climate Monitor • Live telemetry
              </div>

              <div className={styles.dstatGrid}>
                {stats.map((stat) => (
                  <div key={stat.id} className={styles.dstat}>
                    <div className={`${styles.dstatNum} ${stat.type === 'red' ? styles.numRed :
                      stat.type === 'amber' ? styles.numAmber :
                        stat.type === 'teal' ? styles.numTeal : styles.numBlue
                      }`}>
                      <CountUp end={stat.count} suffix={stat.suffix} decimals={stat.count % 1 !== 0 ? 1 : 0} />
                    </div>
                    <div className={styles.dstatLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className={styles.tempsHeader}>Heat Index — Major Cities</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {temps.map((city) => (
                  <div key={city.city} className={styles.tempRow}>
                    <span className={styles.tempCity}>{city.city}</span>
                    <div className={styles.tempBarWrap}>
                      <motion.div
                        className={styles.tempBarFill}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${city.percentage}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                    </div>
                    <span className={styles.tempVal}>{city.temp}°C</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* STATS STRIP SECTION - DYNAMIC COUNTERS */}
      <section className={styles.statsStrip}>
        {dashboardStatsList.map((stat, idx) => (
          <div key={stat.id} className={styles.stripStat}>
            <div className={styles.stripNum}>
              <CountUp end={stat.count} suffix={stat.suffix} />
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
                        className={`${styles.barFill} ${(item.class_name || item.class) === 'bf-floods' ? styles.bfFloods :
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

      {/* LATEST NEWS FEED SECTION */}
      <section className={styles.sectionAlt}>
        <ScrollReveal direction="up">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>Live Broadcast</div>
            <h2 className={styles.sectionTitle}>Syndicated Emergency News</h2>
            <p className={styles.sectionSub}>
              Real-time monitoring feeds scraped directly from PIB, ReliefWeb, and vetted disaster management agencies.
            </p>
          </div>
        </ScrollReveal>

        <div className={styles.feedGrid}>
          {latestNews.length > 0 ? (
            latestNews.map((story, idx) => {
              const fallbackImg = categoryFallbacks[story.category?.toLowerCase()] || categoryFallbacks.breaking;
              return (
                <ScrollReveal key={story.id} direction="up" delay={idx * 0.1}>
                  <div className={styles.feedCard}>
                    <div className={styles.feedCardImgWrapper}>
                      <img
                        src={story.image_url || fallbackImg}
                        alt={story.headline}
                        className={styles.feedCardImg}
                        onError={(e) => { (e.target as HTMLImageElement).src = fallbackImg; }}
                      />
                      <span className={styles.feedCardCategory}>
                        {story.category || 'Alert'}
                      </span>
                    </div>
                    <div className={styles.feedCardBody}>
                      <div className={styles.feedCardMeta}>
                        <span className={styles.feedCardSource}>{story.source}</span>
                        <span>•</span>
                        <span>{getRelativeTime(story.published_date)}</span>
                        {story.location && (
                          <>
                            <span>•</span>
                            <span className={styles.feedCardLocation}>{story.location}</span>
                          </>
                        )}
                      </div>
                      <h3 className={styles.feedCardTitle}>{story.headline}</h3>
                      <p className={styles.feedCardExcerpt}>{story.excerpt}</p>
                      <a
                        href={story.external_link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.feedCardBtn}
                      >
                        Read Original Article
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })
          ) : (
            <div className={styles.emptyFeed}>
              <span className="pulse-dot" style={{ marginRight: '8px' }} />
              Synchronizing with emergency news portals...
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link href="/news" className={styles.btnOutline}>
            View All Broadcasts <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* LATEST REPORTS SECTION */}
      <section className={styles.section}>
        <ScrollReveal direction="up">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>Publications</div>
            <h2 className={styles.sectionTitle}>Latest Intelligence Reports</h2>
            <p className={styles.sectionSub}>
              Vetted scientific analyses, disaster risk assessments, and policy briefs published by DCRF Secretariat.
            </p>
          </div>
        </ScrollReveal>

        <div className={styles.reportsListGrid}>
          {latestReports.length > 0 ? (
            latestReports.map((report, idx) => (
              <ScrollReveal key={report.id} direction="up" delay={idx * 0.1}>
                <div className={styles.premiumReportCard}>
                  <div className={styles.reportAccentStrip} style={{ background: `linear-gradient(135deg, var(--gold-primary), ${report.accent_color || 'var(--red-primary)'})` }} />
                  <div className={styles.reportCategoryBadge}>{report.category}</div>
                  <h3>{report.title}</h3>
                  <p className={styles.reportDesc}>{report.description}</p>

                  <div className={styles.reportMetaGrid}>
                    <div>
                      <strong>Source:</strong> <span>{report.source || 'DCRF'}</span>
                    </div>
                    <div>
                      <strong>Region:</strong> <span>{report.region || 'National'}</span>
                    </div>
                    <div>
                      <strong>Hazard:</strong> <span>{report.disaster_type || 'General'}</span>
                    </div>
                    <div>
                      <strong>Severity:</strong> <span>{report.severity_level || 'Medium'}</span>
                    </div>
                  </div>

                  <div className={styles.reportFooter}>
                    <span className={styles.reportPages}>{report.year} • {report.page_count} pages</span>
                    <a
                      href={report.download_url || '#'}
                      className={styles.reportDownloadBtn}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download size={14} />
                      View Document
                    </a>
                  </div>
                </div>
              </ScrollReveal>
            ))
          ) : (
            <div className={styles.emptyFeed}>
              Syncing publications database...
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link href="/reports" className={styles.btnOutline}>
            Browse Publications Library <ArrowRight size={14} />
          </Link>
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

      {/* GOVERNING COUNCIL SECTION */}
      <section className={styles.sectionAlt}>
        <ScrollReveal direction="up">
          <div className={styles.sectionHeader} style={{ textAlign: 'center' }}>
            <div className={styles.sectionEyebrow}>Leadership</div>
            <h2 className={styles.sectionTitle}>Governing &amp; Executive Council</h2>
            <p className={styles.sectionSub} style={{ margin: '0 auto' }}>
              DCRF is steered by a joint council combining academic research, corporate sustainability pipelines, and technical disaster risk analytics.
            </p>
          </div>
        </ScrollReveal>

        <div className={styles.councilGrid}>
          {councilMembers.map((member, idx) => {
            const isHighlight = member.id === 'bm';
            const [imageError, setImageError] = React.useState(false);

            return (
              <ScrollReveal key={member.id} direction="up" delay={0.05 * idx}>
                <div className={`${styles.councilCard} ${isHighlight ? styles.councilCardHighlight : ''}`}>
                  <div className={styles.councilProfileHeader}>
                    <div className={`${styles.councilAvatar} ${isHighlight ? styles.councilAvatarGold : ''}`}>
                      {member.profileImage && !imageError ? (
                        <img
                          src={member.profileImage}
                          alt={member.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }}
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        member.avatarInitials
                      )}
                    </div>
                    <div className={styles.councilIdentity}>
                      <h3>{member.name}</h3>
                      <span className={`${styles.councilBadge} ${member.roleBadgeColor === 'gold' ? styles.councilBadgeGold :
                        member.roleBadgeColor === 'finance' ? styles.councilBadgeFinance : ''
                        }`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                  <p className={styles.councilBio}>{member.bio}</p>
                  {member.linkedinUrl ? (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.councilLinkedin}
                    >
                      <Linkedin size={12} fill="currentColor" stroke="none" />
                      LinkedIn Profile
                    </a>
                  ) : (
                    <span className={styles.councilOrgMuted}>{member.organization}</span>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <Link href="/council" className={styles.btnOutline}>
            View Full Council <ArrowRight size={14} />
          </Link>
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

