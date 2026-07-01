import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

async function ensureTableAndSeed() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    await query(`
      INSERT IGNORE INTO site_settings (setting_key, setting_value) 
      VALUES ('agenda_download_gate_enabled', 'true')
    `);
  } catch (err) {
    console.error('[API SETTINGS] Self-healing table creation failed:', err);
  }
}

// GET /api/admin/forms/settings?key=...
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    await ensureTableAndSeed();

    const rows = await query<any[]>(
      'SELECT setting_value as value FROM site_settings WHERE setting_key = ?',
      [key]
    );

    const value = rows.length > 0 ? rows[0].value : null;

    return NextResponse.json({ success: true, key, value });
  } catch (error: any) {
    console.error('[API ADMIN SETTINGS GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch setting' }, { status: 500 });
  }
}

// PUT /api/admin/forms/settings
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }

    await ensureTableAndSeed();

    await query(
      `INSERT INTO site_settings (setting_key, setting_value) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, String(value)]
    );

    await logAction(
      req,
      session,
      'UPDATE',
      'Site Settings',
      `Updated setting "${key}" to "${value}"`
    );

    return NextResponse.json({ success: true, message: `Setting ${key} updated successfully.` });
  } catch (error: any) {
    console.error('[API ADMIN SETTINGS PUT] Error:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
