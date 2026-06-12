import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const host = process.env.DB_HOST || process.env.MYSQL_ADDON_HOST || 'localhost';
    const user = process.env.DB_USER || process.env.MYSQL_ADDON_USER || 'root';
    const password = process.env.DB_PASSWORD || process.env.MYSQL_ADDON_PASSWORD || '';
    const database = process.env.DB_NAME || process.env.MYSQL_ADDON_DB || 'dcrs_db';
    const port = parseInt(process.env.DB_PORT || process.env.MYSQL_ADDON_PORT || '3306', 10);
    console.log('[DEBUG DB] Initializing connection pool with config:', { host, port, user, database });

    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl: process.env.DB_SSL === 'true' ? {} : undefined
    });
  }
  return pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const dbPool = getDbPool();
  try {
    const [results] = await dbPool.execute(sql, params);
    return results as T;
  } catch (error: any) {
    console.error(`Database query failed: ${error.message} (SQL: ${sql})`);
    throw error;
  }
}
