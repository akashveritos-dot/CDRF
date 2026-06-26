import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/download
 * Records a download (name + email) and returns a signed token to access the PDF.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId, name, email, designation, entityType, organizationName, mobile } = body;

    // Validate input
    if (!reportId || !name?.trim() || !email?.trim() || !designation?.trim() || !mobile?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, designation, mobile number, and report ID are required.' },
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

    // Validate 10-digit mobile
    if (!/^\d{10}$/.test(mobile.trim())) {
      return NextResponse.json(
        { error: 'Mobile number must be a 10-digit number.' },
        { status: 400 }
      );
    }

    // Validate organization name if entityType is Organization
    if (entityType === 'Organization' && !organizationName?.trim()) {
      return NextResponse.json(
        { error: 'Organization name is required when organization is selected.' },
        { status: 400 }
      );
    }

    // Verify report exists
    const reports = await query<any[]>('SELECT id, title FROM reports WHERE id = ? LIMIT 1', [reportId]);
    if (reports.length === 0) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    }

    // Record download in database
    await query(
      'INSERT INTO report_downloads (report_id, name, email, designation, entity_type, organization_name, mobile) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        reportId,
        name.trim(),
        email.trim().toLowerCase(),
        designation.trim(),
        entityType || 'Individual',
        entityType === 'Organization' ? organizationName.trim() : null,
        mobile.trim()
      ]
    );

    // Generate a signed download token (valid for 15 minutes)
    const token = await signToken({
      reportId: parseInt(reportId, 10),
      purpose: 'report_download',
      email: email.trim().toLowerCase(),
      exp: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    return NextResponse.json({
      success: true,
      token,
      serveUrl: `/api/reports/serve/${reportId}?token=${encodeURIComponent(token)}`,
    });
  } catch (error: any) {
    console.error('[DOWNLOAD] Error recording download:', error);
    return NextResponse.json(
      { error: 'Failed to process download request.' },
      { status: 500 }
    );
  }
}
