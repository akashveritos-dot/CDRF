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

  console.log(`Connecting to database ${database} at ${host}:${port} as ${user}...`);

  const connection = await mysql.createConnection({
    host,
    user,
    password,
    database,
    port
  });

  // 1. Create form_fields table
  console.log('Ensuring form_fields table exists...');
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS form_fields (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_type VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      label VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      is_required TINYINT NOT NULL DEFAULT 1,
      options TEXT NULL,
      display_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_form_field (form_type, name)
    ) ENGINE=InnoDB;
  `;
  await connection.execute(createTableQuery);
  console.log('✓ form_fields table ensured.');

  // 1b. Create site_settings table
  console.log('Ensuring site_settings table exists...');
  const createSettingsTableQuery = `
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  await connection.execute(createSettingsTableQuery);
  console.log('✓ site_settings table ensured.');

  // Seed default site setting for agenda download gate
  console.log('Seeding default site settings...');
  try {
    await connection.execute(
      `INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES (?, ?)`,
      ['agenda_download_gate_enabled', 'true']
    );
    console.log('✓ Seeded agenda_download_gate_enabled setting.');
  } catch (err) {
    console.warn('Failed to seed agenda_download_gate_enabled setting:', err.message);
  }

  // 2. Seed default form fields
  console.log('Seeding default form fields...');
  const defaultFields = [
    // Contact Form
    ['contact', 'name', 'Full Name', 'text', 1, null, 1],
    ['contact', 'email', 'Email Address', 'email', 1, null, 2],
    ['contact', 'subject', 'Subject', 'text', 1, null, 3],
    ['contact', 'message', 'Message Details', 'textarea', 1, null, 4],

    // Event Conclave Registration Form
    ['event_register', 'name', 'Full Name', 'text', 1, null, 1],
    ['event_register', 'email', 'Email Address', 'email', 1, null, 2],
    ['event_register', 'company', 'Company / Organisation', 'text', 1, null, 3],
    ['event_register', 'designation', 'Designation', 'text', 0, null, 4],
    ['event_register', 'role', 'Attendance Mode', 'select', 1, 'Delegate,Speaker,Sponsor,Researcher,Government', 5],

    // Membership Application Form
    ['membership', 'name', 'Full Name', 'text', 1, null, 1],
    ['membership', 'email', 'Email Address', 'email', 1, null, 2],
    ['membership', 'organization', 'Organisation / Institution', 'text', 1, null, 3],
    ['membership', 'title', 'Professional Title', 'text', 0, null, 4],
    ['membership', 'tier', 'Membership Tier', 'select', 1, 'Basic,Prime,Premium,Gold', 5],
    ['membership', 'message', 'Additional Notes / Purpose', 'textarea', 0, null, 6],

    // Agenda Download Form
    ['agenda_download', 'email', 'Email Address', 'email', 1, null, 1],
    ['agenda_download', 'name', 'Full Name', 'text', 0, null, 2],
    ['agenda_download', 'designation', 'Designation', 'text', 0, null, 3],
    ['agenda_download', 'entityType', 'Entity Type', 'select', 0, 'Individual,Organization', 4],
    ['agenda_download', 'organizationName', 'Organization Name', 'text', 0, null, 5],
    ['agenda_download', 'mobile', 'Mobile Number', 'text', 0, null, 6]
  ];

  for (const f of defaultFields) {
    try {
      await connection.execute(
        `INSERT IGNORE INTO form_fields (form_type, name, label, type, is_required, options, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        f
      );
    } catch (err) {
      console.warn(`Failed to seed field ${f[1]} for form ${f[0]}:`, err.message);
    }
  }
  console.log('✓ Default form fields seeded.');

  // 3. Alter existing tables to add extra_data column
  const alters = [
    { table: 'contact_messages', query: 'ALTER TABLE contact_messages ADD COLUMN extra_data JSON DEFAULT NULL' },
    { table: 'event_registrations', query: 'ALTER TABLE event_registrations ADD COLUMN extra_data JSON DEFAULT NULL' },
    { table: 'memberships', query: 'ALTER TABLE memberships ADD COLUMN extra_data JSON DEFAULT NULL' },
    { table: 'report_downloads', query: 'ALTER TABLE report_downloads ADD COLUMN extra_data JSON DEFAULT NULL' }
  ];

  for (const alt of alters) {
    try {
      console.log(`Adding extra_data to ${alt.table}...`);
      await connection.execute(alt.query);
      console.log(`✓ Added extra_data to ${alt.table} successfully.`);
    } catch (err) {
      if (err.message.includes('Duplicate column name') || err.code === 'ER_DUP_FIELDNAME') {
        console.log(`⚠ Column extra_data already exists in ${alt.table}. Skipping.`);
      } else {
        console.error(`✗ Failed to alter table ${alt.table}:`, err.message);
      }
    }
  }

  await connection.end();
  console.log('Database form fields migration completed.');
}

run().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
