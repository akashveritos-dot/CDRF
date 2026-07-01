import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/events/register - Public endpoint to register for the conclave
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    // 1. Fetch active event registration fields
    const activeFields = await query<any[]>(
      `SELECT name, label, type, is_required as isRequired 
       FROM form_fields 
       WHERE form_type = 'event_register' 
       ORDER BY display_order ASC`
    );

    // Fallback if no fields found in DB
    const fieldsToValidate = activeFields.length > 0 ? activeFields : [
      { name: 'name', label: 'Full Name', type: 'text', isRequired: 1 },
      { name: 'email', label: 'Email Address', type: 'email', isRequired: 1 },
      { name: 'company', label: 'Company / Organisation', type: 'text', isRequired: 1 },
      { name: 'designation', label: 'Designation', type: 'text', isRequired: 0 },
      { name: 'role', label: 'Attendance Mode', type: 'select', isRequired: 1 }
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
    const name = validatedData.name || body.name || '';
    const company = validatedData.company || body.company || '';
    const designation = validatedData.designation || body.designation || null;
    const role = validatedData.role || body.role || 'Delegate';

    if (!email) {
      return NextResponse.json({ error: 'Email Address is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = await query<any[]>(
      'SELECT id FROM event_registrations WHERE email = ?',
      [cleanEmail]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'You are already registered for the DCRC Conclave! Your application is in our staging queue, and we will email your accreditation details shortly.' },
        { status: 400 }
      );
    }

    // Collect all submitted inputs as extraData
    const extraData = JSON.stringify(body);

    // Insert new registration
    await query(
      `INSERT INTO event_registrations (name, email, company, designation, role, status, extra_data)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
      [name.trim(), cleanEmail, company.trim(), designation ? designation.trim() : null, role.trim(), extraData]
    );

    return NextResponse.json({
      success: true,
      message: 'Your delegate application has been successfully logged! The DCRF Secretariat will review your credentials and issue your official pass via email soon.'
    });

  } catch (error: any) {
    console.error('Event registration API error:', error);
    return NextResponse.json(
      { error: 'Failed to record registration details' },
      { status: 500 }
    );
  }
}
