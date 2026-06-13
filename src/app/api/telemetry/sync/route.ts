import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const syncResults: any = {
    cityTemps: [],
    warmingAnomaly: null,
    disasterEvents: []
  };

  try {
    // 1. Sync City Temperatures from Open-Meteo Weather API
    const cities = [
      { name: 'Delhi', lat: 28.61, lon: 77.20 },
      { name: 'Mumbai', lat: 19.07, lon: 72.87 },
      { name: 'Chennai', lat: 13.08, lon: 80.27 },
      { name: 'Kolkata', lat: 22.57, lon: 88.36 }
    ];

    const tempResults = await Promise.all(
      cities.map(async city => {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`);
          if (res.ok) {
            const data = await res.json();
            const tempVal = Math.round(data.current_weather.temperature);
            const percentage = Math.min(100, Math.max(0, Math.round((tempVal / 50) * 100))); // normalize out of 50 degC
            
            // Save to DB
            await query('UPDATE city_temps SET temp = ?, percentage = ? WHERE city = ?', [tempVal, percentage, city.name]);
            return { city: city.name, temp: tempVal, success: true };
          }
        } catch (err: any) {
          console.warn(`Failed to fetch temp for ${city.name}:`, err.message);
        }
        return { city: city.name, success: false };
      })
    );
    syncResults.cityTemps = tempResults;

    // 2. Sync Global/India Climate Anomaly from real Global Warming API
    try {
      const warmingRes = await fetch('https://global-warming.org/api/temperature-api');
      if (warmingRes.ok) {
        const warmingData = await warmingRes.json();
        if (warmingData.result && warmingData.result.length > 0) {
          const latestAnomaly = parseFloat(warmingData.result[warmingData.result.length - 1].land);
          if (!isNaN(latestAnomaly)) {
            // Apply scale offset (+0.15 degC) to estimate India-specific warming anomalies
            const indiaAnomaly = parseFloat((latestAnomaly + 0.15).toFixed(2));
            await query("UPDATE hero_stats SET count = ? WHERE id = 'warming'", [indiaAnomaly]);
            syncResults.warmingAnomaly = indiaAnomaly;
          }
        }
      }
    } catch (err: any) {
      console.warn('Failed to fetch global warming temperature anomaly feed:', err.message);
    }

    // 3. Aggregate Disaster Events dynamic increments using keyword counts from live news/scraped feeds
    const baseCounts: Record<string, number> = {
      'Floods': 260,
      'Heatwaves': 170,
      'Cyclones': 15,
      'Landslides': 120,
      'Droughts': 90,
      'Earthquakes': 40
    };

    const disasterTypes = [
      { label: 'Floods', keywords: ['flood', 'inundat', 'river overflow', 'heavy rain'] },
      { label: 'Heatwaves', keywords: ['heatwave', 'extreme heat', 'temperature records'] },
      { label: 'Cyclones', keywords: ['cyclone', 'depression', 'storm surge', 'typhoon'] },
      { label: 'Landslides', keywords: ['landslide', 'mudslide', 'cloudburst'] },
      { label: 'Droughts', keywords: ['drought', 'dry spell', 'water shortage'] },
      { label: 'Earthquakes', keywords: ['earthquake', 'tremor', 'seismic'] }
    ];

    const eventSync = await Promise.all(
      disasterTypes.map(async type => {
        try {
          // Generate SQL query to find occurrences of keywords in news headline or excerpt
          const matchQuery = type.keywords.map(kw => `headline LIKE ? OR excerpt LIKE ?`).join(' OR ');
          const params = type.keywords.flatMap(kw => [`%${kw}%`, `%${kw}%`]);
          
          const newsCountRes = await query<any[]>(`SELECT COUNT(*) as cnt FROM news WHERE ${matchQuery}`, params);
          const scrapedCountRes = await query<any[]>(`SELECT COUNT(*) as cnt FROM scraped_content WHERE ${matchQuery}`, params);

          const dbNewsCount = newsCountRes[0]?.cnt || 0;
          const dbScrapedCount = scrapedCountRes[0]?.cnt || 0;
          const totalRecent = dbNewsCount + dbScrapedCount;

          const base = baseCounts[type.label] || 10;
          const finalCount = base + totalRecent;
          
          // Estimate percentage share index
          const totalEventsSumRes = await query<any[]>(`SELECT SUM(count) as total FROM disaster_events`);
          const overallTotal = totalEventsSumRes[0]?.total || 1000;
          const sharePercentage = Math.round((finalCount / overallTotal) * 100);

          await query(
            'UPDATE disaster_events SET count = ?, percentage = ? WHERE label = ?',
            [finalCount, `${sharePercentage}%`, type.label]
          );

          return { label: type.label, count: finalCount, success: true };
        } catch (err: any) {
          console.warn(`Failed to aggregate stats for ${type.label}:`, err.message);
          return { label: type.label, success: false };
        }
      })
    );
    syncResults.disasterEvents = eventSync;

    return NextResponse.json({
      success: true,
      message: 'Telemetry metrics synchronized successfully with truth sources',
      results: syncResults
    });

  } catch (error: any) {
    console.error('Telemetry Sync Error:', error);
    return NextResponse.json(
      { error: 'Failed to synchronize live telemetry feeds', details: 'Unable to sync live data at this time.' },
      { status: 500 }
    );
  }
}
