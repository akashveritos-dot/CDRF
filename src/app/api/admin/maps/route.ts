import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

// GET Maps metadata & State Hazards
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

    const metaRows = await query<any[]>('SELECT * FROM maps_metadata WHERE id = ?', ['india-disaster-risk']);
    const metadata = metaRows[0] || {
      id: 'india-disaster-risk',
      title: 'Composite Disaster Risk Map - India',
      overview: 'Interactive spatial visualization of real-time composite climate hazard levels...',
      info_source: 'ISRO RISAT, IMD Stations, CWC Streams'
    };

    const hazards = await query<any[]>('SELECT * FROM state_hazards ORDER BY name ASC');

    return NextResponse.json({ metadata, hazards });
  } catch (error: any) {
    console.error('Admin GET maps error:', error);
    return NextResponse.json({ error: 'Failed to fetch maps data' }, { status: 500 });
  }
}

// POST Save Map Metadata or State Hazard
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
    const { action } = body;

    if (action === 'saveMetadata') {
      const { title, overview, infoSource } = body;

      if (!title || !overview) {
        return NextResponse.json({ error: 'Title and Overview are required' }, { status: 400 });
      }

      const existing = await query<any[]>('SELECT id FROM maps_metadata WHERE id = ?', ['india-disaster-risk']);
      if (existing.length > 0) {
        await query(
          'UPDATE maps_metadata SET title = ?, overview = ?, info_source = ? WHERE id = ?',
          [title, overview, infoSource || '', 'india-disaster-risk']
        );
      } else {
        await query(
          'INSERT INTO maps_metadata (id, title, overview, info_source) VALUES (?, ?, ?, ?)',
          ['india-disaster-risk', title, overview, infoSource || '']
        );
      }

      await logAction(req, session, 'UPDATE', 'Maps', 'Updated map metadata');
      return NextResponse.json({ success: true, message: 'Map metadata updated successfully' });

    } else if (action === 'saveHazard') {
      const { id, name, hazardLevel, primaryDisaster, affectedCount, description } = body;

      if (!id || !name || !hazardLevel) {
        return NextResponse.json({ error: 'State ID, Name and Hazard Level are required' }, { status: 400 });
      }

      const existing = await query<any[]>('SELECT id FROM state_hazards WHERE id = ?', [id]);
      if (existing.length > 0) {
        // Update
        await query(
          `UPDATE state_hazards 
           SET name = ?, hazard_level = ?, primary_disaster = ?, affected_count = ?, description = ? 
           WHERE id = ?`,
          [name, hazardLevel, primaryDisaster || null, affectedCount || null, description || '', id]
        );
        await logAction(req, session, 'UPDATE', 'StateHazard', `Updated hazard info for state: "${name}"`);
      } else {
        // Insert
        await query(
          `INSERT INTO state_hazards (id, name, hazard_level, primary_disaster, affected_count, description) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, name, hazardLevel, primaryDisaster || null, affectedCount || null, description || '']
        );
        await logAction(req, session, 'ADD', 'StateHazard', `Added state hazard details: "${name}"`);
      }

      return NextResponse.json({ success: true, message: 'State hazard details saved successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin POST maps error:', error);
    return NextResponse.json({ error: 'Failed to save maps data' }, { status: 500 });
  }
}

// DELETE State Hazard Details (SUPERADMIN ONLY)
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admins can delete state hazard mappings' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const existing = await query<any[]>('SELECT name FROM state_hazards WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'State hazard details not found' }, { status: 404 });
    }
    const name = existing[0].name;

    await query('DELETE FROM state_hazards WHERE id = ?', [id]);
    await logAction(req, session, 'DELETE', 'StateHazard', `Deleted state hazard details for state: "${name}" (ID: ${id})`);

    return NextResponse.json({ success: true, message: 'State hazard details deleted successfully' });
  } catch (error: any) {
    console.error('Admin DELETE maps error:', error);
    return NextResponse.json({ error: 'Failed to delete state hazard details' }, { status: 500 });
  }
}
