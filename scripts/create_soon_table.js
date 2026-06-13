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
  const schemaPath = path.join(__dirname, '../database/soon_registrations_schema.sql');
  console.log('Reading schema file from:', schemaPath);
  const sql = fs.readFileSync(schemaPath, 'utf8');

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
      multipleStatements: true,
      ssl: process.env.DB_SSL === 'true' ? {} : undefined
    });

    console.log('Executing soon_registrations_schema.sql...');
    // Split statements by semicolon and filter empty ones
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const stmt of statements) {
      try {
        await conn.query(stmt);
      } catch (err) {
        console.warn(`Query warning (might already exist): ${err.message}`);
      }
    }
    
    console.log('Soon registrations table migration completed successfully!');
    await conn.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
