'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, RefreshCw, Home, Terminal } from 'lucide-react';
import styles from './error.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    console.error('DCRS Application Fault:', error);
  }, [error]);

  return (
    <div className={styles.container}>
      {/* Seismograph / Seismic Wave Disaster Animation */}
      <div className={styles.animationWrapper}>
        <div className={styles.seismicGrid}>
          <div className={styles.pulseWave} />
          <div className={styles.pulseWaveSlow} />
          <div className={styles.scannerLine} />
        </div>
        <div className={styles.iconBox}>
          <ShieldAlert size={36} className={styles.alertIcon} />
        </div>
      </div>

      <div className={styles.content}>
        <span className={styles.telemetryTag}>SYS_CRITICAL • TELEMETRY_FAULT_500</span>
        <h1 className={styles.title}>System Disruption</h1>
        <p className={styles.message}>
          A severe telemetry mismatch or data stream interruption occurred. DCRF Node monitoring services have flagged a structural anomaly.
        </p>

        {/* Diagnostic Terminal Panel */}
        <div className={styles.terminal}>
          <div className={styles.terminalHeader}>
            <div className={styles.dotRed} />
            <div className={styles.dotYellow} />
            <div className={styles.dotGreen} />
            <span className={styles.terminalTitle}>Diagnostics Console</span>
          </div>
          <div className={styles.terminalBody}>
            <p className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>$</span> status --check --node
            </p>
            <p className={styles.terminalResponse}>Checking node health... ERROR [STREAM_DISRUPTED]</p>
            <p className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>$</span> dump --error --digest
            </p>
            <p className={styles.terminalError}>
              Digest: {error.digest || 'DCRS_LOCAL_FAULT'}
            </p>
            <p className={styles.terminalError}>
              Message: {error.message || 'An unexpected error occurred during client-side rendering.'}
            </p>
          </div>
        </div>

        <div className={styles.btnRow}>
          <button onClick={() => reset()} className={styles.primaryBtn}>
            <RefreshCw size={15} className={styles.spinIcon} />
            Reset Stream (Retry)
          </button>
          <Link href="/" className={styles.secondaryBtn}>
            <Home size={15} />
            Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
