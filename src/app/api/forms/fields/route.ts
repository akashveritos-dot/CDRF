import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/forms/fields - Public endpoint to retrieve dynamic form field configs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formType = searchParams.get('type');

    if (!formType) {
      return NextResponse.json(
        { error: 'form type is required' },
        { status: 400 }
      );
    }

    const fields = await query<any[]>(
      `SELECT id, form_type as formType, name, label, type, 
              is_required as isRequired, options, display_order as displayOrder 
       FROM form_fields 
       WHERE form_type = ? 
       ORDER BY display_order ASC`,
      [formType]
    );

    // Format options as array if they exist
    const formattedFields = fields.map(field => ({
      ...field,
      isRequired: field.isRequired === 1 || field.isRequired === true,
      options: field.options ? field.options.split(',').map((opt: string) => opt.trim()) : null
    }));

    let gateEnabled = true;
    if (formType === 'agenda_download') {
      try {
        const settingsRows = await query<any[]>(
          "SELECT setting_value FROM site_settings WHERE setting_key = 'agenda_download_gate_enabled'"
        );
        if (settingsRows.length > 0) {
          gateEnabled = settingsRows[0].setting_value === 'true';
        }
      } catch (err) {
        console.error('Failed to query agenda_download_gate_enabled setting:', err);
      }
    }

    return NextResponse.json(
      { success: true, fields: formattedFields, gateEnabled },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error: any) {
    console.error('[API FORMS FIELDS GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve form fields config.' },
      { status: 500 }
    );
  }
}
