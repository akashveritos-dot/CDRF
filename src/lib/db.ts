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
  }
  return globalForDb.pool;
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
