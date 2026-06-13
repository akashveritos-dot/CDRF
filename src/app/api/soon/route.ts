import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/soon - Fetch all launching soon registrations (SUPERADMIN only)
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Access denied. SUPERADMIN only.' }, { status: 403 });
    }

    const registrations = await query<any[]>(
      'SELECT id, name, email, organization, interest, created_at FROM soon_registrations ORDER BY id DESC'
    );

    return NextResponse.json({ registrations });
  } catch (error: any) {
    console.error('Fetch soon registrations error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve registrations' },
      { status: 500 }
    );
  }
}

// POST /api/soon - Register new interest from launching soon landing page (Public)
export async function POST(req: NextRequest) {
  try {
    const { name, email, organization, interest } = await req.json();

    if (!name || !email || !interest) {
      return NextResponse.json(
        { error: 'Name, email, and area of interest are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format. Please double check your email address." },
        { status: 400 }
      );
    }

    try {
      await query(
        'INSERT INTO soon_registrations (name, email, organization, interest) VALUES (?, ?, ?, ?)',
        [name.trim(), email.trim(), organization ? organization.trim() : null, interest.trim()]
      );
      
      return NextResponse.json({ success: true, message: 'Interest registered successfully' });
    } catch (dbErr: any) {
      // Check for duplicate key error (MySQL code 1062 or SQL State 23000)
      if (dbErr.message.includes('Duplicate entry') || dbErr.message.includes('1062') || dbErr.code === 'ER_DUP_ENTRY') {
        return NextResponse.json(
          { error: 'This email address has already been registered.' },
          { status: 400 }
        );
      }
      throw dbErr;
    }
  } catch (error: any) {
    console.error('Soon registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
