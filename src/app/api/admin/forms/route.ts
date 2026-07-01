import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET all form fields (optionally filtered by form type)
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
    const formType = searchParams.get('type');

    let fields;
    if (formType) {
      fields = await query<any[]>(
        `SELECT id, form_type as formType, name, label, type, is_required as isRequired, options, display_order as displayOrder 
         FROM form_fields 
         WHERE form_type = ? 
         ORDER BY display_order ASC`,
        [formType]
      );
    } else {
      fields = await query<any[]>(
        `SELECT id, form_type as formType, name, label, type, is_required as isRequired, options, display_order as displayOrder 
         FROM form_fields 
         ORDER BY form_type, display_order ASC`
      );
    }

    return NextResponse.json(fields);
  } catch (error: any) {
    console.error('[API ADMIN FORMS GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch form fields' }, { status: 500 });
  }
}

// POST to create a new form field
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
    const { formType, name, label, type, isRequired, options, displayOrder = 0 } = body;

    if (!formType || !name || !label || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sanitize name to avoid weird characters in input name attributes
    const cleanName = name.replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanName) {
      return NextResponse.json({ error: 'Invalid name parameter' }, { status: 400 });
    }

    // Check duplicate
    const existing = await query<any[]>(
      'SELECT id FROM form_fields WHERE form_type = ? AND name = ?',
      [formType, cleanName]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: `Field with name "${cleanName}" already exists for form type "${formType}"` }, { status: 400 });
    }

    const result = await query<any>(
      `INSERT INTO form_fields (form_type, name, label, type, is_required, options, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [formType, cleanName, label, type, isRequired ? 1 : 0, options || null, displayOrder]
    );

    await logAction(
      req,
      session,
      'ADD',
      'Dynamic Form Fields',
      `Created form field "${label}" (${cleanName}) for form type "${formType}"`
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('[API ADMIN FORMS POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create form field' }, { status: 500 });
  }
}

// PUT to update an existing form field or batch update display order during reordering
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

    // Check if this is a batch reorder operation
    if (body.reorder && Array.isArray(body.fields)) {
      for (const f of body.fields) {
        await query(
          'UPDATE form_fields SET display_order = ? WHERE id = ?',
          [f.displayOrder, f.id]
        );
      }
      return NextResponse.json({ success: true, message: 'Display order updated successfully' });
    }

    const { id, label, type, isRequired, options, displayOrder } = body;

    if (!id || !label || !type) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const existing = await query<any[]>('SELECT form_type, name FROM form_fields WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    await query(
      `UPDATE form_fields SET
         label = ?, type = ?, is_required = ?, options = ?, display_order = ?
       WHERE id = ?`,
      [label, type, isRequired ? 1 : 0, options || null, displayOrder ?? 0, id]
    );

    await logAction(
      req,
      session,
      'UPDATE',
      'Dynamic Form Fields',
      `Updated form field ID ${id} ("${label}") for form type "${existing[0].form_type}"`
    );

    return NextResponse.json({ success: true, message: 'Form field updated successfully' });
  } catch (error: any) {
    console.error('[API ADMIN FORMS PUT] Error:', error);
    return NextResponse.json({ error: 'Failed to update form field' }, { status: 500 });
  }
}

// DELETE a form field
export async function DELETE(req: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 });
    }

    const existing = await query<any[]>('SELECT form_type, name, label FROM form_fields WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    await query('DELETE FROM form_fields WHERE id = ?', [id]);

    await logAction(
      req,
      session,
      'DELETE',
      'Dynamic Form Fields',
      `Deleted form field "${existing[0].label}" (${existing[0].name}) from form type "${existing[0].form_type}"`
    );

    return NextResponse.json({ success: true, message: 'Form field deleted successfully' });
  } catch (error: any) {
    console.error('[API ADMIN FORMS DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete form field' }, { status: 500 });
  }
}
