const mysql = require('mysql2/promise');

async function query(sql, params = []) {
  const host = 'mjbami.h.filess.io';
  const user = 'dcrf_northjoyto';
  const password = '00110515501f8cc479b59e9e366ecc81bb5b2c7a';
  const database = 'dcrf_northjoyto';
  const port = 3306;

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    let connection = null;
    try {
      connection = await mysql.createConnection({
        host,
        user,
        password,
        database,
        port,
        connectTimeout: 5000
      });

      const [results] = await connection.execute(sql, params);
      await connection.end();
      return results;
    } catch (error) {
      if (connection) {
        try {
          await connection.end();
        } catch (_) {}
      }

      const message = error.message || String(error);
      const errCode = error.code || '';

      const isConnectionLimitError = 
        errCode === 'ER_CON_COUNT_ERROR' ||
        errCode === 1203 ||
        errCode === 'ER_TOO_MANY_USER_CONNECTIONS' ||
        message.includes('max_user_connections') ||
        message.includes('max_connections') ||
        message.includes('too many connections');

      if (isConnectionLimitError && attempt < maxRetries - 1) {
        attempt++;
        const delay = Math.round(200 * Math.pow(2, attempt) + Math.random() * 200);
        console.warn(`[DB WARN] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      console.error(`Database query failed: ${message} (SQL: ${sql})`);
      throw error;
    }
  }
}

async function main() {
  try {
    const tickerAlerts = await query('SELECT * FROM ticker_alerts ORDER BY id DESC');
    const heroStats = await query('SELECT * FROM hero_stats');
    const cityTemps = await query('SELECT * FROM city_temps');
    const disasterEvents = await query('SELECT * FROM disaster_events');
    const economicLosses = await query('SELECT * FROM economic_losses ORDER BY year ASC');
    const lossShare = await query('SELECT * FROM loss_share');
    const stateHazards = await query('SELECT * FROM state_hazards');
    const monsoonHeatmap = await query('SELECT * FROM monsoon_heatmap');

    let finalCityTemps = cityTemps;
    
    // Check if Open-Meteo logic works or throws
    const weatherRes = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=13.0827,28.6139,22.5726,19.0760&longitude=80.2707,77.2090,88.3639,72.8777&current=temperature_2m'
    );
    if (weatherRes.ok) {
      const weatherData = await weatherRes.json();
      console.log('Open-Meteo weatherData type:', typeof weatherData, 'isArray:', Array.isArray(weatherData));
    } else {
      console.warn('Open-Meteo status:', weatherRes.status);
    }

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

    const activeIncidentsRes = await query('SELECT SUM(count) as total FROM disaster_events');
    const reportsCountRes = await query('SELECT COUNT(*) as cnt FROM reports');
    const alertsCountRes = await query('SELECT COUNT(*) as cnt FROM ticker_alerts');

    const homepageStats = {
      activeIncidents: parseInt(activeIncidentsRes[0]?.total || '705', 10),
      countriesAffected: 6,
      reportsPublished: parseInt(reportsCountRes[0]?.cnt || '6', 10),
      disasterCategories: 10,
      alertsIssued: parseInt(alertsCountRes[0]?.cnt || '7', 10)
    };

    const response = {
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
    };

    console.log('GET Handler executed successfully!');
  } catch (err) {
    console.error('GET Handler THREW ERROR:', err);
  }
}

main();
