import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { unstable_cache, revalidateTag } from 'next/cache';

// Database query result type definitions
export interface TickerAlert {
  id: number;
  text: string;
  created_at: string;
}

export interface HeroStat {
  id: string;
  count: number | string | null;
  suffix: string;
  label: string;
  type: string;
}

export interface CityTemp {
  city: string;
  temp: number;
  percentage: number;
}

export interface DisasterEvent {
  label: string;
  count: number;
  percentage: string;
  class_name: string;
}

export interface EconomicLoss {
  year: string;
  value: number | string | null;
  display: string;
  color: string;
}

export interface LossShare {
  name: string;
  value: number;
  color: string;
}

export interface StateHazard {
  id: string;
  name: string;
  hazard_level: 'High' | 'Medium' | 'Low';
  primary_disaster: string;
  affected_count: string;
  description: string;
}

export interface MonsoonHeatmap {
  year: string;
  month: string;
  intensity: number;
}

export interface ResultSetHeader {
  affectedRows: number;
  insertId?: number;
}

// Server-side database telemetry cache (caches full DB schema results for 60 seconds or until invalidated)
const getCachedTelemetryData = unstable_cache(
  async () => {
    const [
      tickerAlerts,
      heroStats,
      cityTemps,
      disasterEvents,
      economicLosses,
      lossShare,
      stateHazards,
      monsoonHeatmap,
      activeIncidentsRes,
      reportsCountRes,
      alertsCountRes
    ] = await Promise.all([
      query<TickerAlert[]>('SELECT * FROM ticker_alerts ORDER BY id DESC'),
      query<HeroStat[]>('SELECT * FROM hero_stats'),
      query<CityTemp[]>('SELECT * FROM city_temps'),
      query<DisasterEvent[]>('SELECT * FROM disaster_events'),
      query<EconomicLoss[]>('SELECT * FROM economic_losses ORDER BY year ASC'),
      query<LossShare[]>('SELECT * FROM loss_share'),
      query<StateHazard[]>('SELECT * FROM state_hazards'),
      query<MonsoonHeatmap[]>('SELECT * FROM monsoon_heatmap'),
      query<{ total: string | number | null }[]>('SELECT SUM(count) as total FROM disaster_events'),
      query<{ cnt: number | null }[]>('SELECT COUNT(*) as cnt FROM reports'),
      query<{ cnt: number | null }[]>('SELECT COUNT(*) as cnt FROM ticker_alerts')
    ]);

    return {
      tickerAlerts,
      heroStats,
      cityTemps,
      disasterEvents,
      economicLosses,
      lossShare,
      stateHazards,
      monsoonHeatmap,
      activeIncidentsRes,
      reportsCountRes,
      alertsCountRes
    };
  },
  ['telemetry-db-data-cache'],
  { revalidate: 60, tags: ['telemetry'] }
);

// Server-side weather fetch cache using Next.js caching framework (5 minutes revalidation TTL)
const getCachedWeatherData = unstable_cache(
  async (cityTemps: CityTemp[]) => {
    const citiesToFetch = [
      { city: 'Chennai', lat: 13.0827, lon: 80.2707 },
      { city: 'Delhi', lat: 28.6139, lon: 77.2090 },
      { city: 'Kolkata', lat: 22.5726, lon: 88.3639 },
      { city: 'Mumbai', lat: 19.0760, lon: 72.8777 }
    ];

    const cityDbMap = new Map<string, CityTemp>(
      cityTemps.map(ct => [ct.city.toLowerCase(), ct])
    );

    const weatherResults = await Promise.all(
      citiesToFetch.map(async (c) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000); // 3-second timeout

        try {
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m`
          );
          clearTimeout(timeout);

          if (weatherRes.ok) {
            const weatherData = (await weatherRes.json()) as Record<string, any>;
            if (weatherData?.current?.temperature_2m !== undefined) {
              const tempVal = Number(weatherData.current.temperature_2m);
              return {
                city: c.city,
                temp: Math.round(tempVal),
                percentage: Math.min(100, Math.max(0, Math.round((tempVal / 50) * 100)))
              };
            }
          }
        } catch (weatherErr) {
          console.warn(`Failed to fetch weather for ${c.city} (timeout or network error):`, weatherErr);
        } finally {
          clearTimeout(timeout);
        }
        // Fallback to database value for this specific city
        const dbFallback = cityDbMap.get(c.city.toLowerCase());
        return dbFallback || { city: c.city, temp: 35, percentage: 70 };
      })
    );

    weatherResults.sort((a, b) => b.temp - a.temp);
    return weatherResults;
  },
  ['weather-temps-cache'],
  { revalidate: 300 } // revalidate cache every 5 minutes (300 seconds)
);

function successResponse(message: string) {
  return NextResponse.json({ success: true, message });
}

// GET /api/telemetry - Retrieve all dashboard and map data
export async function GET() {
  try {
    const {
      tickerAlerts,
      heroStats,
      cityTemps,
      disasterEvents,
      economicLosses,
      lossShare,
      stateHazards,
      monsoonHeatmap,
      activeIncidentsRes,
      reportsCountRes,
      alertsCountRes
    } = await getCachedTelemetryData();

    // Sort heroStats to match static fallback layout order to prevent reordering-animation glitches
    const statOrder = ['floods', 'heat', 'cyclones', 'warming'];
    heroStats.sort((a, b) => statOrder.indexOf(a.id) - statOrder.indexOf(b.id));

    // Sort disasterEvents to match static fallback layout order
    const eventOrder = ['Floods', 'Heatwaves', 'Cyclones', 'Landslides', 'Droughts', 'Earthquakes'];
    disasterEvents.sort((a, b) => eventOrder.indexOf(a.label) - eventOrder.indexOf(b.label));

    // Fetch real-time temperatures for major cities on the server-side with graceful fallback
    let finalCityTemps: CityTemp[] = [];
    try {
      finalCityTemps = await getCachedWeatherData(cityTemps);
    } catch (err) {
      console.warn('Failed to compile weather temps via cache, falling back to database temperatures:', err);
      finalCityTemps = cityTemps;
    }

    // Format monsoon gridded heatmap data
    const years = ['2019', '2020', '2021', '2022', '2023', '2024'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const heatmapData = years.map(() => months.map(() => 1));
    monsoonHeatmap.forEach(item => {
      const yIdx = years.indexOf(item.year);
      const mIdx = months.indexOf(item.month);
      if (yIdx !== -1 && mIdx !== -1) {
        heatmapData[yIdx][mIdx] = item.intensity;
      }
    });

    // Parse aggregates with strict null checks to prevent parseInt("null") => NaN
    const rawIncidents = activeIncidentsRes[0]?.total;
    const activeIncidents = rawIncidents !== null && rawIncidents !== undefined && !isNaN(Number(rawIncidents))
      ? Number(rawIncidents)
      : 705;

    const rawReportsCount = reportsCountRes[0]?.cnt;
    const reportsPublished = rawReportsCount !== null && rawReportsCount !== undefined && !isNaN(Number(rawReportsCount))
      ? Number(rawReportsCount)
      : 6;

    const rawAlertsCount = alertsCountRes[0]?.cnt;
    const alertsIssued = rawAlertsCount !== null && rawAlertsCount !== undefined && !isNaN(Number(rawAlertsCount))
      ? Number(rawAlertsCount)
      : 7;

    const homepageStats = {
      activeIncidents,
      countriesAffected: 6,
      reportsPublished,
      disasterCategories: 10,
      alertsIssued
    };

    return NextResponse.json({
      tickerAlerts,
      heroStats: heroStats.map(s => ({
        ...s,
        count: s.count !== null && s.count !== undefined && !isNaN(parseFloat(String(s.count)))
          ? parseFloat(String(s.count))
          : 0
      })),
      cityTemps: finalCityTemps,
      disasterEvents,
      economicLosses: economicLosses.map(l => ({
        year: l.year,
        value: l.value !== null && l.value !== undefined && !isNaN(parseFloat(String(l.value)))
          ? parseFloat(String(l.value))
          : 0,
        display: l.display,
        color: l.color
      })),
      lossShare,
      stateHazards,
      heatmapData,
      homepageStats
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Fetch telemetry error:', errMsg);
    return NextResponse.json(
      { error: 'Failed to fetch telemetry data' },
      { status: 500 }
    );
  }
}

// ─── POST Update Sub-Handlers ──────────────────────────────────────────────────

async function handleAlertUpdate(data: unknown): Promise<NextResponse> {
  const payload = data as Record<string, unknown>;
  const text = payload.text;
  const id = payload.id;

  if (typeof text !== 'string' || text.trim() === '') {
    return NextResponse.json({ error: 'Alert text is required and must be a string' }, { status: 400 });
  }
  
  const cleanText = text.trim();
  if (cleanText.length > 512) {
    return NextResponse.json({ error: 'Alert text cannot exceed 512 characters' }, { status: 400 });
  }

  if (id !== undefined && id !== null) {
    if (isNaN(Number(id))) {
      return NextResponse.json({ error: 'Alert ID must be a valid number' }, { status: 400 });
    }
    const result = await query<ResultSetHeader>('UPDATE ticker_alerts SET text = ? WHERE id = ?', [cleanText, id]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Alert record not found' }, { status: 404 });
    }
  } else {
    await query('INSERT INTO ticker_alerts (text) VALUES (?)', [cleanText]);
  }
  
  revalidateTag('telemetry', 'max');
  return successResponse('Alert updated successfully');
}

async function handleStatUpdate(data: unknown): Promise<NextResponse> {
  const payload = data as Record<string, unknown>;
  const id = payload.id;
  const count = payload.count;

  if (typeof id !== 'string' || id.trim() === '') {
    return NextResponse.json({ error: 'Stat ID is required' }, { status: 400 });
  }
  
  const numCount = Number(count);
  if (count === undefined || isNaN(numCount) || !Number.isFinite(numCount) || numCount < -100 || numCount > 1_000_000_000) {
    return NextResponse.json({ error: 'Valid count value is required (within range)' }, { status: 400 });
  }

  const result = await query<ResultSetHeader>('UPDATE hero_stats SET count = ? WHERE id = ?', [count, id]);
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: 'Hero stat record not found' }, { status: 404 });
  }
  
  revalidateTag('telemetry', 'max');
  return successResponse('Hero statistic updated successfully');
}

async function handleTempUpdate(data: unknown): Promise<NextResponse> {
  const payload = data as Record<string, unknown>;
  const city = payload.city;
  const temp = payload.temp;
  const percentage = payload.percentage;

  if (typeof city !== 'string' || city.trim() === '') {
    return NextResponse.json({ error: 'City name is required' }, { status: 400 });
  }
  if (temp === undefined || isNaN(Number(temp))) {
    return NextResponse.json({ error: 'Valid temperature is required' }, { status: 400 });
  }
  
  const numPercentage = Number(percentage);
  if (percentage === undefined || isNaN(numPercentage) || numPercentage < 0 || numPercentage > 100) {
    return NextResponse.json({ error: 'Valid percentage between 0 and 100 is required' }, { status: 400 });
  }
  const result = await query<ResultSetHeader>('UPDATE city_temps SET temp = ?, percentage = ? WHERE city = ?', [temp, percentage, city]);
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: 'City temperature entry not found' }, { status: 404 });
  }
  
  revalidateTag('telemetry', 'max');
  return successResponse('City temperature updated successfully');
}

async function handleStateUpdate(data: unknown): Promise<NextResponse> {
  const payload = data as Record<string, unknown>;
  const id = payload.id;
  const hazard_level = payload.hazard_level;
  const primary_disaster = payload.primary_disaster;
  const affected_count = payload.affected_count;
  const description = payload.description;

  if (typeof id !== 'string' || id.trim() === '') {
    return NextResponse.json({ error: 'State ID is required' }, { status: 400 });
  }
  if (typeof hazard_level !== 'string' || !['High', 'Medium', 'Low'].includes(hazard_level)) {
    return NextResponse.json({ error: 'Hazard level must be High, Medium, or Low' }, { status: 400 });
  }
  if (typeof primary_disaster !== 'string' || primary_disaster.trim() === '') {
    return NextResponse.json({ error: 'Primary disaster description is required' }, { status: 400 });
  }
  if (typeof affected_count !== 'string' || affected_count.trim() === '') {
    return NextResponse.json({ error: 'Affected count is required' }, { status: 400 });
  }
  if (typeof description !== 'string' || description.trim() === '') {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  const result = await query<ResultSetHeader>(
    `UPDATE state_hazards 
     SET hazard_level = ?, primary_disaster = ?, affected_count = ?, description = ? 
     WHERE id = ?`,
    [hazard_level, primary_disaster, affected_count, description, id]
  );
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: 'State hazard entry not found' }, { status: 404 });
  }
  
  revalidateTag('telemetry', 'max');
  return successResponse('State hazard details updated successfully');
}

// POST /api/telemetry - Update telemetry entries (Admin Secured)
// Body format: { type: 'temp' | 'stat' | 'state' | 'alert', data: { ... } }
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validate request body shape (must be a non-array object)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body structure' }, { status: 400 });
    }

    const payload = body as { type?: string; data?: unknown };
    const { type, data } = payload;

    // Validate type parameter
    if (!type || !['alert', 'stat', 'temp', 'state'].includes(type)) {
      return NextResponse.json({ error: 'Valid update type is required' }, { status: 400 });
    }

    // Validate data payload shape (must be a non-array object)
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json({ error: 'Data payload must be an object' }, { status: 400 });
    }

    // Dispatch payload to appropriate modular sub-handlers
    switch (type) {
      case 'alert':
        return await handleAlertUpdate(data);
      case 'stat':
        return await handleStatUpdate(data);
      case 'temp':
        return await handleTempUpdate(data);
      case 'state':
        return await handleStateUpdate(data);
      default:
        return NextResponse.json({ error: 'Unsupported telemetry update type' }, { status: 400 });
    }

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Update telemetry error:', errMsg);
    return NextResponse.json(
      { error: 'Failed to update telemetry' },
      { status: 500 }
    );
  }
}
