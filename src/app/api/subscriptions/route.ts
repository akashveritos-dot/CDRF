import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// Helper function to get current date/time in Indian Standard Time (IST)
function getISTDatetime(): string {
  const now = new Date();
  // IST is UTC + 5.5 hours
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffsetMs);
  const isoString = istDate.toISOString(); // "YYYY-MM-DDTHH:mm:ss.sssZ"
  // Format as MySQL DATETIME: YYYY-MM-DD HH:mm:ss
  return isoString.slice(0, 10) + ' ' + isoString.slice(11, 19);
}

// GET /api/subscriptions - Fetch subscriptions (Admin Secured)
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const subscriptions = await query<any[]>(
      'SELECT id, name, email, created_at, updated_at FROM subscriptions ORDER BY created_at DESC'
    );

    return new NextResponse(JSON.stringify(subscriptions), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error('Fetch subscriptions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Submit email/name to subscribe (Public)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name && name.trim() ? name.trim() : null;
    const currentIst = getISTDatetime();

    // Check if already subscribed
    const existingSub = await query<any[]>(
      'SELECT id FROM subscriptions WHERE email = ?',
      [cleanEmail]
    );

    // Check if already a member
    const existingMember = await query<any[]>(
      'SELECT id FROM memberships WHERE email = ?',
      [cleanEmail]
    );

    if (existingSub.length > 0 || existingMember.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: 'You have already subscribed with this email address.'
      });
    }

    // Insert or update on duplicate key (if name is supplied, update it, otherwise keep old name)
    await query(
      `INSERT INTO subscriptions (name, email, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = IF(VALUES(name) IS NOT NULL, VALUES(name), name),
         updated_at = VALUES(updated_at)`,
      [cleanName, cleanEmail, currentIst, currentIst]
    );

    return NextResponse.json({
      success: true,
      message: 'Subscribed successfully'
    });
  } catch (error: any) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions - Delete a subscription (Admin Secured)
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    await query('DELETE FROM subscriptions WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}

