const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'mjbami.h.filess.io',
    port: 3306,
    user: 'dcrf_northjoyto',
    password: '00110515501f8cc479b59e9e366ecc81bb5b2c7a',
    database: 'dcrf_northjoyto'
  });

  const queries = [
    { name: 'ticker_alerts', sql: 'SELECT * FROM ticker_alerts ORDER BY id DESC' },
    { name: 'hero_stats', sql: 'SELECT * FROM hero_stats' },
    { name: 'city_temps', sql: 'SELECT * FROM city_temps' },
    { name: 'disaster_events', sql: 'SELECT * FROM disaster_events' },
    { name: 'economic_losses', sql: 'SELECT * FROM economic_losses ORDER BY year ASC' },
    { name: 'loss_share', sql: 'SELECT * FROM loss_share' },
    { name: 'state_hazards', sql: 'SELECT * FROM state_hazards' },
    { name: 'monsoon_heatmap', sql: 'SELECT * FROM monsoon_heatmap' }
  ];

  for (const q of queries) {
    try {
      const [rows] = await connection.execute(q.sql);
      console.log(`✓ ${q.name}: ${rows.length} rows`);
    } catch (err) {
      console.error(`✗ ${q.name} FAILED:`, err.message);
    }
  }

  await connection.end();
}

main();
