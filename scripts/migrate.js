const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const schemaPath = path.join(__dirname, '../src/data/schema.sql');
  console.log('Reading schema file from:', schemaPath);
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Connecting to MySQL...');
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3309,
      user: 'root',
      password: '',
      multipleStatements: true
    });

    console.log('Executing schema.sql...');
    await conn.query(sql);
    console.log('Migration completed successfully!');

    // Verify and patch existing tables
    await conn.query('USE dcrs_db;');
    try {
      await conn.query('ALTER TABLE scraped_content ADD COLUMN image_url VARCHAR(512) DEFAULT NULL;');
      console.log('Added image_url column to scraped_content table.');
    } catch (err) {
      // Ignore if it already exists
    }

    const [rows] = await conn.query('SELECT id, email, role FROM users;');
    console.log('Seeded users in dcrs_db:', rows);

    await conn.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
