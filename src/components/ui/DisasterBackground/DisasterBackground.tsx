'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SunCalc from 'suncalc';
import styles from './DisasterBackground.module.css';
import RainCanvas from './RainCanvas';

interface SeismicWave {
  id: number;
  x: number;
  y: number;
}

interface WeatherState {
  temp: string;
  condition: string;
  type: 'sunny' | 'rain' | 'storm' | 'cloudy';
}

type TimeOfDay = 'day' | 'evening' | 'night';

// Helper to fetch timezone-adjusted time for New Delhi using SunCalc
function getDelhiTimeOfDay(date: Date): TimeOfDay {
  try {
    const lat = 28.6139;
    const lon = 77.2090;
    const times = SunCalc.getTimes(date, lat, lon);
    const now = date.getTime();
    const sunrise = times.sunrise.getTime();
    const sunset = times.sunset.getTime();
    const goldenHour = times.goldenHour.getTime();
    const dusk = times.dusk.getTime();

    // Evening: from goldenHour to dusk
    if (now >= goldenHour && now < dusk) {
      return 'evening';
    }
    // Day: from sunrise to goldenHour
    if (now >= sunrise && now < goldenHour) {
      return 'day';
    }
    // Night: otherwise
    return 'night';
  } catch (e) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false
      });
      const hour = parseInt(formatter.format(date), 10);
      if (hour >= 6 && hour < 17) return 'day';
      if (hour >= 17 && hour < 19) return 'evening';
      return 'night';
    } catch (err) {
      const hour = date.getHours();
      if (hour >= 6 && hour < 17) return 'day';
      if (hour >= 17 && hour < 19) return 'evening';
      return 'night';
    }
  }
}

// Selects real (non-AI) landscape photography background images of New Delhi landmarks (India Gate)
function getBackgroundImageUrl(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'day':
      // Real landscape photograph of India Gate, New Delhi in bright sunny daylight
      return 'https://images.unsplash.com/photo-1598977123418-45f04b01fe1e?q=80&w=1200&auto=format&fit=crop';
    case 'evening':
      // Real landscape photograph of India Gate, New Delhi at pink/purple sunset
      return 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1200&auto=format&fit=crop';
    case 'night':
      // Real landscape photograph of India Gate, New Delhi lit up at night
      return 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1200&auto=format&fit=crop';
    default:
      return 'https://images.unsplash.com/photo-1598977123418-45f04b01fe1e?q=80&w=1200&auto=format&fit=crop';
  }
}

export default function DisasterBackground() {
  const [mounted, setMounted] = useState(false);
  const [waves, setWaves] = useState<SeismicWave[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [celestialTop, setCelestialTop] = useState<number>(110);
  const [celestialOpacity, setCelestialOpacity] = useState<number>(1);
  const [weather, setWeather] = useState<WeatherState>({
    temp: '32',
    condition: 'Sunny / Clear',
    type: 'sunny',
  });
  const [delhiTime, setDelhiTime] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    setTimeOfDay(getDelhiTimeOfDay(new Date()));

    // Update dynamic positions and periods using SunCalc
    function updateCelestialPosition() {
      const now = new Date();
      const currentPeriod = getDelhiTimeOfDay(now);
      setTimeOfDay(currentPeriod);
      
      let altitude = 0;
      if (currentPeriod === 'night') {
        const moonPos = SunCalc.getMoonPosition(now, 28.6139, 77.2090);
        altitude = moonPos.altitude;
      } else {
        const sunPos = SunCalc.getPosition(now, 28.6139, 77.2090);
        altitude = sunPos.altitude;
      }

      const maxAlt = 1.5;
      const minTop = -40;
      const maxTop = 40;
      
      const altRatio = Math.max(0, Math.min(1, altitude / maxAlt));
      const calculatedTop = maxTop - altRatio * (maxTop - minTop);
      setCelestialTop(calculatedTop);

      let opacity = 1;
      if (altitude <= 0) {
        opacity = 0;
      } else if (altitude < 0.1) {
        opacity = altitude / 0.1;
      }
      setCelestialOpacity(opacity);
    }

    updateCelestialPosition();
    const celestialInterval = setInterval(updateCelestialPosition, 60000);

    // Update real-time clock for New Delhi every second
    function updateClock() {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setDelhiTime(formatter.format(new Date()));
    }
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // Fetch live weather data from Open-Meteo API for New Delhi (28.6139° N, 77.2090° E)
    async function loadLiveWeather() {
      try {
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current=temperature_2m,is_day,weather_code&timezone=Asia%2FKolkata'
        );
        if (response.ok) {
          const data = await response.json();
          const current = data.current;
          const temp = Math.round(current.temperature_2m).toString();
          const code = current.weather_code;
          const isDayApi = current.is_day;

          // Map WMO weather code to weather state types
          let type: 'sunny' | 'rain' | 'storm' | 'cloudy' = 'sunny';
          if ([95, 96, 99].includes(code)) {
            type = 'storm';
          } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
            type = 'rain';
          } else if ([1, 2, 3, 45, 48].includes(code)) {
            type = 'cloudy';
          }

          let condition = 'Sunny / Clear';
          switch (code) {
            case 0: condition = 'Clear Sky'; break;
            case 1: condition = 'Mainly Clear'; break;
            case 2: condition = 'Partly Cloudy'; break;
            case 3: condition = 'Overcast'; break;
            case 45: case 48: condition = 'Foggy / Hazy'; break;
            case 51: case 53: case 55: condition = 'Light Drizzle'; break;
            case 61: case 63: case 65: condition = 'Rainy'; break;
            case 80: case 81: case 82: condition = 'Rain Showers'; break;
            case 95: case 96: case 99: condition = 'Thunderstorm'; break;
          }

          setWeather({
            temp: temp,
            condition: condition,
            type: type,
          });

          // Re-evaluate Delhi time of day combining API day status & current hour using SunCalc
          const calculatedTimeOfDay = getDelhiTimeOfDay(new Date());
          setTimeOfDay(calculatedTimeOfDay);
          updateCelestialPosition();
        }
      } catch (err) {
        console.warn('Failed to fetch live Delhi weather from Open-Meteo, falling back:', err);
      }
    }

    loadLiveWeather();
    // Refresh weather telemetry every 10 minutes
    const weatherInterval = setInterval(loadLiveWeather, 600000);

    // Periodically trigger heavy seismic wave rings
    const seismicInterval = setInterval(() => {
      const newWave: SeismicWave = {
        id: Date.now(),
        x: 15 + Math.random() * 70,
        y: 20 + Math.random() * 55,
      };
      setWaves((prev) => [...prev.slice(-3), newWave]);
    }, 3500);

    return () => {
      clearInterval(clockInterval);
      clearInterval(weatherInterval);
      clearInterval(seismicInterval);
      clearInterval(celestialInterval);
    };
  }, []);

  if (!mounted) return null;

  const isRainEnabled = weather.type === 'rain' || weather.type === 'storm';

  return (
    <div className={`${styles.container} ${weather.type === 'storm' ? styles.lightning : ''}`}>
      {/* Dynamic Weather Background Image with atmospheric filters applied per weather type */}
      <div 
        className={`${styles.weatherImage} ${styles[weather.type] || ''}`} 
        style={{ backgroundImage: `url(${getBackgroundImageUrl(timeOfDay)})` }}
      />

      {/* Cyber Grid Scan Line */}
      <div className={styles.gridScan} />

      {/* Real-Time Live Weather Telemetry Widget */}
      <div className={styles.weatherWidget}>
        <span className={styles.liveIndicator}>
          <span className={styles.livePulse} />
          LIVE WEATHER TELEMETRY
        </span>
        <h4 className={styles.weatherCity}>NEW DELHI</h4>
        <div className={styles.weatherInfo}>
          <span className={styles.weatherTemp}>{weather.temp}°C</span>
          <span className={styles.weatherDivider}>|</span>
          <span className={styles.weatherTime}>{delhiTime || '--:--:-- --'}</span>
          <span className={styles.weatherDivider}>|</span>
          <span className={styles.weatherDesc}>
            {weather.condition.toUpperCase()} ({timeOfDay.toUpperCase()})
          </span>
        </div>
      </div>

      {/* 3. Real-World Sun/Moon Component (Active on sunny/clear or cloudy days/evenings or nights) */}
      {!isRainEnabled && (weather.type === 'sunny' || weather.type === 'cloudy') && (
        <div 
          className={`${styles.celestialObject} ${styles[timeOfDay]} ${styles[weather.type] || ''}`}
          style={{ 
            top: `${celestialTop}px`,
            opacity: celestialOpacity,
            transition: 'top 60s linear, opacity 1.2s ease-in-out'
          }}
        >
          {timeOfDay === 'night' ? (
            <svg viewBox="0 0 100 100" className={styles.moonSvg}>
              <defs>
                <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e6f0ff" stopOpacity="0.55" />
                  <stop offset="50%" stopColor="#b4d2ff" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="moonSurface" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="40%" stopColor="#ebebeb" />
                  <stop offset="75%" stopColor="#c8c8c8" />
                  <stop offset="100%" stopColor="#787878" />
                </radialGradient>
                <linearGradient id="moonShading" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="30%" stopColor="#000000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="url(#moonGlow)" className={styles.moonGlowSvg} />
              <g>
                <circle cx="50" cy="50" r="18" fill="url(#moonSurface)" />
                <circle cx="42" cy="45" r="2.2" fill="#969696" opacity="0.4" />
                <circle cx="58" cy="42" r="1.8" fill="#969696" opacity="0.4" />
                <circle cx="55" cy="56" r="2.8" fill="#969696" opacity="0.4" />
                <circle cx="44" cy="58" r="1.8" fill="#969696" opacity="0.4" />
                <circle cx="50" cy="48" r="2.0" fill="#969696" opacity="0.4" />
                <circle cx="60" cy="50" r="1.2" fill="#969696" opacity="0.4" />
                <circle cx="50" cy="50" r="18" fill="url(#moonShading)" />
              </g>
            </svg>
          ) : (
            <svg viewBox="0 0 200 200" className={styles.sunSvg}>
              <defs>
                <radialGradient id="sunCoreDay" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="30%" stopColor="#fff9db" stopOpacity="0.95" />
                  <stop offset="70%" stopColor="#ffc107" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#ff8f00" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="sunCoronaDay" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fff9db" stopOpacity="0.65" />
                  <stop offset="50%" stopColor="#ff8f00" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#ff3d00" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="sunCoreEvening" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="35%" stopColor="#ffe5d0" stopOpacity="0.95" />
                  <stop offset="75%" stopColor="#ff5722" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#e64a19" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="sunCoronaEvening" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffab91" stopOpacity="0.75" />
                  <stop offset="60%" stopColor="#d84315" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#3e2723" stopOpacity="0" />
                </radialGradient>
              </defs>
              {timeOfDay === 'evening' ? (
                <>
                  <circle cx="100" cy="100" r="90" fill="url(#sunCoronaEvening)" className={styles.sunCoronaSvg} />
                  <circle cx="100" cy="100" r="50" fill="url(#sunCoreEvening)" />
                </>
              ) : (
                <>
                  <circle cx="100" cy="100" r="90" fill="url(#sunCoronaDay)" className={styles.sunCoronaSvg} />
                  <circle cx="100" cy="100" r="50" fill="url(#sunCoreDay)" />
                </>
              )}
              <circle cx="100" cy="100" r="16" fill="#ffffff" />
            </svg>
          )}
        </div>
      )}

      {/* 1. Seismic Concentric Waves */}
      {waves.map((wave) => (
        <React.Fragment key={wave.id}>
          {/* Wave 1 */}
          <motion.div
            className={styles.seismicRing}
            style={{ left: `${wave.x}%`, top: `${wave.y}%` }}
            initial={{ width: 0, height: 0, opacity: 0.9 }}
            animate={{ width: 400, height: 400, opacity: 0 }}
            transition={{ duration: 3.2, ease: 'easeOut' }}
          />
          {/* Wave 2 */}
          <motion.div
            className={styles.seismicRing}
            style={{ left: `${wave.x}%`, top: `${wave.y}%` }}
            initial={{ width: 0, height: 0, opacity: 0.7 }}
            animate={{ width: 280, height: 280, opacity: 0 }}
            transition={{ duration: 2.5, delay: 0.4, ease: 'easeOut' }}
          />
        </React.Fragment>
      ))}

      {/* 2. Realistic Canvas Rain System (Active only on Rain/Storm conditions) */}
      <RainCanvas rainEnabled={isRainEnabled} weatherType={weather.type} timeOfDay={timeOfDay} />
    </div>
  );
}
