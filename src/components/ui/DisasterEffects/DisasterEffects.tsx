'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import styles from './DisasterEffects.module.css';

interface DisasterEffectsProps {
  theme?: 'flood' | 'fire' | 'storm' | 'earthquake' | 'general';
  intensity?: 'low' | 'medium' | 'high';
}

interface CachedWeather {
  locationName: { city: string; state: string };
  liveTheme: 'flood' | 'storm' | null;
  temperature: number | null;
  timestamp: number;
}

declare global {
  interface Window {
    __dcrsWeatherPromise?: Promise<CachedWeather>;
    __dcrsWeatherData?: CachedWeather;
  }
}

const DisasterEffects: React.FC<DisasterEffectsProps> = ({ 
  theme = 'general', 
  intensity = 'medium' 
}) => {
  const [mounted, setMounted] = useState(false);
  const [liveTheme, setLiveTheme] = useState<'flood' | 'storm' | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<{ city: string; state: string }>({
    city: 'New Delhi',
    state: 'Delhi'
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const cacheKey = 'dcrs_weather_data_cache';

    const getWeatherData = async (): Promise<CachedWeather> => {
      const params = new URLSearchParams(window.location.search);
      const queryWeather = params.get('weather');
      const queryCity = params.get('city');
      const queryState = params.get('state') || params.get('region');

      let lat = 28.6139;
      let lng = 77.2090;
      let city = 'New Delhi';
      let state = 'Delhi';

      // Resolve coordinates and location details
      if (queryCity) {
        city = queryCity;
        state = queryState || '';
        console.log(`DisasterEffects: Location overridden to [${city}, ${state}] via URL parameters.`);
      } else {
        try {
          const geoRes = await fetch('https://ipapi.co/json/');
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData?.country_code === 'IN') {
              city = geoData.city || 'New Delhi';
              state = geoData.region || 'Delhi';
              lat = geoData.latitude || 28.6139;
              lng = geoData.longitude || 77.2090;
              console.log(`DisasterEffects: Resolved user location: ${city}, ${state}`);
            }
          }
        } catch (e) {
          console.warn('DisasterEffects: Geolocation fetch failed, using default New Delhi coordinates.');
        }
      }

      // Fetch weather code and temp for the resolved coordinates
      let temp: number | null = null;
      let mappedTheme: 'flood' | 'storm' | null = null;

      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=Asia/Kolkata`;
        const weatherRes = await fetch(weatherUrl);
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          const code = weatherData?.current?.weather_code;
          temp = Math.round(weatherData?.current?.temperature_2m);

          // WMO weather codes for rain/drizzle
          const isRain = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code);
          // WMO weather codes for thunderstorms
          const isStorm = [95, 96, 99].includes(code);

          if (isStorm) {
            mappedTheme = 'storm';
          } else if (isRain) {
            mappedTheme = 'flood';
          }
        }
      } catch (e) {
        console.warn('DisasterEffects: Weather API fetch failed.');
      }

      // Override weather parameters manually for developer preview
      if (queryWeather) {
        if (queryWeather === 'rain' || queryWeather === 'flood') {
          mappedTheme = 'flood';
        } else if (queryWeather === 'storm' || queryWeather === 'thunderstorm') {
          mappedTheme = 'storm';
        } else if (queryWeather === 'clear') {
          mappedTheme = null;
        }
      }

      return {
        locationName: { city, state },
        liveTheme: mappedTheme,
        temperature: temp,
        timestamp: Date.now()
      };
    };

    const resolveLocationAndWeather = async () => {
      const params = new URLSearchParams(window.location.search);
      const hasOverrides = params.has('weather') || params.has('city') || params.has('state') || params.has('region');

      // 1. Check window memory cache first (5 minutes validity)
      if (!hasOverrides && window.__dcrsWeatherData && (Date.now() - window.__dcrsWeatherData.timestamp < 5 * 60 * 1000)) {
        const cached = window.__dcrsWeatherData;
        setLocationName(cached.locationName);
        setLiveTheme(cached.liveTheme);
        setTemperature(cached.temperature);
        window.dispatchEvent(new CustomEvent('dcrs-weather-update', { detail: cached }));
        return;
      }

      // 2. Check sessionStorage cache second (5 minutes validity)
      if (!hasOverrides) {
        try {
          const sessionCached = sessionStorage.getItem(cacheKey);
          if (sessionCached) {
            const parsed = JSON.parse(sessionCached) as CachedWeather;
            if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
              window.__dcrsWeatherData = parsed;
              setLocationName(parsed.locationName);
              setLiveTheme(parsed.liveTheme);
              setTemperature(parsed.temperature);
              window.dispatchEvent(new CustomEvent('dcrs-weather-update', { detail: parsed }));
              return;
            }
          }
        } catch (e) {}
      }

      // 3. Avoid simultaneous concurrent fetches using a shared promise
      if (window.__dcrsWeatherPromise) {
        try {
          const result = await window.__dcrsWeatherPromise;
          setLocationName(result.locationName);
          setLiveTheme(result.liveTheme);
          setTemperature(result.temperature);
          return;
        } catch (e) {}
      }

      // 4. Trigger actual telemetry query and share the in-flight promise
      const fetchPromise = getWeatherData();
      window.__dcrsWeatherPromise = fetchPromise;

      try {
        const result = await fetchPromise;
        
        if (!hasOverrides) {
          window.__dcrsWeatherData = result;
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (e) {}
        }
        
        window.__dcrsWeatherPromise = undefined;

        setLocationName(result.locationName);
        setLiveTheme(result.liveTheme);
        setTemperature(result.temperature);

        // Notify Navbar and other subscribers of the weather state
        window.dispatchEvent(new CustomEvent('dcrs-weather-update', { detail: result }));
      } catch (err) {
        window.__dcrsWeatherPromise = undefined;
        console.warn('DisasterEffects: Failed to resolve weather telemetry:', err);
      }
    };

    resolveLocationAndWeather();
    // Relaxed 5-minute interval check
    const interval = setInterval(resolveLocationAndWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted) return null;

  const effectiveTheme = liveTheme || theme;
  const particleCount = intensity === 'low' ? 15 : intensity === 'medium' ? 30 : 50;
  
  // Rain triggers ONLY when effectiveTheme is flood or storm
  const shouldRenderRain = effectiveTheme === 'flood' || effectiveTheme === 'storm';

  return (
    <div className={styles.effectsContainer} aria-hidden="true">
      {/* Lightning Overlay for Storm Theme */}
      {effectiveTheme === 'storm' && (
        <div className={styles.lightningOverlay} />
      )}

      {/* Rain/Water Drops (only when rain/storm is active) */}
      {shouldRenderRain && (
        <div className={styles.rainContainer}>
          {[...Array(particleCount)].map((_, i) => {
            const isStorm = effectiveTheme === 'storm';
            return (
              <div
                key={`rain-${i}`}
                className={isStorm ? styles.stormRainDrop : styles.rainDrop}
                style={{
                  left: `${Math.random() * 120 - 10}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: isStorm 
                    ? `${0.3 + Math.random() * 0.3}s` 
                    : `${0.5 + Math.random() * 0.5}s`,
                  opacity: isStorm 
                    ? 0.2 + Math.random() * 0.5 
                    : 0.3 + Math.random() * 0.4
                }}
              />
            );
          })}
        </div>
      )}

      {/* Ember/Fire Particles for Fire Theme */}
      {effectiveTheme === 'fire' && (
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
      {(effectiveTheme === 'general' || effectiveTheme === 'fire' || effectiveTheme === 'storm') && (
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
      {effectiveTheme === 'earthquake' && (
        <div className={styles.earthquakeOverlay} />
      )}

      {/* Alert Pulse Effect - only show if there is an active warning or weather alert */}
      {((liveTheme && (liveTheme === 'flood' || liveTheme === 'storm')) || theme === 'fire' || theme === 'earthquake') && (
        <div className={styles.alertPulse}>
          <div className={styles.pulseRing} />
          <div className={styles.pulseRing} style={{ animationDelay: '1s' }} />
        </div>
      )}

      {/* Floating Glassmorphic Weather Alert Banner */}
      {liveTheme && (liveTheme === 'flood' || liveTheme === 'storm') && !dismissed && (
        <div className={`${styles.weatherPill} ${liveTheme === 'storm' ? styles.weatherPillStorm : ''}`}>
          <div className={styles.pulseDotContainer}>
            <span className={styles.liveDot} />
          </div>
          <div className={styles.weatherInfoText}>
            <span className={styles.alertEmoji}>
              {liveTheme === 'storm' ? '⛈️' : '☔'}
            </span>
            <span className={styles.alertMessage}>
              <strong>{liveTheme === 'storm' ? 'Storm Alert' : 'Rainfall Detected'}</strong> in{' '}
              <span className={styles.cityName}>
                {locationName.city}{locationName.state ? `, ${locationName.state}` : ''}
              </span>
              {temperature !== null && (
                <>
                  {' '}• <span className={styles.tempText}>{temperature}°C</span>
                </>
              )}
            </span>
          </div>
          <button 
            type="button"
            className={styles.closeBtn}
            onClick={() => setDismissed(true)}
            aria-label="Dismiss weather alert"
            title="Dismiss alert"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DisasterEffects;
