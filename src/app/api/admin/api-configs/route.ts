import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

// GET API Configs
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

    const configs = await query<any[]>('SELECT * FROM api_configs ORDER BY id ASC');
    return NextResponse.json(configs);
  } catch (error: any) {
    console.error('Admin GET api-configs error:', error);
    return NextResponse.json({ error: 'Failed to fetch API configurations' }, { status: 500 });
  }
}

// POST Save/Update API Config
export async function POST(req: NextRequest) {
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
    const { id, apiName, apiUrl, method = 'GET', description, dataSource, status = 'Active' } = body;

    if (!apiName || !apiUrl) {
      return NextResponse.json({ error: 'API Name and API URL are required' }, { status: 400 });
    }

    if (id) {
      // Update
      await query(
        `UPDATE api_configs 
         SET api_name = ?, api_url = ?, method = ?, description = ?, data_source = ?, status = ? 
         WHERE id = ?`,
        [apiName, apiUrl, method, description || '', dataSource || 'Public API', status, id]
      );
      await logAction(req, session, 'UPDATE', 'ApiConfigs', `Updated API config: "${apiName}"`);
    } else {
      // Insert
      await query(
        `INSERT INTO api_configs (api_name, api_url, method, description, data_source, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [apiName, apiUrl, method, description || '', dataSource || 'Public API', status]
      );
      await logAction(req, session, 'ADD', 'ApiConfigs', `Added API config: "${apiName}"`);
    }

    return NextResponse.json({ success: true, message: 'API configuration saved successfully' });
  } catch (error: any) {
    console.error('Admin POST api-configs error:', error);
    return NextResponse.json({ error: 'Failed to save API configuration' }, { status: 500 });
  }
}

// DELETE API Config (SUPERADMIN ONLY)
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admins can delete API configurations' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const existing = await query<any[]>('SELECT api_name FROM api_configs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'API configuration not found' }, { status: 404 });
    }
    const apiName = existing[0].api_name;

    await query('DELETE FROM api_configs WHERE id = ?', [id]);
    await logAction(req, session, 'DELETE', 'ApiConfigs', `Deleted API config: "${apiName}" (ID: ${id})`);

    return NextResponse.json({ success: true, message: 'API configuration deleted successfully' });
  } catch (error: any) {
    console.error('Admin DELETE api-config error:', error);
    return NextResponse.json({ error: 'Failed to delete API configuration' }, { status: 500 });
  }
}
