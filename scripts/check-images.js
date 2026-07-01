const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function parseEnv() {
  const envPath = path.join(__dirname, '..', '.env');
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
  const env = parseEnv();
  const connection = await mysql.createConnection({
    host: env.DB_HOST || 'localhost',
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'dcrs_db',
    port: parseInt(env.DB_PORT || '3306', 10)
  });

  console.log('--- CMS PAGES IMAGE_URL ---');
  const [pages] = await connection.execute("SELECT slug, title, image_url, main_image_url FROM cms_pages WHERE slug = 'dcrc-26'");
  console.log(pages);

  console.log('--- CMS SECTIONS IMAGE_URL ---');
  const [sections] = await connection.execute("SELECT id, title, image_url FROM cms_page_sections WHERE page_slug = 'dcrc-26'");
  console.log(sections);

  console.log('--- CMS CARDS IMAGE_URL ---');
  const [cards] = await connection.execute(`
    SELECT c.id, c.title, c.image_url, s.title as section_title 
    FROM cms_page_cards c
    JOIN cms_page_sections s ON c.section_id = s.id
    WHERE s.page_slug = 'dcrc-26'
  `);
  console.log(cards);

  await connection.end();
}

run().catch(console.error);
