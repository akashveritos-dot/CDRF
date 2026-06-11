'use client';

import React from 'react';
import styles from './TickerBar.module.css';
import { tickerAlerts } from '@/data/dataStore';
import { AlertTriangle } from 'lucide-react';

export default function TickerBar() {
  // Double alerts to make infinite scroll smooth
  const doubleAlerts = [...tickerAlerts, ...tickerAlerts];

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
              <span key={`${alert.id}-${index}`}>{alert.text}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
