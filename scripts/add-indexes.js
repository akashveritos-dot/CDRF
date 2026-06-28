const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// 1. Manually parse .env to get database credentials without external dependencies
function parseEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found at', envPath);
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const config = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      config[key] = val;
    }
  });
  return config;
}

async function run() {
  const env = parseEnv();
  
  const host = env.DB_HOST || 'localhost';
  const user = env.DB_USER || 'root';
  const password = env.DB_PASSWORD || '';
  const database = env.DB_NAME || 'dcrs_db';
  const port = parseInt(env.DB_PORT || '3306', 10);

  console.log(`Connecting to database ${database} at ${host}:${port} as ${user}...`);

  const connection = await mysql.createConnection({
    host,
    user,
    password,
    database,
    port
  });

  const indexes = [
    // cms_pages
    { table: 'cms_pages', name: 'idx_cms_pages_display_order', definition: 'cms_pages (display_order, category, title)' },
    
    // cms_page_sections
    { table: 'cms_page_sections', name: 'idx_cms_page_sections_slug_order', definition: 'cms_page_sections (page_slug, display_order ASC)' },
    
    // cms_page_cards
    { table: 'cms_page_cards', name: 'idx_cms_page_cards_section_order', definition: 'cms_page_cards (section_id, display_order ASC)' },
    
    // news
    { table: 'news', name: 'idx_news_filter_order', definition: 'news (is_manual, display_order, published_date DESC, id DESC)' },
    { table: 'news', name: 'idx_news_category_filter_order', definition: 'news (category, is_manual, display_order, published_date DESC, id DESC)' },
    
    // reports
    { table: 'reports', name: 'idx_reports_filter_order', definition: 'reports (display_order, year DESC, id DESC)' },
    { table: 'reports', name: 'idx_reports_category_filter_order', definition: 'reports (category, display_order, year DESC, id DESC)' },
    
    // contact_messages
    { table: 'contact_messages', name: 'idx_contact_messages_created', definition: 'contact_messages (created_at DESC)' },
    
    // subscriptions
    { table: 'subscriptions', name: 'idx_subscriptions_created', definition: 'subscriptions (created_at DESC)' },
    
    // councils
    { table: 'councils', name: 'idx_councils_display_order', definition: 'councils (display_order ASC)' },
    { table: 'councils', name: 'idx_councils_active_order', definition: 'councils (is_active, display_order ASC)' }
  ];

  for (const idx of indexes) {
    try {
      console.log(`Adding index ${idx.name} on ${idx.table}...`);
      await connection.execute(`CREATE INDEX \`${idx.name}\` ON ${idx.definition}`);
      console.log(`✓ Index ${idx.name} added successfully.`);
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log(`⚠ Index ${idx.name} already exists. Skipping.`);
      } else {
        console.error(`✗ Failed to add index ${idx.name}:`, err.message);
      }
    }
  }

  await connection.end();
  console.log('Database index migration completed.');
}

run().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
