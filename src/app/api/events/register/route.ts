import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/events/register - Public endpoint to register for the conclave
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, designation = '', role } = body;

    // Validate required fields
    if (!name || !email || !company || !role) {
      return NextResponse.json(
        { error: 'Name, email, company, and attendance mode are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanCompany = company.trim();
    const cleanDesignation = designation ? designation.trim() : null;
    const cleanRole = role.trim();

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

    // Insert new registration
    await query(
      `INSERT INTO event_registrations (name, email, company, designation, role, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [cleanName, cleanEmail, cleanCompany, cleanDesignation, cleanRole]
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
