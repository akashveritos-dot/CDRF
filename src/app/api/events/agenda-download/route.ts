import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/events/agenda-download
 * Logs an agenda download event in the report_downloads database.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, designation, organizationName, mobile, entityType } = body;

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email address is required to download the agenda.' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Log the download with a sentinel report_id = 9999 representing the Conclave Agenda
    await query(
      `INSERT INTO report_downloads (
        report_id, name, email, designation, entity_type, organization_name, mobile
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        9999,
        (name || 'Conclave Visitor').trim(),
        email.trim().toLowerCase(),
        (designation || 'Visitor').trim(),
        entityType || 'Individual',
        (organizationName || '').trim(),
        (mobile || '').trim()
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
