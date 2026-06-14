import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier } = body;

    if (!tier) {
      return NextResponse.json({ error: 'Tier is required' }, { status: 400 });
    }

    // Calculate amount in paisa (1 INR = 100 Paisa)
    let amountPaisa = 0;
    if (tier === 'Prime') amountPaisa = 2000000;
    else if (tier === 'Premium') amountPaisa = 5000000;
    else if (tier === 'Gold') amountPaisa = 10000000;
    else {
      return NextResponse.json({ error: 'Invalid paid membership tier' }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If Razorpay keys are configured, attempt to create order via Razorpay API
    if (keyId && keySecret && !keyId.startsWith('dummy') && !keySecret.startsWith('dummy')) {
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
            isMock: false
          });
        } else {
          const errData = await res.text();
          console.warn('Razorpay API order creation failed, falling back to mock. Details:', errData);
        }
      } catch (err) {
        console.error('Error calling Razorpay API, falling back to mock:', err);
      }
    }

    // Fallback: Generate a mock Order ID for local testing/development
    const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 10)}${Date.now().toString().slice(-4)}`;
    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      isMock: true
    });

  } catch (error: any) {
    console.error('Create order API error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
