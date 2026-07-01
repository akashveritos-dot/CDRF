import { NextRequest, NextResponse } from 'next/server';
import { query, transactionalDelete } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';
import { z } from 'zod';
import logger from '@/lib/logger';

const subscriptionSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }).trim(),
  name: z.string().optional().nullable().transform(val => val && val.trim() ? val.trim() : null)
});

// Helper function to get current date/time in Indian Standard Time (IST)
function getISTDatetime(): string {
  const now = new Date();
  // IST is UTC + 5.5 hours
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffsetMs);
  const isoString = istDate.toISOString(); // "YYYY-MM-DDTHH:mm:ss.sssZ"
  return `${isoString.slice(0, 10)} ${isoString.slice(11, 19)}`;
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
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
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
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const validationResult = subscriptionSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || 'Input validation failed.';
      logger.warn({ errors: validationResult.error.format() }, 'Subscription form validation failure');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { email, name } = validationResult.data;
    const cleanEmail = email.toLowerCase();
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
      logger.info({ email: cleanEmail }, 'Subscription attempt: already subscribed/member');
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: 'This email address is already subscribed to the DCRF Policy Feed! You are already in our network and will continue receiving updates.'
      });
    }

    // Insert or update on duplicate key
    await query(
      `INSERT INTO subscriptions (name, email, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = IF(VALUES(name) IS NOT NULL, VALUES(name), name),
         updated_at = VALUES(updated_at)`,
      [name, cleanEmail, currentIst, currentIst]
    );

    logger.info({ email: cleanEmail, name }, 'New public subscription registered');

    // Trigger non-blocking background subscription confirmation email
    (async () => {
      try {
        const templates = await query<any[]>('SELECT subject, body FROM email_templates WHERE template_key = "subscriber_confirmation"');
        if (templates.length > 0) {
          const { subject, body } = templates[0];
          const displayName = name && name.trim() ? name.trim() : 'Subscriber';
          const compiledSubject = subject.replace(/{{name}}/g, displayName).replace(/{{email}}/g, cleanEmail);
          const compiledBody = body.replace(/{{name}}/g, displayName).replace(/{{email}}/g, cleanEmail);
          
          const { sendEmail } = require('@/lib/email');
          await sendEmail({
            to: cleanEmail,
            subject: compiledSubject,
            html: compiledBody
          });
        }
      } catch (err) {
        console.error('[API SUBSCRIPTIONS EMAIL ERROR]', err);
      }
    })();

    return NextResponse.json({
      success: true,
      message: 'Welcome to the DCRF Circle! Your subscription has been successfully activated. You will now receive policy briefs, hazard bulletins, and event updates directly.'
    });
  } catch (error: any) {
    logger.error(error, 'Subscribe error');
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
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
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

    const existing = await query<any[]>('SELECT email, name FROM subscriptions WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const { email, name } = existing[0];
    await transactionalDelete('subscriptions', 'id', id, session);

    await logAction(
      req,
      session,
      'DELETE',
      'Subscriptions',
      `Deleted subscription for ${name ? `${name} ` : ''}(${email})`
    );

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

