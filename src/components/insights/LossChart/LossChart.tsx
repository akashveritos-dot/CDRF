'use client';

import React from 'react';
import styles from './LossChart.module.css';
import { economicLosses } from '@/data/dataStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipTitle}>{label}</p>
        <p className={styles.tooltipValue}>
          Losses: {payload[0].value} Lakh Crore
        </p>
        <p style={{ color: 'var(--gray-500)', fontSize: '10px', marginTop: '2px' }}>
          *NDMA & World Bank joint estimates
        </p>
      </div>
    );
  }
  return null;
};

export default function LossChart() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Map values for chart compatibility
  const chartData = economicLosses.map((item) => ({
    name: item.year,
    Losses: item.value,
    display: item.display
  }));

  if (!mounted) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.title}>Economic Losses from Climate Disasters (₹ Lakh Crore)</span>
          <span className={styles.badge}>NDMA / World Bank</span>
        </div>
        <div className={styles.chartContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading chart telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Economic Losses from Climate Disasters (₹ Lakh Crore)</span>
        <span className={styles.badge}>NDMA / World Bank</span>
      </div>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="grad-2019" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5dade2" />
                <stop offset="100%" stopColor="#2980b9" />
              </linearGradient>
              <linearGradient id="grad-2020" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a569bd" />
                <stop offset="100%" stopColor="#6C3483" />
              </linearGradient>
              <linearGradient id="grad-2021" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5dade2" />
                <stop offset="100%" stopColor="#2980b9" />
              </linearGradient>
              <linearGradient id="grad-2022" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e67e22" />
                <stop offset="100%" stopColor="#D35400" />
              </linearGradient>
              <linearGradient id="grad-2023" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e74c3c" />
                <stop offset="100%" stopColor="#C0392B" />
              </linearGradient>
              <linearGradient id="grad-2024" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#922b21" />
                <stop offset="100%" stopColor="#641e16" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="var(--gray-500)"
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="var(--gray-500)"
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="Losses"
              radius={[6, 6, 0, 0]}
              animationDuration={1500}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#grad-${entry.name})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
