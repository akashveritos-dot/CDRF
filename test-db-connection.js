require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Database:', process.env.DB_NAME);
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected successfully!');

    // Check if users table has is_active column
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users"
    );
    
    console.log('\n📋 Users table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Check if SUPERADMIN role exists
    const [users] = await connection.execute(
      "SELECT id, email, role, is_active FROM users WHERE email = 'admin@dcrf.org'"
    );

    console.log('\n👤 Admin user:');
    console.log(users[0] || 'Not found!');

    await connection.end();
    
    if (!columns.find(c => c.Field === 'is_active')) {
      console.log('\n❌ ERROR: is_active column missing! Run COMPLETE_SETUP.sql first!');
    } else if (!users[0] || users[0].role !== 'SUPERADMIN') {
      console.log('\n❌ ERROR: Admin user is not SUPERADMIN! Run COMPLETE_SETUP.sql first!');
    } else {
      console.log('\n✅ Database is properly configured!');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testConnection();
