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
      await conn.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) DEFAULT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL
        ) ENGINE=InnoDB;
      `);
      console.log('Verified or created subscriptions table.');
    } catch (err) {
      console.warn('Could not create subscriptions table:', err.message);
    }

    // Safely create indexes
    try {
      await conn.query('CREATE INDEX idx_news_category_date ON news (category, published_date);');
      console.log('Created index idx_news_category_date');
    } catch (err) {}
    try {
      await conn.query('CREATE INDEX idx_news_published_date ON news (published_date);');
      console.log('Created index idx_news_published_date');
    } catch (err) {}
    try {
      await conn.query('CREATE INDEX idx_reports_category_year ON reports (category, year);');
      console.log('Created index idx_reports_category_year');
    } catch (err) {}
    try {
      await conn.query('CREATE INDEX idx_reports_year ON reports (year);');
      console.log('Created index idx_reports_year');
    } catch (err) {}
    try {
      await conn.query('CREATE INDEX idx_scraped_status_date ON scraped_content (status, scrape_date);');
      console.log('Created index idx_scraped_status_date');
    } catch (err) {}
    try {
      await conn.query('CREATE INDEX idx_subscriptions_email ON subscriptions (email);');
      console.log('Created index idx_subscriptions_email');
    } catch (err) {}

    try {
      await conn.query('ALTER TABLE scraped_content ADD COLUMN image_url VARCHAR(512) DEFAULT NULL;');
      console.log('Added image_url column to scraped_content table.');
    } catch (err) {}

    try {
      await conn.query('ALTER TABLE news ADD COLUMN location VARCHAR(255) DEFAULT NULL;');
      console.log('Added location column to news table.');
    } catch (err) {}

    try {
      await conn.query('ALTER TABLE scraped_content ADD COLUMN location VARCHAR(255) DEFAULT NULL;');
      console.log('Added location column to scraped_content table.');
    } catch (err) {}

    try {
      await conn.query('ALTER TABLE scraped_content ADD COLUMN published_date DATE DEFAULT NULL;');
      console.log('Added published_date column to scraped_content table.');
    } catch (err) {}

    const [rows] = await conn.query('SELECT id, email, role FROM users;');
    console.log('Seeded users in database:', rows);

    await conn.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
