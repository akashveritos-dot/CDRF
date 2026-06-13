import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/telemetry - Retrieve all dashboard and map data
export async function GET(req: NextRequest) {
  try {
    const tickerAlerts = await query<any[]>('SELECT * FROM ticker_alerts ORDER BY id DESC');
    const heroStats = await query<any[]>('SELECT * FROM hero_stats');
    const cityTemps = await query<any[]>('SELECT * FROM city_temps');
    const disasterEvents = await query<any[]>('SELECT * FROM disaster_events');
    const economicLosses = await query<any[]>('SELECT * FROM economic_losses ORDER BY year ASC');
    const lossShare = await query<any[]>('SELECT * FROM loss_share');
    const stateHazards = await query<any[]>('SELECT * FROM state_hazards');
    const monsoonHeatmap = await query<any[]>('SELECT * FROM monsoon_heatmap');

    // Fetch real-time temperatures for major cities on the server-side (Chennai, Delhi, Kolkata, Mumbai)
    let finalCityTemps = cityTemps;
    try {
      const weatherRes = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=13.0827,28.6139,22.5726,19.0760&longitude=80.2707,77.2090,88.3639,72.8777&current=temperature_2m',
        { next: { revalidate: 60 } } // Cache for 60 seconds
      );
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        if (Array.isArray(weatherData)) {
          finalCityTemps = [
            { 
              city: 'Chennai', 
              temp: Math.round(weatherData[0].current.temperature_2m),
              percentage: Math.round((weatherData[0].current.temperature_2m / 50) * 100)
            },
            { 
              city: 'Delhi', 
              temp: Math.round(weatherData[1].current.temperature_2m),
              percentage: Math.round((weatherData[1].current.temperature_2m / 50) * 100)
            },
            { 
              city: 'Kolkata', 
              temp: Math.round(weatherData[2].current.temperature_2m),
              percentage: Math.round((weatherData[2].current.temperature_2m / 50) * 100)
            },
            { 
              city: 'Mumbai', 
              temp: Math.round(weatherData[3].current.temperature_2m),
              percentage: Math.round((weatherData[3].current.temperature_2m / 50) * 100)
            }
          ];
          finalCityTemps.sort((a, b) => b.temp - a.temp);
        }
      }
    } catch (weatherErr) {
      console.warn('Failed to fetch real-time weather in telemetry API route:', weatherErr);
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

    // Fetch dynamic home statistics counters
    const activeIncidentsRes = await query<any[]>('SELECT SUM(count) as total FROM disaster_events');
    const reportsCountRes = await query<any[]>('SELECT COUNT(*) as cnt FROM reports');
    const alertsCountRes = await query<any[]>('SELECT COUNT(*) as cnt FROM ticker_alerts');

    const homepageStats = {
      activeIncidents: parseInt(activeIncidentsRes[0]?.total || '705', 10),
      countriesAffected: 6,
      reportsPublished: parseInt(reportsCountRes[0]?.cnt || '6', 10),
      disasterCategories: 10,
      alertsIssued: parseInt(alertsCountRes[0]?.cnt || '7', 10)
    };

    return NextResponse.json({
      tickerAlerts,
      heroStats: heroStats.map(s => ({ ...s, count: parseFloat(s.count) })),
      cityTemps: finalCityTemps,
      disasterEvents,
      economicLosses: economicLosses.map(l => ({
        year: l.year,
        value: parseFloat(l.value),
        display: l.display,
        color: l.color
      })),
      lossShare,
      stateHazards,
      heatmapData,
      homepageStats
    });
  } catch (error: any) {
    console.error('Fetch telemetry error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch telemetry data' },
      { status: 500 }
    );
  }
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

    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data parameters are required' },
        { status: 400 }
      );
    }

    if (type === 'alert') {
      const { text, id } = data;
      if (id) {
        // Edit alert
        await query('UPDATE ticker_alerts SET text = ? WHERE id = ?', [text, id]);
      } else {
        // Add alert
        await query('INSERT INTO ticker_alerts (text) VALUES (?)', [text]);
      }
    } 
    else if (type === 'stat') {
      const { id, count } = data;
      await query('UPDATE hero_stats SET count = ? WHERE id = ?', [count, id]);
    } 
    else if (type === 'temp') {
      const { city, temp, percentage } = data;
      await query('UPDATE city_temps SET temp = ?, percentage = ? WHERE city = ?', [temp, percentage, city]);
    } 
    else if (type === 'state') {
      const { id, hazard_level, primary_disaster, affected_count, description } = data;
      await query(
        `UPDATE state_hazards 
         SET hazard_level = ?, primary_disaster = ?, affected_count = ?, description = ? 
         WHERE id = ?`,
        [hazard_level, primary_disaster, affected_count, description, id]
      );
    } 
    else {
      return NextResponse.json({ error: 'Unsupported telemetry update type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Telemetry updated successfully' });

  } catch (error: any) {
    console.error('Update telemetry error:', error);
    return NextResponse.json(
      { error: 'Failed to update telemetry' },
      { status: 500 }
    );
  }
}
