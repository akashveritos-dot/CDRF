import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/membership/apply - Public endpoint to apply for membership
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, organization, title, tier, message } = body;

    // Validation
    if (!name || !email || !organization || !tier) {
      return NextResponse.json(
        { error: 'Name, email, organization, and membership tier are required fields' },
        { status: 400 }
      );
    }

    // Insert into memberships table
    const result = await query<any>(
      `INSERT INTO memberships (name, email, organization, title, tier, message, status, pay_status) 
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', 'Unpaid')`,
      [
        name,
        email,
        organization,
        title || '',
        tier,
        message || ''
      ]
    );

    return NextResponse.json({
      success: true,
      applicationId: result.insertId,
      message: 'Membership application submitted successfully. The secretariat will review your credentials.'
    });

  } catch (error: any) {
    console.error('Membership apply error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application. Please check your inputs and try again.' },
      { status: 500 }
    );
  }
}
