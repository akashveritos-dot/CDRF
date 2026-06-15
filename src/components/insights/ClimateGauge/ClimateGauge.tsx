import React, { useState, useEffect } from 'react';
import styles from './ClimateGauge.module.css';
import { motion } from 'framer-motion';
import { useTelemetry } from '@/context/TelemetryContext';

export default function ClimateGauge() {
  const { data } = useTelemetry();
  const warmingStat = data.heroStats?.find((s: any) => s.id === 'warming');
  const baseAnomaly = warmingStat ? parseFloat(warmingStat.count) : 2.10;

  const [anomaly, setAnomaly] = useState(baseAnomaly);
  const maxValue = 3.0;

  useEffect(() => {
    setAnomaly(baseAnomaly);
  }, [baseAnomaly]);

  useEffect(() => {
    const fluctuationInterval = setInterval(() => {
      setAnomaly(() => {
        const change = (Math.random() - 0.5) * 0.02;
        return parseFloat((baseAnomaly + change).toFixed(2));
      });
    }, 4000);

    return () => clearInterval(fluctuationInterval);
  }, [baseAnomaly]);

  
  // Calculate angle for needle: -90deg (0°C) to +90deg (+3°C)
  const rotationAngle = (anomaly / maxValue) * 180 - 90;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>India Temperature Anomaly</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pulse-dot" style={{ width: '8px', height: '8px', boxShadow: '0 0 8px var(--red-primary)' }} />
          <span className={styles.badge}>Live Anomaly: +{anomaly.toFixed(2)}°C</span>
        </div>
      </div>

      <div className={styles.gaugeContainer}>
        <svg viewBox="0 0 200 110" className={styles.svg}>
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3498db" />
              <stop offset="40%" stopColor="#f1c40f" />
              <stop offset="70%" stopColor="#e67e22" />
              <stop offset="100%" stopColor="#c0392b" />
            </linearGradient>
          </defs>

          {/* Gauge Track */}
          <path
            d="M 20,90 A 80,80 0 0,1 180,90"
            className={styles.gaugeTrack}
          />

          {/* Gauge Fill (Optional visual highlight or track outline) */}
          <path
            d="M 20,90 A 80,80 0 0,1 180,90"
            className={styles.gaugeFill}
          />

          {/* Needle Pin base */}
          <circle cx="100" cy="90" r="10" className={styles.centerPin} />

          {/* Animated Needle */}
          <motion.line
            x1="100"
            y1="90"
            x2="100"
            y2="30"
            className={styles.needle}
            animate={{ rotate: rotationAngle }}
            transition={{
              type: 'spring',
              stiffness: 50,
              damping: 12
            }}
          />

          {/* Needle Pin caps */}
          <circle cx="100" cy="90" r="4" fill="#0A1424" />
        </svg>

        <div className={styles.anomalyValue}>
          +{anomaly.toFixed(2)}
          <span style={{ fontSize: '20px', verticalAlign: 'super' }}>°C</span>
        </div>
        <div className={styles.anomalyLabel}>
          Above pre-industrial reference baseline (1951–1980)
        </div>

        <div className={styles.scaleLabels}>
          <span>0°C</span>
          <span>+1°C</span>
          <span>+2°C</span>
          <span>+3°C</span>
        </div>
      </div>

      <div className={styles.footerText}>
        India has warmed faster than the global average. The five hottest years on record have occurred
        after 2015. Monsoon cycles show 35% more extreme rainfall events paired with prolonged drought gaps.
      </div>
    </div>
  );
}
