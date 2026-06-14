'use client';

import React from 'react';
import IndiaMap from '@/components/insights/IndiaMap/IndiaMap';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import styles from './page.module.css';

export default function InsightsMapPage() {
  return (
    <div className={styles.page}>
      {/* Header section */}
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <h1 className={styles.title}>Composite Disaster Risk Map</h1>
          <p style={{ color: 'var(--wine-red-primary)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            National Command & Telemetry Coordinates
          </p>
          <p className={styles.subtitle}>
            Interactive spatial visualization displaying real-time composite climate hazard levels, heat stress tags, and river flooding discharge indexes across Indian states.
          </p>
        </div>
      </ScrollReveal>

      {/* Map display block */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className={styles.mapContainer}>
          {/* High-tech tech bar */}
          <div className={styles.techStatusBar}>
            <div className={styles.pulseWrapper}>
              <div className="pulse-dot" />
              <span className="monospaced-tel" style={{ color: 'var(--wine-red-primary)' }}>SEC_OPERATIONS_ACTIVE • LIVE HAZARD DATA</span>
            </div>
            <div className="monospaced-tel">
              LAT: 28.6139° N | LON: 77.2090° E • METEO_POLLING: 8s
            </div>
          </div>
          
          {/* Main IndiaMap Vector Component */}
          <IndiaMap />
        </div>
      </ScrollReveal>
    </div>
  );
}
