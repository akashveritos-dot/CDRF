'use client';

import React, { useEffect, useState } from 'react';
import styles from './DisasterEffects.module.css';

interface DisasterEffectsProps {
  theme?: 'flood' | 'fire' | 'storm' | 'earthquake' | 'general';
  intensity?: 'low' | 'medium' | 'high';
}

const DisasterEffects: React.FC<DisasterEffectsProps> = ({ 
  theme = 'general', 
  intensity = 'medium' 
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const particleCount = intensity === 'low' ? 15 : intensity === 'medium' ? 30 : 50;

  return (
    <div className={styles.effectsContainer} aria-hidden="true">
      {/* Rain/Water Drops for Flood Theme */}
      {(theme === 'flood' || theme === 'general') && (
        <div className={styles.rainContainer}>
          {[...Array(particleCount)].map((_, i) => (
            <div
              key={`rain-${i}`}
              className={styles.rainDrop}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                opacity: 0.3 + Math.random() * 0.4
              }}
            />
          ))}
        </div>
      )}

      {/* Ember/Fire Particles for Fire Theme */}
      {theme === 'fire' && (
        <div className={styles.emberContainer}>
          {[...Array(Math.floor(particleCount / 2))].map((_, i) => (
            <div
              key={`ember-${i}`}
              className={styles.ember}
              style={{
                left: `${Math.random() * 100}%`,
                bottom: `${-10 - Math.random() * 20}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Smoke/Dust Particles */}
      {(theme === 'general' || theme === 'fire' || theme === 'storm') && (
        <div className={styles.smokeContainer}>
          {[...Array(Math.floor(particleCount / 3))].map((_, i) => (
            <div
              key={`smoke-${i}`}
              className={styles.smokeParticle}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Shake Effect for Earthquake */}
      {theme === 'earthquake' && (
        <div className={styles.earthquakeOverlay} />
      )}

      {/* Alert Pulse Effect */}
      <div className={styles.alertPulse}>
        <div className={styles.pulseRing} />
        <div className={styles.pulseRing} style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};

export default DisasterEffects;
