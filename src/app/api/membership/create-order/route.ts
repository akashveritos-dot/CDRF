import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier } = body;

    if (!tier) {
      return NextResponse.json({ error: 'Tier is required' }, { status: 400 });
    }

    // Fetch plan price dynamically from database
    const planRes = await query<any[]>('SELECT price FROM membership_plans WHERE name = ?', [tier]);
    if (!planRes || planRes.length === 0) {
      return NextResponse.json({ error: `Plan tier ${tier} not found` }, { status: 404 });
    }

    let originalPrice = planRes[0].price; // INR price
    let finalPrice = originalPrice;

    // Check for active discount
    const discountRes = await query<any[]>('SELECT percentage, start_date, end_date, is_active FROM membership_discounts WHERE tier_name = ?', [tier]);
    if (discountRes && discountRes.length > 0) {
      const d = discountRes[0];
      const today = new Date();
      const start = new Date(d.start_date);
      const end = new Date(d.end_date);
      const isActive = d.is_active === 1 || d.is_active === true || d.is_active === null;

      if (isActive && today >= start && today <= end) {
        finalPrice = originalPrice - (originalPrice * (d.percentage / 100));
      }
    }

    const amountPaisa = Math.round(finalPrice * 100);

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.startsWith('dummy') || keySecret.startsWith('dummy')) {
      return NextResponse.json({
        success: true,
        orderId: `order_mock_${Math.random().toString(36).substring(2, 10)}${Date.now()}`,
        amount: amountPaisa,
        isMock: true
      });
    }

    try {
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountPaisa,
          currency: 'INR',
          receipt: `receipt_m_${Date.now()}`
        })
      });

      if (res.ok) {
        const order = await res.json();
        return NextResponse.json({
          success: true,
          orderId: order.id,
          amount: order.amount,
          isMock: false
        });
      } else {
        const errData = await res.text();
        console.error('Razorpay API order creation failed:', errData);
        return NextResponse.json({ error: `Razorpay API order creation failed: ${errData}` }, { status: 500 });
      }
    } catch (err: any) {
      console.error('Error calling Razorpay API:', err);
      return NextResponse.json({ error: `Error calling Razorpay API: ${err.message || err}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Create order API error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
