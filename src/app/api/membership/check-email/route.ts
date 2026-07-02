import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Tier rank helper for user tier ranking
async function getDynamicTierRanks(): Promise<Record<string, number>> {
  try {
    const plans = await query<any[]>('SELECT name, price FROM membership_plans ORDER BY price ASC');
    const ranks: Record<string, number> = {};
    plans.forEach((p, idx) => {
      ranks[p.name] = idx;
    });
    if (!ranks['Basic']) {
      ranks['Basic'] = 0;
    }
    return ranks;
  } catch (err) {
    console.error('[getDynamicTierRanks] Failed to query plans:', err);
    return { Basic: 0, Prime: 1, Premium: 2, Gold: 3 };
  }
}

/**
 * GET /api/membership/check-email?email=x@y.com
 * Resilient — works both before AND after the lifecycle migration.
 * Falls back to a minimal query if new columns don't exist yet.
 */
export async function GET(req: NextRequest) {
  try {
    const TIER_RANK = await getDynamicTierRanks();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let rows: any[] = [];

    // ── Try full query (post-migration) ───────────────────────────────────────
    try {
      rows = await query<any[]>(
        `SELECT tier, membership_status, starts_at, expires_at, is_current
         FROM memberships
         WHERE email = ? AND is_current = 1
         ORDER BY created_at DESC
         LIMIT 1`,
        [email]
      );
    } catch (_migrationErr) {
      // is_current column doesn't exist yet — fall back to simple query
      try {
        rows = await query<any[]>(
          `SELECT tier, status, pay_status, created_at
           FROM memberships
           WHERE email = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [email]
        );

        // Map old schema to expected shape
        if (rows.length > 0) {
          const r = rows[0];
          // Only treat as active if the application was approved/paid
          if (r.pay_status === 'Paid' || r.tier === 'Basic') {
            return NextResponse.json({
              hasMembership: true,
              tier: r.tier,
              membershipStatus: 'Active',
              expiresAt: null,
              tierRank: TIER_RANK[r.tier] ?? 0,
              isExpired: false,
            });
          } else {
            return NextResponse.json({ hasMembership: false });
          }
        }
        return NextResponse.json({ hasMembership: false });
      } catch (fallbackErr) {
        console.error('[check-email] Fallback query also failed:', fallbackErr);
        return NextResponse.json({ hasMembership: false });
      }
    }

    // ── No membership found ───────────────────────────────────────────────────
    if (rows.length === 0) {
      return NextResponse.json({ hasMembership: false });
    }

    const m = rows[0];
    const now = new Date();
    const expiresAt = m.expires_at ? new Date(m.expires_at) : null;
    const isExpired = expiresAt ? expiresAt < now : false;
    const effectiveStatus = isExpired ? 'Expired' : (m.membership_status || 'Active');

    return NextResponse.json({
      hasMembership: true,
      tier: m.tier,
      membershipStatus: effectiveStatus,
      expiresAt: m.expires_at,
      tierRank: TIER_RANK[m.tier] ?? 0,
      isExpired,
    });
  } catch (error: any) {
    console.error('[check-email] Unexpected error:', error);
    return NextResponse.json({ hasMembership: false });
  }
}
