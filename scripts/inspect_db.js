const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const index = trimmed.indexOf('=');
        if (index !== -1) {
          const key = trimmed.substring(0, index).trim();
          const val = trimmed.substring(index + 1).trim();
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {
  console.warn('Could not load .env file:', e.message);
}

async function run() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'dcrs_db';

  console.log(`Connecting to MySQL at ${host}:${port} (db: ${database})...`);
  try {
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      ssl: process.env.DB_SSL === 'true' ? {} : undefined
    });

    const [tables] = await conn.query('SHOW TABLES;');
    console.log('Tables in database:', tables);

    const councilsExists = tables.some(t => Object.values(t).includes('councils'));
    if (councilsExists) {
      const [rows] = await conn.query('SELECT id, name, profile_image, is_active FROM councils;');
      console.log('Rows in councils:', rows);
    } else {
      console.log('councils table does not exist!');
    }

    await conn.end();
  } catch (error) {
    console.error('Inspection failed:', error);
  }
}

run();
