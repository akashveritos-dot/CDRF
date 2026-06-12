'use client';

import React from 'react';
import styles from './DonutChart.module.css';
import { lossShare } from '@/data/dataStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(7, 15, 27, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: '12px',
          color: 'var(--white)'
        }}
      >
        <span style={{ fontWeight: 600 }}>{payload[0].name}: </span>
        <span style={{ color: 'var(--gold-light)' }}>{payload[0].value}%</span>
      </div>
    );
  }
  return null;
};

export default function DonutChart() {
  const [mounted, setMounted] = React.useState(false);
  const [chartWidth, setChartWidth] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted || !containerRef.current) return;

    setChartWidth(containerRef.current.getBoundingClientRect().width || 160);

    const handleResize = () => {
      if (containerRef.current) {
        setChartWidth(containerRef.current.getBoundingClientRect().width);
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [mounted]);

  if (!mounted) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.title}>Economic Loss Share by Disaster (2024)</span>
          <span className={styles.badge}>% of Total Losses</span>
        </div>
        <div className={styles.chartContent} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading chart telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Economic Loss Share by Disaster (2024)</span>
        <span className={styles.badge}>% of Total Losses</span>
      </div>

      <div className={styles.chartContent}>
        {/* SVG Recharts Donut Pie */}
        <div ref={containerRef} className={styles.chartWrapper}>
          {chartWidth > 0 && (
            <PieChart width={chartWidth} height={chartWidth}>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={lossShare}
                cx="50%"
                cy="50%"
                innerRadius={chartWidth * 0.325} // Proportional scaling (52/160)
                outerRadius={chartWidth * 0.4375} // Proportional scaling (70/160)
                paddingAngle={3}
                dataKey="value"
                animationDuration={1500}
              >
                {lossShare.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          )}
          
          <div className={styles.chartCenterLabel}>
            <div className={styles.centerYear}>India</div>
            <div className={styles.centerValue}>2024</div>
          </div>
        </div>

        {/* Customized Legend Panel */}
        <div className={styles.legend}>
          {lossShare.map((item, index) => (
            <div key={`${item.name}-${index}`} className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: item.color }} />
              <div className={styles.legendText}>
                <span>{item.name}</span>
                <span className={styles.percentage}>{item.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
