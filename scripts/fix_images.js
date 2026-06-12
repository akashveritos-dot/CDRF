const mysql = require('mysql2/promise');
const fs = require('fs');

// Parse .env manually (no dotenv dependency needed)
const envPath = require('path').join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
}

const categoryFallbacks = {
  earthquake: 'https://images.unsplash.com/photo-1594897030264-ab7d87efc473?auto=format&fit=crop&w=800&q=80',
  flood: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?auto=format&fit=crop&w=800&q=80',
  wildfire: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=800&q=80',
  cyclone: 'https://images.unsplash.com/photo-1527482797697-8795b05a133d?auto=format&fit=crop&w=800&q=80',
  storm: 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=800&q=80',
  landslide: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  drought: 'https://images.unsplash.com/photo-1473116763269-b552f58d6f67?auto=format&fit=crop&w=800&q=80',
  climate: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
  environment: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80',
  sustainability: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
  disasters: 'https://images.unsplash.com/photo-1542393545-10f5b85e14fc?auto=format&fit=crop&w=800&q=80',
  breaking: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  health: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
  alert: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
};

function getImg(cat) {
  const key = (cat || 'breaking').toLowerCase().trim();
  return categoryFallbacks[key] || categoryFallbacks.breaking;
}

async function fix() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dcrs'
  });

  // Fix news rows with missing image_url
  const [newsRows] = await conn.execute(
    `SELECT id, category, tag FROM news WHERE image_url IS NULL OR image_url = ''`
  );
  console.log('News rows needing image fix:', newsRows.length);
  for (const row of newsRows) {
    const img = getImg(row.category || row.tag);
    await conn.execute('UPDATE news SET image_url = ? WHERE id = ?', [img, row.id]);
    console.log(`  Fixed news ID ${row.id} (${row.category || row.tag}) => ${img.substring(0, 60)}...`);
  }

  // Fix reports rows with missing image_url
  const [reportRows] = await conn.execute(
    `SELECT id, disaster_type, category FROM reports WHERE image_url IS NULL OR image_url = ''`
  );
  console.log('Report rows needing image fix:', reportRows.length);
  for (const row of reportRows) {
    const img = getImg(row.disaster_type || row.category);
    await conn.execute('UPDATE reports SET image_url = ? WHERE id = ?', [img, row.id]);
    console.log(`  Fixed report ID ${row.id} => ${img.substring(0, 60)}...`);
  }

  console.log('\nDone! All missing images backfilled with category-appropriate Unsplash fallbacks.');
  await conn.end();
}

fix().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
