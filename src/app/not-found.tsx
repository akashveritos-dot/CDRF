'use client';

import React from 'react';
import Link from 'next/link';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      {/* Seismic / Radar Disaster Animation */}
      <div className={styles.animationWrapper}>
        <div className={styles.radarGrid} />
        <div className={styles.radarSweep} />
        <div className={styles.pulseRing} style={{ animationDelay: '0s' }} />
        <div className={styles.pulseRing} style={{ animationDelay: '0.8s' }} />
        <div className={styles.pulseRing} style={{ animationDelay: '1.6s' }} />
        <div className={styles.iconBox}>
          <AlertOctagon size={36} className={styles.warningIcon} />
        </div>
      </div>

      <div className={styles.content}>
        <span className={styles.telemetryTag}>SYS_CODE_404 • ROUTE_TERMINATED</span>
        <h1 className={styles.title}>Coordinates Lost</h1>
        <p className={styles.message}>
          The telemetry link for the requested sector has collapsed or does not exist. Verify your command coordinates.
        </p>

        <div className={styles.btnRow}>
          <Link href="/" className={styles.primaryBtn}>
            <Home size={15} />
            Command Center
          </Link>
          <button onClick={() => window.history.back()} className={styles.secondaryBtn}>
            <RotateCcw size={15} />
            Back to Safe Zone
          </button>
        </div>
      </div>
    </div>
  );
}
