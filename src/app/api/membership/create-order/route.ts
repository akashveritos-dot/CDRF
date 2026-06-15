import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier } = body;

    if (!tier) {
      return NextResponse.json({ error: 'Tier is required' }, { status: 400 });
    }

    // For testing, override the tier amount to 1 rupee (100 paisa)
    const amountPaisa = 100; // 1 INR

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.startsWith('dummy') || keySecret.startsWith('dummy')) {
      return NextResponse.json({ error: 'Razorpay keys are not configured or are dummy keys' }, { status: 500 });
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
