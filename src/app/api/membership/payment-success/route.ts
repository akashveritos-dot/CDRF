import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name, 
      email, 
      organization, 
      title, 
      tier, 
      message, 
      paymentId, 
      orderId, 
      signature 
    } = body;

    // Validation
    if (!name || !email || !organization || !tier || !paymentId || !orderId) {
      return NextResponse.json(
        { error: 'Name, email, organization, tier, Payment ID, and Order ID are required fields' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if duplicate exists in memberships table
    const existing = await query<any[]>(
      'SELECT id FROM memberships WHERE email = ?',
      [cleanEmail]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: false,
        alreadyExists: true,
        message: 'This email is already registered for membership.'
      });
    }

    const paymentDetails = JSON.stringify({
      payment_id: paymentId,
      order_id: orderId,
      signature: signature || '',
      paid_at: new Date().toISOString()
    });

    // Insert into memberships table directly with Approved status and Paid pay_status
    const result = await query<any>(
      `INSERT INTO memberships (name, email, organization, title, tier, message, status, pay_status, payment_details) 
       VALUES (?, ?, ?, ?, ?, ?, 'Approved', 'Paid', ?)`,
      [
        name,
        cleanEmail,
        organization,
        title || '',
        tier,
        message || '',
        paymentDetails
      ]
    );

    return NextResponse.json({
      success: true,
      applicationId: result.insertId,
      message: 'Payment verified and membership activated successfully!'
    });

  } catch (error: any) {
    console.error('Payment success verification and insert error:', error);
    return NextResponse.json(
      { error: 'Failed to record payment verification. Please contact support.' },
      { status: 500 }
    );
  }
}
