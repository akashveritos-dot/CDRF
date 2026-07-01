const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

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

  console.log(`Connecting to database ${database} at ${host}:${port}...`);
  const connection = await mysql.createConnection({
    host,
    user,
    password,
    database,
    port
  });

  // 1. Fetch plans
  console.log('Checking membership_plans...');
  const [plans] = await connection.execute('SELECT id, name, features_json FROM membership_plans');
  for (const plan of plans) {
    let features = plan.features_json;
    if (typeof features === 'string') {
      try {
        features = JSON.parse(features);
      } catch (err) {
        console.warn(`Could not parse features for plan ${plan.name}`);
        continue;
      }
    }
    
    if (features && typeof features === 'object') {
      let updated = false;
      const newFeatures = {};
      for (const [key, value] of Object.entries(features)) {
        if (key.includes('Dcrc')) {
          const newKey = key.replace(/Dcrc/g, 'DCRC');
          newFeatures[newKey] = value;
          updated = true;
        } else {
          newFeatures[key] = value;
        }
      }

      if (updated) {
        console.log(`Updating features key for plan ${plan.name}...`);
        await connection.execute(
          'UPDATE membership_plans SET features_json = ? WHERE id = ?',
          [JSON.stringify(newFeatures), plan.id]
        );
      }
    }
  }

  // 2. Fetch page sections
  console.log('Checking cms_page_sections...');
  const [sections] = await connection.execute("SELECT id, title, description FROM cms_page_sections WHERE page_slug = 'dcrc-26'");
  for (const sec of sections) {
    if (sec.title && sec.title.includes('Dcrc')) {
      const newTitle = sec.title.replace(/Dcrc/g, 'DCRC');
      console.log(`Updating cms_page_sections title: ${sec.title} -> ${newTitle}`);
      await connection.execute('UPDATE cms_page_sections SET title = ? WHERE id = ?', [newTitle, sec.id]);
    }
    if (sec.description && sec.description.includes('Dcrc')) {
      const newDesc = sec.description.replace(/Dcrc/g, 'DCRC');
      console.log(`Updating cms_page_sections description for section ${sec.id}`);
      await connection.execute('UPDATE cms_page_sections SET description = ? WHERE id = ?', [newDesc, sec.id]);
    }
  }

  // 3. Fetch cards
  console.log('Checking cms_page_cards...');
  const [cards] = await connection.execute(`
    SELECT c.id, c.title, c.description, c.extra_data FROM cms_page_cards c
    JOIN cms_page_sections s ON c.section_id = s.id
    WHERE s.page_slug = 'dcrc-26'
  `);
  for (const card of cards) {
    let updated = false;
    let title = card.title || '';
    let desc = card.description || '';
    let extra = card.extra_data || '';

    if (title.includes('Dcrc')) {
      title = title.replace(/Dcrc/g, 'DCRC');
      updated = true;
    }
    if (desc.includes('Dcrc')) {
      desc = desc.replace(/Dcrc/g, 'DCRC');
      updated = true;
    }
    if (typeof extra === 'string' && extra.includes('Dcrc')) {
      extra = extra.replace(/Dcrc/g, 'DCRC');
      updated = true;
    } else if (extra && typeof extra === 'object') {
      const str = JSON.stringify(extra);
      if (str.includes('Dcrc')) {
        extra = JSON.parse(str.replace(/Dcrc/g, 'DCRC'));
        updated = true;
      }
    }

    if (updated) {
      console.log(`Updating card id=${card.id}...`);
      await connection.execute(
        'UPDATE cms_page_cards SET title = ?, description = ?, extra_data = ? WHERE id = ?',
        [title, desc, typeof extra === 'object' ? JSON.stringify(extra) : extra, card.id]
      );
    }
  }

  // 4. Update page details
  console.log('Checking cms_pages...');
  const [pages] = await connection.execute("SELECT id, title, description FROM cms_pages WHERE slug = 'dcrc-26'");
  for (const page of pages) {
    let updated = false;
    let pTitle = page.title || '';
    let pDesc = page.description || '';

    if (pTitle.includes('Dcrc')) {
      pTitle = pTitle.replace(/Dcrc/g, 'DCRC');
      updated = true;
    }
    if (pDesc.includes('Dcrc')) {
      pDesc = pDesc.replace(/Dcrc/g, 'DCRC');
      updated = true;
    }

    if (updated) {
      console.log(`Updating cms_pages title/desc for dcrc-26...`);
      await connection.execute('UPDATE cms_pages SET title = ?, description = ? WHERE id = ?', [pTitle, pDesc, page.id]);
    }
  }

  await connection.end();
  console.log('Capitalization script run complete.');
}

run().catch(err => {
  console.error('Fatal Database Capitalization Error:', err);
  process.exit(1);
});
