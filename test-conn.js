const mysql = require('mysql2/promise');

async function test() {
  const configs = [
    {
      name: 'Credentials with "joyto"',
      host: 'mjbami.h.filess.io',
      port: 3306,
      user: 'dcrf_northjoyto',
      password: '00110515501f8cc479b59e9e366ecc81bb5b2c7a',
      database: 'dcrf_northjoyto'
    },
    {
      name: 'Credentials with "jcyto"',
      host: 'mjbami.h.filess.io',
      port: 3306,
      user: 'dcrf_northjcyto',
      password: '00110515501f8cc479b59e9e366ecc81bb5b2c7a',
      database: 'dcrf_northjcyto'
    }
  ];

  for (const config of configs) {
    console.log(`Testing: ${config.name}...`);
    try {
      const conn = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        connectTimeout: 5000
      });
      console.log(`=> SUCCESS connecting with ${config.name}!`);
      await conn.end();
    } catch (err) {
      console.error(`=> FAILED connecting with ${config.name}:`, err.message);
    }
  }
}

test();
