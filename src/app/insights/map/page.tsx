'use client';

import React from 'react';
import IndiaMap from '@/components/insights/IndiaMap/IndiaMap';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import PageHero from '@/components/ui/PageHero/PageHero';
import styles from './page.module.css';
import { Activity, Satellite, Thermometer, Waves } from 'lucide-react';

const legendItems = [
  { color: '#dc2626', label: 'Extreme Heat Stress', desc: '> 45°C sustained' },
  { color: '#f97316', label: 'High Flood Risk', desc: 'Discharge > 80th pct' },
  { color: '#7c3aed', label: 'Cyclone Zone', desc: 'Coastal alert active' },
  { color: '#0f766e', label: 'Glacial Melt Watch', desc: 'GLOF monitoring' },
];

const indicators = [
  { icon: <Activity size={16} />, label: 'LIVE', value: 'Hazard Feed', color: '#b91c1c' },
  { icon: <Satellite size={16} />, label: 'ISRO RISAT', value: 'Sync: 8s', color: '#0f766e' },
  { icon: <Thermometer size={16} />, label: 'IMD Station', value: '847 nodes', color: '#b45309' },
  { icon: <Waves size={16} />, label: 'CWC Stream', value: '213 rivers', color: '#7c3aed' },
];

export default function InsightsMapPage() {
  return (
    <div className={styles.page}>
      {/* ── Premium hero ─────────────────────────────────────────── */}
      <ScrollReveal direction="down">
        <PageHero
          theme="reports"
          eyebrow="National Command · Telemetry"
          line1="DISASTER"
          line2="RISK MAP"
          subtitle="Interactive spatial visualization of real-time composite climate hazard levels, heat stress tags, and river flooding discharge indexes across Indian states."
        />
      </ScrollReveal>

      {/* ── Data source indicators ────────────────────────────────── */}
      <ScrollReveal direction="up" delay={0.08}>
        <div className={styles.indicatorBar}>
          {indicators.map((ind, i) => (
            <div key={i} className={styles.indicator}>
              <span className={styles.indicatorIcon} style={{ color: ind.color }}>{ind.icon}</span>
              <div>
                <span className={styles.indicatorLabel} style={{ color: ind.color }}>{ind.label}</span>
                <span className={styles.indicatorValue}>{ind.value}</span>
              </div>
            </div>
          ))}
          <div className={styles.pulseDot}>
            <span className={styles.pulseRing} />
            <span className={styles.pulseCore} />
          </div>
        </div>
      </ScrollReveal>

      {/* ── Map display ───────────────────────────────────────────── */}
      <ScrollReveal direction="up" delay={0.12}>
        <div className={styles.mapContainer}>
          <div className={styles.mapHeader}>
            <span className={styles.mapTitle}>Composite Disaster Risk · India</span>
            <span className={styles.mapCoords}>28.6139° N · 77.2090° E</span>
          </div>
          <IndiaMap />
        </div>
      </ScrollReveal>

      {/* ── Legend ────────────────────────────────────────────────── */}
      <ScrollReveal direction="up" delay={0.15}>
        <div className={styles.legend}>
          {legendItems.map((item, i) => (
            <div key={i} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: item.color }} />
              <div>
                <span className={styles.legendLabel}>{item.label}</span>
                <span className={styles.legendDesc}>{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}
