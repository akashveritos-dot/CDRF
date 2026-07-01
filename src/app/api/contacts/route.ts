import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    // 1. Fetch active contact form fields from DB
    const activeFields = await query<any[]>(
      `SELECT name, label, type, is_required as isRequired 
       FROM form_fields 
       WHERE form_type = 'contact' 
       ORDER BY display_order ASC`
    );

    // If no fields found in DB, use default hardcoded ones as fallback
    const fieldsToValidate = activeFields.length > 0 ? activeFields : [
      { name: 'name', label: 'Full Name', type: 'text', isRequired: 1 },
      { name: 'email', label: 'Email Address', type: 'email', isRequired: 1 },
      { name: 'subject', label: 'Subject', type: 'text', isRequired: 1 },
      { name: 'message', label: 'Message Details', type: 'textarea', isRequired: 1 }
    ];

    // 2. Validate inputs dynamically based on DB field config
    const validatedData: Record<string, any> = {};
    for (const field of fieldsToValidate) {
      const isReq = field.isRequired === 1 || field.isRequired === true;
      const value = body[field.name];

      if (isReq && (value === undefined || value === null || String(value).trim() === '')) {
        return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 });
      }

      if (value !== undefined && value !== null) {
        let cleanVal = String(value).trim();
        
        // Basic email format check if type is email
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

    // 3. Map standard columns and extra dynamic fields
    const name = validatedData.name || body.name || '';
    const email = validatedData.email || body.email || '';
    const subject = validatedData.subject || body.subject || null;
    const message = validatedData.message || body.message || '';

    // Collect all submitted key-values in extra_data
    const extraData = JSON.stringify(body);

    // 4. Save to database
    await query(
      'INSERT INTO contact_messages (name, email, subject, message, extra_data) VALUES (?, ?, ?, ?, ?)',
      [name, email, subject, message, extraData]
    );

    logger.info({ email, name }, 'Saved dynamic public contact inquiry message');

    return NextResponse.json({ 
      success: true, 
      message: 'Your inquiry has been successfully received at the DCRF Secretariat. Our operations room will route this to the appropriate coordinator and contact you shortly.' 
    });
  } catch (error: any) {
    logger.error(error, 'Submit contact message error');
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 });
  }
}
