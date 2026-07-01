const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function parseEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const config = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      config[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  });
  return config;
}

async function run() {
  const config = parseEnv();
  const connection = await mysql.createConnection({
    host: config.DB_HOST || 'localhost',
    user: config.DB_USER || 'root',
    password: config.DB_PASSWORD || '',
    database: config.DB_NAME || 'dcrs_db',
    port: parseInt(config.DB_PORT || '3306')
  });

  console.log('Clearing old templates to allow dynamic re-seeding...');
  await connection.execute('DELETE FROM email_templates');
  console.log('✓ email_templates cleared.');
  await connection.end();
}

run().catch(console.error);
