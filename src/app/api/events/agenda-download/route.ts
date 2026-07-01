import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    // 1. Fetch dynamic agenda download form fields
    const activeFields = await query<any[]>(
      `SELECT name, label, type, is_required as isRequired 
       FROM form_fields 
       WHERE form_type = 'agenda_download' 
       ORDER BY display_order ASC`
    );

    // Fallback if no fields found in DB
    const fieldsToValidate = activeFields.length > 0 ? activeFields : [
      { name: 'email', label: 'Official Email', type: 'email', isRequired: 1 },
      { name: 'name', label: 'Full Name', type: 'text', isRequired: 1 },
      { name: 'mobile', label: 'Mobile Number', type: 'text', isRequired: 1 },
      { name: 'designation', label: 'Designation', type: 'text', isRequired: 1 },
      { name: 'organizationName', label: 'Organization Name', type: 'text', isRequired: 1 },
      { name: 'entityType', label: 'Entity Type', type: 'select', isRequired: 1 }
    ];

    // 2. Validate inputs dynamically
    const validatedData: Record<string, any> = {};
    for (const field of fieldsToValidate) {
      const isReq = field.isRequired === 1 || field.isRequired === true;
      const value = body[field.name];

      if (isReq && (value === undefined || value === null || String(value).trim() === '')) {
        return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 });
      }

      if (value !== undefined && value !== null) {
        let cleanVal = String(value).trim();
        
        // Email validation
        if (field.type === 'email' && cleanVal) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(cleanVal)) {
            return NextResponse.json({ error: `Please enter a valid email address for ${field.label}.` }, { status: 400 });
          }
          cleanVal = cleanVal.toLowerCase();
        }

        validatedData[field.name] = cleanVal;
      }
    }

    const email = validatedData.email || body.email || '';
    const name = validatedData.name || body.name || 'Conclave Visitor';
    const designation = validatedData.designation || body.designation || 'Visitor';
    const organizationName = validatedData.organizationName || body.organizationName || '';
    const mobile = validatedData.mobile || body.mobile || '';
    const entityType = validatedData.entityType || body.entityType || 'Individual';

    if (!email) {
      return NextResponse.json({ error: 'Email Address is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Collect all submitted fields in extraData
    const extraData = JSON.stringify(body);

    // Log the download with a sentinel report_id = 9999 representing the Conclave Agenda
    await query(
      `INSERT INTO report_downloads (
        report_id, name, email, designation, entity_type, organization_name, mobile, extra_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        9999,
        name.trim(),
        cleanEmail,
        designation.trim(),
        entityType,
        organizationName.trim(),
        mobile.trim(),
        extraData
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Agenda download logged successfully.'
    });
  } catch (error: any) {
    console.error('[AGENDA DOWNLOAD] Error logging download:', error);
    return NextResponse.json(
      { error: 'Failed to record agenda download.' },
      { status: 500 }
    );
  }
}
