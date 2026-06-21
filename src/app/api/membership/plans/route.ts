import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const plans = await query<any[]>('SELECT name, price, price_sub_text as priceSubText, is_popular as isPopular, features_json as featuresJson FROM membership_plans');
    const discounts = await query<any[]>('SELECT tier_name, title, percentage, start_date, end_date FROM membership_discounts');

    const today = new Date();

    const activeDiscountsMap = new Map<string, any>();
    for (const d of discounts) {
      const start = new Date(d.start_date);
      const end = new Date(d.end_date);

      if (today >= start && today <= end) {
        activeDiscountsMap.set(d.tier_name, {
          title: d.title,
          percentage: d.percentage,
          startDate: d.start_date,
          endDate: d.end_date
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
