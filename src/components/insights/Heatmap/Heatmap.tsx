'use client';

import React from 'react';
import styles from './Heatmap.module.css';
import { heatmapData, heatmapYears, heatmapMonths } from '@/data/dataStore';

// Exact color palette from reference.html
const intensityColors = [
  '#EDF2F8', // Low intensity / baseline (1)
  '#BDD7EE', // (2)
  '#90BDE0', // (3)
  '#5DA0CE', // (4)
  '#3182BE', // (5)
  '#1A5A96', // (6)
  '#0D3F73'  // Extreme intensity (7+)
];

interface HeatmapProps {
  data?: number[][];
}

export default function Heatmap({ data }: HeatmapProps) {
  const getCellColor = (val: number) => {
    // Map value (1-10) to colors length (0-6)
    const colorIndex = Math.min(Math.floor((val / 10) * intensityColors.length), intensityColors.length - 1);
    return intensityColors[colorIndex];
  };

  if (!data) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.title}>Monsoon Rainfall Intensity Heatmap</span>
          <span className={styles.badge}>IMD Gridded Data</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <div className="pulse-dot" style={{ width: '8px', height: '8px', marginRight: '8px' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading chart telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Monsoon Rainfall Intensity Heatmap</span>
        <span className={styles.badge}>IMD Gridded Data</span>
      </div>

      <div className={styles.heatmapWrapper}>
        {/* Months Label Row */}
        <div className={styles.monthsRow}>
          {heatmapMonths.map((m) => (
            <span key={m} className={styles.monthLabel}>
              {m}
            </span>
          ))}
        </div>

        {/* Heatmap Grid Cells */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {data.map((row, rowIndex) => {
            const year = heatmapYears[rowIndex];
            return (
              <div key={year} className={styles.yearRow}>
                {row.map((val, cellIndex) => {
                  const month = heatmapMonths[cellIndex];
                  return (
                    <div
                      key={`${year}-${month}`}
                      className={styles.cell}
                      style={{ backgroundColor: getCellColor(val) }}
                    >
                      {/* Interactive hover tooltip inside each cell */}
                      <span className={styles.tooltip}>
                        {month} {year}: Severity {val}/10
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legend / Gradient Indicator bar */}
        <div className={styles.indicatorBar}>
          <span className={styles.indicatorText}>Normal</span>
          <div className={styles.gradientBar} />
          <span className={styles.indicatorText}>Extreme Rain</span>
        </div>
      </div>
    </div>
  );
}
