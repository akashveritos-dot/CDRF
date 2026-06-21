'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './AnimatedStats.module.css';

export interface StatItem {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  description?: string;
  color?: string;
}

interface AnimatedStatsProps {
  stats: StatItem[];
}

function useCountUp(target: number, duration = 1800, shouldStart = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!shouldStart) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, shouldStart]);
  return count;
}

function StatCard({ stat, trigger }: { stat: StatItem; trigger: boolean }) {
  const count = useCountUp(stat.value, 1600, trigger);
  return (
    <div className={styles.card} style={{ '--color': stat.color || '#b91c1c' } as React.CSSProperties}>
      <div className={styles.ring}>
        <svg viewBox="0 0 80 80" className={styles.svg}>
          <circle cx="40" cy="40" r="34" className={styles.track} />
          <circle cx="40" cy="40" r="34" className={styles.fill}
            strokeDasharray={`${trigger ? 213 : 0} 213`} />
        </svg>
        <div className={styles.number}>
          {stat.prefix && <span className={styles.affix}>{stat.prefix}</span>}
          {count.toLocaleString('en-IN')}
          {stat.suffix && <span className={styles.affix}>{stat.suffix}</span>}
        </div>
      </div>
      <div className={styles.label}>{stat.label}</div>
      {stat.description && <p className={styles.desc}>{stat.description}</p>}
    </div>
  );
}

export default function AnimatedStats({ stats }: AnimatedStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTriggered(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.grid}>
      {stats.map((s, i) => (
        <StatCard key={i} stat={s} trigger={triggered} />
      ))}
    </div>
  );
}
