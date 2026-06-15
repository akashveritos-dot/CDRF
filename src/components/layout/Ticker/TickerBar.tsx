'use client';

import React from 'react';
import styles from './TickerBar.module.css';
import { useTelemetry } from '@/context/TelemetryContext';
import { AlertTriangle } from 'lucide-react';

export default function TickerBar() {
  const { data } = useTelemetry();
  const alerts = data.tickerAlerts;

  // Double alerts to make infinite scroll smooth
  const doubleAlerts = [...alerts, ...alerts];

  return (
    <div className={styles.tickerBar}>
      <div className={styles.tickerInner}>
        <div className={styles.tickerLabel}>
          <AlertTriangle size={14} className={styles.warningIcon} />
          Live Updates
        </div>
        <div className={styles.tickerTrack}>
          <div className={styles.tickerItems}>
            {doubleAlerts.map((alert, index) => (
              <span key={`${alert.id || index}-${index}`}>{alert.text}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

