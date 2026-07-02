import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Self-healing migration
    try {
      const colCheck = await query<any[]>("SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_name = 'membership_discounts' AND column_name = 'is_active'");
      const exists = colCheck && colCheck[0]?.cnt > 0;
      if (!exists) {
        await query("ALTER TABLE membership_discounts ADD COLUMN is_active TINYINT DEFAULT 1");
      }
    } catch (err: any) {
      console.warn('[DB MIGRATION WARN] Failed to add is_active column:', err);
    }

    const plans = await query<any[]>('SELECT name, price, price_sub_text as priceSubText, is_popular as isPopular, features_json as featuresJson FROM membership_plans');
    const discounts = await query<any[]>('SELECT tier_name, title, percentage, start_date, end_date, is_active FROM membership_discounts');

    const today = new Date();

    const activeDiscountsMap = new Map<string, any>();
    for (const d of discounts) {
      const start = new Date(d.start_date);
      const end = new Date(d.end_date);
      const isActive = d.is_active === 1 || d.is_active === true || d.is_active === null;

      if (isActive && today >= start && today <= end) {
        activeDiscountsMap.set(d.tier_name, {
          title: d.title,
          percentage: d.percentage,
          startDate: d.start_date,
          endDate: d.end_date,
          isActive: isActive
        });
      }
    }

    const processedPlans = plans.map(p => {
      const discount = activeDiscountsMap.get(p.name) || null;
      let parsedFeatures = {};
      try {
        parsedFeatures = JSON.parse(p.featuresJson || '{}');
      } catch (err) {
        console.error('Failed to parse features JSON for', p.name, err);
      }

      return {
        name: p.name,
        price: p.price, // raw numeric price in INR
        priceSubText: p.priceSubText,
        isPopular: !!p.isPopular,
        features: parsedFeatures,
        discount
      };
    });

    return NextResponse.json({ success: true, plans: processedPlans });
  } catch (error: any) {
    console.error('Fetch membership plans API error:', error);
    return NextResponse.json({ error: 'Failed to fetch membership plans' }, { status: 500 });
  }
}
