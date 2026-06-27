import { NextRequest, NextResponse } from 'next/server';
import { query, getDbPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

// GET /api/admin/audit-logs/restore - Fetch all deleted records (SUPERADMIN only)
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await query<any[]>('SELECT * FROM deleted_records ORDER BY deleted_at DESC');
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Fetch deleted records error:', error);
    return NextResponse.json({ error: 'Failed to retrieve deleted records' }, { status: 500 });
  }
}

// POST /api/admin/audit-logs/restore - Restore a deleted record (SUPERADMIN only)
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only SUPERADMIN can restore records' }, { status: 403 });
    }

    const { backupId } = await req.json();
    if (!backupId) {
      return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
    }

    const backupRows = await query<any[]>('SELECT * FROM deleted_records WHERE id = ?', [backupId]);
    if (backupRows.length === 0) {
      return NextResponse.json({ error: 'Backup record not found' }, { status: 404 });
    }

    const backup = backupRows[0];
    const tableName = backup.table_name;
    const recordData = typeof backup.data === 'string' ? JSON.parse(backup.data) : backup.data;

    // Build insert query dynamically based on the stored data keys
    const columns = Object.keys(recordData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(recordData);

    const insertSql = `INSERT INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;

    // Perform restoration in transaction
    const pool = getDbPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(insertSql, values as any[]);
      await connection.execute('DELETE FROM deleted_records WHERE id = ?', [backupId]);

      await connection.commit();
      
      await logAction(req, session, 'RESTORE', 'Trash', `Restored deleted record from table ${tableName} (ID: ${backup.record_id})`);
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return NextResponse.json({ success: true, message: 'Record restored successfully' });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json({ error: error.message || 'Failed to restore record' }, { status: 500 });
  }
}
