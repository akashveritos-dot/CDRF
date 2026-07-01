import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
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

    const { to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Recipient email (to), subject, and body are required fields.' },
        { status: 400 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
    }

    // Trigger sending asynchronously in the background so we do not block Next.js response cycle
    (async () => {
      console.log(`[BACKGROUND SENDING STARTED] Sending ${recipients.length} emails. Subject: "${subject}"`);
      for (const email of recipients) {
        try {
          const target = email.trim();
          if (!target) continue;
          await sendEmail({
            to: target,
            subject,
            html: body
          });
        } catch (err: any) {
          console.error(`Failed to send background email to ${email}:`, err.message || err);
        }
      }
      console.log(`[BACKGROUND SENDING FINISHED] Completed dispatch to ${recipients.length} recipients.`);
    })();

    // Audit the email sending action
    await logAction(
      req,
      session,
      'OTHER',
      'Email Sender',
      `Dispatched bulk emails to ${recipients.length} recipients | Subject: "${subject}"`
    );

    return NextResponse.json({
      success: true,
      message: `Email dispatch initiated for ${recipients.length} recipients in the background.`
    });
  } catch (error: any) {
    console.error('Send email API error:', error);
    return NextResponse.json(
      { error: 'Failed to process email dispatch request' },
      { status: 500 }
    );
  }
}
