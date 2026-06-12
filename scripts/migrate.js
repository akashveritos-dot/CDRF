const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Manually load .env variables
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

async function migrate() {
  const schemaPath = path.join(__dirname, '../src/data/schema.sql');
  console.log('Reading schema file from:', schemaPath);
  let sql = fs.readFileSync(schemaPath, 'utf8');

  // Strip out CREATE DATABASE and USE statements to avoid permission errors on hosted DBs
  sql = sql.replace(/CREATE DATABASE IF NOT EXISTS\s+\w+[^;]*;/gi, '-- Stripped CREATE DATABASE');
  sql = sql.replace(/USE\s+\w+;/gi, '-- Stripped USE DATABASE');

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

    console.log('Executing schema.sql on the database...');
    await conn.query(sql);
    console.log('Migration completed successfully!');

    // Verify and patch existing tables if needed
    try {
      await conn.query('ALTER TABLE scraped_content ADD COLUMN image_url VARCHAR(512) DEFAULT NULL;');
      console.log('Added image_url column to scraped_content table.');
    } catch (err) {
      // Ignore if it already exists or if alter fails because of schema
    }

    const [rows] = await conn.query('SELECT id, email, role FROM users;');
    console.log('Seeded users in database:', rows);

    await conn.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
