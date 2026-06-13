'use client';

import React, { useEffect, useState } from 'react';
import styles from './DynamicSkyBackground.module.css';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

const DynamicSkyBackground: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData>({ temperature: 30, weatherCode: 0, isDay: true });
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');
  const [mounted, setMounted] = useState(false);

  // Initialize on client-side only to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateWeatherState = async () => {
      try {
        const lat = 28.6139;
        const lng = 77.2090;
        const now = new Date();

        // Determine time of day
        const hour = now.getHours();
        let period: 'dawn' | 'day' | 'dusk' | 'night' = 'day';
        if (hour >= 5 && hour < 7) {
          period = 'dawn';
        } else if (hour >= 7 && hour < 17) {
          period = 'day';
        } else if (hour >= 17 && hour < 19) {
          period = 'dusk';
        } else {
          period = 'night';
        }
        setTimeOfDay(period);

        // Fetch real weather data
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,is_day&timezone=Asia/Kolkata`
        );
        
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          setWeather({
            temperature: Math.round(weatherData.current.temperature_2m),
            weatherCode: weatherData.current.weather_code,
            isDay: weatherData.current.is_day === 1
          });
        }
      } catch (error) {
        console.warn('Failed to update weather:', error);
      }
    };

    updateWeatherState();
    const interval = setInterval(updateWeatherState, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get weather condition text
  const getWeatherCondition = () => {
    const { weatherCode } = weather;
    if (weatherCode === 0) return 'Clear Sky';
    if (weatherCode === 1) return 'Mainly Clear';
    if (weatherCode === 2) return 'Partly Cloudy';
    if (weatherCode === 3) return 'Overcast';
    if (weatherCode >= 51 && weatherCode <= 67) return 'Rainy';
    if (weatherCode >= 71 && weatherCode <= 77) return 'Snowy';
    if (weatherCode >= 95) return 'Thunderstorm';
    return 'Cloudy';
  };

  return (
    <div className={styles.skyContainer}>
      {/* Single static disaster background image */}
      <div className={styles.videoLayer}>
        {/* Static background image */}
        <div 
          className={styles.staticBackground}
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1920&q=80)',
          }}
        />
        
        {/* Animated disaster particles overlay - only render on client */}
        {mounted && (
          <div className={styles.disasterParticles}>
            {/* Rain effect */}
            {timeOfDay !== 'night' && (
              <>
                {[...Array(30)].map((_, i) => (
                  <div
                    key={`rain-${i}`}
                    className={styles.rainDrop}
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    }}
                  />
                ))}
              </>
            )}
            
            {/* Dust/smoke particles */}
            {[...Array(15)].map((_, i) => (
              <div
                key={`dust-${i}`}
                className={styles.dustParticle}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${15 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>
        )}
        
        <div className={styles.videoOverlay} />
        
        {/* Live incident indicator */}
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot}></span>
          <span className={styles.liveText}>LIVE DISASTER MONITORING</span>
        </div>
      </div>
      
      {/* Weather badge overlay on top */}
      <div className={styles.weatherBadge}>
        <div className={styles.weatherInfo}>
          <div className={styles.weatherLocation}>New Delhi</div>
          <div className={styles.weatherTemp}>{weather.temperature}°C</div>
          <div className={styles.weatherCondition}>{getWeatherCondition()}</div>
          <div className={styles.weatherPeriod}>{timeOfDay}</div>
          <div className={styles.weatherTime}>
            {new Date().toLocaleTimeString('en-IN', { 
              timeZone: 'Asia/Kolkata', 
              hour: '2-digit', 
              minute: '2-digit'
            })} IST
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicSkyBackground;
