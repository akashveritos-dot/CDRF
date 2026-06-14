import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    await query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || null, message]
    );

    return NextResponse.json({ success: true, message: 'Your inquiry has been successfully received at the DCRF Secretariat. Our operations room will route this to the appropriate coordinator and contact you shortly.' });
  } catch (error: any) {
    console.error('Submit contact message error:', error);
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 });
  }
}
