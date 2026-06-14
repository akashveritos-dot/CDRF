import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { logAction } from '@/lib/audit';

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

    // Print simulated email transmission details to server stdout
    console.log('------------------------------------------------------------');
    console.log(`[SIMULATED EMAIL SENT BY ${session.email}]:`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: \n${body}`);
    console.log('------------------------------------------------------------');

    // Audit the email sending action
    await logAction(
      req,
      session,
      'OTHER',
      'AI Chatbot',
      `Sent email via Chatbot assistant to "${to}" | Subject: "${subject}"`
    );

    return NextResponse.json({
      success: true,
      message: `Email to ${to} has been compiled and sent successfully.`
    });
  } catch (error: any) {
    console.error('Send email API error:', error);
    return NextResponse.json(
      { error: 'Failed to process email dispatch request' },
      { status: 500 }
    );
  }
}
