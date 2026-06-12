'use client';

import React, { useState, useEffect } from 'react';
import styles from './TickerBar.module.css';
import { tickerAlerts as fallbackAlerts } from '@/data/dataStore';
import { AlertTriangle } from 'lucide-react';

export default function TickerBar() {
  const [alerts, setAlerts] = useState<any[]>(fallbackAlerts);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await fetch('/api/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (data.tickerAlerts && data.tickerAlerts.length > 0) {
            setAlerts(data.tickerAlerts);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch live alerts, using fallback.', err);
      }
    }
    loadAlerts();
  }, []);

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
