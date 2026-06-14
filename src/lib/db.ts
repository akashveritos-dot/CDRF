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
    // Enforce strict connection limit of 1 per pool instance to prevent exceeding the database's 5 max_user_connections limit.
    // Setting maxIdle to 0 ensures released connections are immediately closed and not kept alive as idle.
    const connectionLimit = 1;
    console.log('[DEBUG DB] Initializing connection pool with config:', { host, port, user, database, connectionLimit });

    globalForDb.pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit,
      maxIdle: 0, // Ensure no idle connections are kept alive in the pool
      idleTimeout: 100, // Close idle connections immediately (100ms) to free slots
      queueLimit: 0,
      enableKeepAlive: false, // Disable keep-alive to allow connections to close immediately
      ssl: process.env.DB_SSL === 'true' ? {} : undefined
    });
  }
  return globalForDb.pool;
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
