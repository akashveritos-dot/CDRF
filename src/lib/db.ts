import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const host = process.env.DB_HOST || process.env.MYSQL_ADDON_HOST || 'localhost';
    const user = process.env.DB_USER || process.env.MYSQL_ADDON_USER || 'root';
    const password = process.env.DB_PASSWORD || process.env.MYSQL_ADDON_PASSWORD || '';
    const database = process.env.DB_NAME || process.env.MYSQL_ADDON_DB || 'dcrs_db';
    const port = parseInt(process.env.DB_PORT || process.env.MYSQL_ADDON_PORT || '3306', 10);
    const connectionLimit = parseInt(process.env.DB_CONNECTION_LIMIT || '2', 10);
    console.log('[DEBUG DB] Initializing connection pool with config:', { host, port, user, database, connectionLimit });

    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit, // Max 2 concurrent connections
      maxIdle: 0, // Don't keep any idle connections (close immediately after use)
      idleTimeout: 1000, // Close idle connections after 1 second
      queueLimit: 0,
      enableKeepAlive: false, // Disable keep-alive to allow connections to close
      keepAliveInitialDelay: 0,
      ssl: process.env.DB_SSL === 'true' ? {} : undefined
    });
  }
  return pool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = unknown>(sql: string, params: any[] = []): Promise<T> {
  const dbPool = getDbPool();
  try {
    const [results] = await dbPool.execute(sql, params);
    return results as T;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Database query failed: ${message} (SQL: ${sql})`);
    throw new Error('Database operation failed. Please try again later.');
  }
}
