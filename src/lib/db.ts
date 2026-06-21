import mysql from 'mysql2/promise';

interface GlobalDb {
  pool: mysql.Pool | undefined;
}

const globalForDb = globalThis as unknown as GlobalDb;

export function getDbPool(): mysql.Pool {
  if (!globalForDb.pool) {
    const host = process.env.DB_HOST || process.env.MYSQL_ADDON_HOST || 'localhost';
    const user = process.env.DB_USER || process.env.MYSQL_ADDON_USER || 'root';
    const password = process.env.DB_PASSWORD || process.env.MYSQL_ADDON_PASSWORD || '';
    const database = process.env.DB_NAME || process.env.MYSQL_ADDON_DB || 'dcrs_db';
    const port = parseInt(process.env.DB_PORT || process.env.MYSQL_ADDON_PORT || '3306', 10);
    const connectionLimit = parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10);
    console.log('[DEBUG DB] Initializing connection pool with config:', { host, port, user, database, connectionLimit });

    globalForDb.pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit,
      queueLimit: 0,
      ssl: process.env.DB_SSL === 'true' ? {} : undefined
    });

    // Run migrations in the background
    runMigration(globalForDb.pool);
  }
  return globalForDb.pool;
}

async function runMigration(pool: mysql.Pool) {
  try {
    const alterQueries = [
      'ALTER TABLE news ADD COLUMN display_order INT DEFAULT 0',
      'ALTER TABLE reports ADD COLUMN display_order INT DEFAULT 0',
      'ALTER TABLE cms_pages ADD COLUMN display_order INT DEFAULT 0',
      'ALTER TABLE news ADD COLUMN gallery_images TEXT NULL',
      'ALTER TABLE membership_discounts MODIFY COLUMN start_date DATETIME NOT NULL',
      'ALTER TABLE membership_discounts MODIFY COLUMN end_date DATETIME NOT NULL'
    ];
    for (const sql of alterQueries) {
      try {
        await pool.execute(sql);
        console.log(`[DB MIGRATION] Executed query: ${sql}`);
      } catch (err: any) {
        if (!err.message?.includes('Duplicate column name') && err.code !== 'ER_DUP_FIELDNAME' && !err.message?.includes('Table') && !err.message?.includes('doesn\'t exist')) {
          console.warn(`[DB MIGRATION WARN] Alter failed: ${sql}`, err.message || err);
        }
      }
    }

    // Create pricing and discount tables if they don't exist
    const createPricingTable = `
      CREATE TABLE IF NOT EXISTS membership_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        price INT NOT NULL DEFAULT 0,
        price_sub_text VARCHAR(255) DEFAULT NULL,
        is_popular INT DEFAULT 0,
        features_json TEXT DEFAULT NULL
      ) ENGINE=InnoDB;
    `;
    const createDiscountTable = `
      CREATE TABLE IF NOT EXISTS membership_discounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tier_name VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        percentage INT NOT NULL DEFAULT 0,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `;
    await pool.execute(createPricingTable);
    await pool.execute(createDiscountTable);
    console.log('[DB MIGRATION] Ensured membership plans & discounts tables exist.');

    // Seed default plans if empty
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM membership_plans');
    if (rows[0] && (rows[0].count === 0)) {
      const seedPlans = [
        ['Basic', 0, 'Individual & Student Access', 0, '{"News & analytical information sharing":true,"Capacity building programmes":true,"Stakeholder engagements":false,"Event participation (DCRC)":false,"National Delegation participation":false,"International Delegation participation":false,"Advisory Committee membership":false}'],
        ['Prime', 20000, 'Per Annum — NGO & Academia', 0, '{"News & analytical information sharing":true,"Capacity building programmes":true,"Stakeholder engagements":false,"Event participation (DCRC)":true,"National Delegation participation":false,"International Delegation participation":false,"Advisory Committee membership":false}'],
        ['Premium', 50000, 'Per Annum — SME & Consultancies', 0, '{"News & analytical information sharing":true,"Capacity building programmes":true,"Stakeholder engagements":true,"Event participation (DCRC)":true,"National Delegation participation":true,"International Delegation participation":true,"Advisory Committee membership":false}'],
        ['Gold', 100000, 'Per Annum — Corporates & Leaders', 1, '{"News & analytical information sharing":true,"Capacity building programmes":true,"Stakeholder engagements":true,"Event participation (DCRC)":true,"National Delegation participation":true,"International Delegation participation":true,"Advisory Committee membership":true}']
      ];
      for (const plan of seedPlans) {
        await pool.execute(
          'INSERT INTO membership_plans (name, price, price_sub_text, is_popular, features_json) VALUES (?, ?, ?, ?, ?)',
          plan
        );
      }
      console.log('[DB MIGRATION] Seeded membership plans successfully.');
    }
  } catch (error) {
    console.error('[DB MIGRATION ERROR] Migration runner failed:', error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = unknown>(sql: string, params: any[] = []): Promise<T> {
  const pool = getDbPool();
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Execute the query using the connection pool
      const [results] = await pool.execute(sql, params);
      return results as T;
    } catch (error: any) {
      const message = error?.message || String(error);
      const errCode = error?.code || '';

      const isConnectionLimitError = 
        errCode === 'ER_CON_COUNT_ERROR' ||
        errCode === 1203 ||
        errCode === 'ER_TOO_MANY_USER_CONNECTIONS' ||
        message.includes('max_user_connections') ||
        message.includes('max_connections') ||
        message.includes('too many connections');

      if (isConnectionLimitError && attempt < maxRetries - 1) {
        attempt++;
        // Exponential backoff: 200ms * 2^attempt + random jitter up to 200ms
        const delay = Math.round(200 * Math.pow(2, attempt) + Math.random() * 200);
        console.warn(`[DB WARN] Database connection limit exceeded (${message}). Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      console.error(`Database query failed: ${message} (SQL: ${sql})`);
      throw new Error('Database operation failed. Please try again later.');
    }
  }
  throw new Error('Database connection limit exceeded after multiple retries.');
}
