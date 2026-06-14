import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/membership/apply - Public endpoint to apply for membership
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, organization, title, tier, message, checkOnly } = body;

    // Validation
    if (!name || !email || !organization || !tier) {
      return NextResponse.json(
        { error: 'Name, email, organization, and membership tier are required fields' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if duplicate exists in memberships table
    const existing = await query<any[]>(
      'SELECT id FROM memberships WHERE email = ?',
      [cleanEmail]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: 'We have already received a DCRF membership application from this email address! Your profile is actively in our credential queue, and our coordinators will reach out via email shortly.'
      });
    }

    if (checkOnly) {
      return NextResponse.json({
        success: true,
        alreadyExists: false,
        message: 'Email is available for registration.'
      });
    }

    // Insert into memberships table
    const result = await query<any>(
      `INSERT INTO memberships (name, email, organization, title, tier, message, status, pay_status) 
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', 'Unpaid')`,
      [
        name,
        cleanEmail,
        organization,
        title || '',
        tier,
        message || ''
      ]
    );

    return NextResponse.json({
      success: true,
      applicationId: result.insertId,
      message: 'Your DCRF Federation membership request has been successfully staged! A notification has been sent to our credentials review committee, and we will contact you shortly.'
    });

  } catch (error: any) {
    console.error('Membership apply error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application. Please check your inputs and try again.' },
      { status: 500 }
    );
  }
}
