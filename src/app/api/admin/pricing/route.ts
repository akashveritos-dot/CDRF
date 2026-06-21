import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function checkSuperAdmin(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  
  const session = await verifyToken(token);
  if (!session || session.role !== 'SUPERADMIN') return null;
  return session;
}

export async function GET(req: NextRequest) {
  try {
    const session = await checkSuperAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 403 });
    }

    const plans = await query<any[]>('SELECT id, name, price, price_sub_text as priceSubText, is_popular as isPopular, features_json as featuresJson FROM membership_plans');
    const discounts = await query<any[]>('SELECT id, tier_name as tierName, title, percentage, start_date as startDate, end_date as endDate FROM membership_discounts');

    const parsedPlans = plans.map(p => {
      let features = {};
      try {
        features = JSON.parse(p.featuresJson || '{}');
      } catch (err) {}
      return { ...p, isPopular: !!p.isPopular, features };
    });

    return NextResponse.json({ success: true, plans: parsedPlans, discounts });
  } catch (error: any) {
    console.error('Admin pricing GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve pricing data' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await checkSuperAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, price, priceSubText, isPopular, features } = body;

    if (!name) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });
    }

    const featuresJson = JSON.stringify(features || {});
    const isPopularInt = isPopular ? 1 : 0;

    await query(
      'UPDATE membership_plans SET price = ?, price_sub_text = ?, is_popular = ?, features_json = ? WHERE name = ?',
      [price, priceSubText, isPopularInt, featuresJson, name]
    );

    return NextResponse.json({ success: true, message: `Plan ${name} updated successfully` });
  } catch (error: any) {
    console.error('Admin pricing PUT error:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await checkSuperAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { tierName, title, percentage, startDate, endDate } = body;

    if (!tierName || !title || percentage === undefined || !startDate || !endDate) {
      return NextResponse.json({ error: 'All discount fields are required' }, { status: 400 });
    }

    // Insert or update on duplicate key
    await query(
      `INSERT INTO membership_discounts (tier_name, title, percentage, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE title = VALUES(title), percentage = VALUES(percentage), start_date = VALUES(start_date), end_date = VALUES(end_date)`,
      [tierName, title, percentage, startDate, endDate]
    );

    return NextResponse.json({ success: true, message: `Discount for ${tierName} saved successfully` });
  } catch (error: any) {
    console.error('Admin discount POST error:', error);
    return NextResponse.json({ error: 'Failed to save discount' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await checkSuperAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tierName = searchParams.get('tierName');

    if (!tierName) {
      return NextResponse.json({ error: 'Tier name is required' }, { status: 400 });
    }

    await query('DELETE FROM membership_discounts WHERE tier_name = ?', [tierName]);

    return NextResponse.json({ success: true, message: `Discount for ${tierName} cleared successfully` });
  } catch (error: any) {
    console.error('Admin discount DELETE error:', error);
    return NextResponse.json({ error: 'Failed to clear discount' }, { status: 500 });
  }
}
