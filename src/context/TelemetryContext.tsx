'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  tickerAlerts as fallbackTickerAlerts,
  heroStats as fallbackHeroStats,
  cityTemps as fallbackCityTemps,
  disasterEvents as fallbackDisasterEvents,
  economicLosses as fallbackEconomicLosses,
  lossShare as fallbackLossShare,
  heatmapData as fallbackHeatmapData
} from '@/data/dataStore';

interface TelemetryData {
  tickerAlerts: any[];
  heroStats: any[];
  cityTemps: any[];
  disasterEvents: any[];
  economicLosses: any[];
  lossShare: any[];
  stateHazards: any[];
  heatmapData: number[][];
  homepageStats: {
    activeIncidents: number;
    countriesAffected: number;
    reportsPublished: number;
    disasterCategories: number;
    alertsIssued: number;
  };
}

interface TelemetryContextValue {
  data: TelemetryData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

const DEFAULT_STATE: TelemetryData = {
  tickerAlerts: fallbackTickerAlerts.map(a => ({ id: Number(a.id), text: a.text })),
  heroStats: fallbackHeroStats,
  cityTemps: fallbackCityTemps,
  disasterEvents: fallbackDisasterEvents,
  economicLosses: fallbackEconomicLosses,
  lossShare: fallbackLossShare,
  stateHazards: [],
  heatmapData: fallbackHeatmapData,
  homepageStats: {
    activeIncidents: 705,
    countriesAffected: 6,
    reportsPublished: 6,
    disasterCategories: 10,
    alertsIssued: 7
  }
};

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TelemetryData>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const json = await res.json();
        if (json && typeof json === 'object' && !json.error) {
          setData({
            tickerAlerts: json.tickerAlerts || DEFAULT_STATE.tickerAlerts,
            heroStats: json.heroStats || DEFAULT_STATE.heroStats,
            cityTemps: json.cityTemps || DEFAULT_STATE.cityTemps,
            disasterEvents: json.disasterEvents || DEFAULT_STATE.disasterEvents,
            economicLosses: json.economicLosses || DEFAULT_STATE.economicLosses,
            lossShare: json.lossShare || DEFAULT_STATE.lossShare,
            stateHazards: json.stateHazards || DEFAULT_STATE.stateHazards,
            heatmapData: json.heatmapData || DEFAULT_STATE.heatmapData,
            homepageStats: json.homepageStats || DEFAULT_STATE.homepageStats
          });
          setError(null);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || 'Failed to load telemetry');
      }
    } catch (err) {
      console.warn('Telemetry fetch error:', err);
      setError('Network error loading telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();

    // Set up a background polling interval (every 15 seconds) to ensure fresh metrics
    const interval = setInterval(fetchTelemetry, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TelemetryContext.Provider value={{ data, loading, error, refetch: fetchTelemetry }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return ctx;
}
