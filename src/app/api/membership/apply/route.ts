import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Tier rank for upgrade/downgrade detection
const TIER_RANK: Record<string, number> = {
  Basic: 0,
  Prime: 1,
  Premium: 2,
  Gold: 3,
};

/**
 * Resilient existing-membership lookup.
 * Tries the post-migration query first; falls back to the original schema
 * if the lifecycle columns (is_current, membership_status) don't exist yet.
 */
async function findExistingMembership(cleanEmail: string): Promise<any | null> {
  // ── Try post-migration query ──────────────────────────────────────────────
  try {
    const rows = await query<any[]>(
      `SELECT id, tier, membership_status, expires_at, is_current
       FROM memberships
       WHERE email = ? AND is_current = 1
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (_) {
    // is_current / membership_status columns don't exist yet — use original schema
  }

  // ── Fallback: original schema ─────────────────────────────────────────────
  try {
    const rows = await query<any[]>(
      `SELECT id, tier, status, pay_status
       FROM memberships
       WHERE email = ?
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    // Map to unified shape — treat Paid or Basic as active
    const isActive = r.pay_status === 'Paid' || r.tier === 'Basic';
    return isActive
      ? { id: r.id, tier: r.tier, membership_status: 'Active', expires_at: null, is_current: 1 }
      : null;
  } catch (fallbackErr) {
    console.error('[apply] DB fallback query failed:', fallbackErr);
    return null;
  }
}

// POST /api/membership/apply - Public endpoint to stage membership application
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, organization, title, tier, message, checkOnly } = body;

    // Validation
    if (!name || !email || !organization || !tier) {
      return NextResponse.json(
        { error: 'Name, email, organization, and membership tier are required fields' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check for existing active/paid membership
    const existing = await findExistingMembership(cleanEmail);

    if (existing) {
      const now = new Date();
      const expiresAt = existing.expires_at ? new Date(existing.expires_at) : null;
      const isExpired = expiresAt ? expiresAt < now : false;

      // Only block if the existing membership is still active (not expired)
      if (!isExpired && existing.membership_status !== 'Cancelled') {
        const existingRank = TIER_RANK[existing.tier] ?? -1;
        const requestedRank = TIER_RANK[tier] ?? -1;

        if (requestedRank === existingRank) {
          // Same tier — already a member
          return NextResponse.json({
            success: true,
            alreadyExists: true,
            sameplan: true,
            existingTier: existing.tier,
            expiresAt: existing.expires_at,
            message: `You are already an active ${existing.tier} tier member. Your membership is valid until ${expiresAt?.toLocaleDateString('en-IN') || 'N/A'}.`,
          });
        }

        if (requestedRank < existingRank) {
          // Trying to downgrade — block
          return NextResponse.json({
            success: true,
            alreadyExists: true,
            downgradeBlocked: true,
            existingTier: existing.tier,
            message: `You are already a ${existing.tier} member. Downgrading to ${tier} is not permitted. Consider upgrading to a higher tier instead.`,
          });
        }

        // requestedRank > existingRank → valid upgrade path, fall through
      }
    }

    if (checkOnly) {
      return NextResponse.json({
        success: true,
        alreadyExists: false,
        message: 'Email is available for this plan registration.',
      });
    }

    // Insert new application (for paid tiers, this is just a staging step before payment)
    const result = await query<any>(
      `INSERT INTO memberships (name, email, organization, title, tier, message, status, pay_status) 
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', 'Unpaid')`,
      [name, cleanEmail, organization, title || '', tier, message || '']
    );

    return NextResponse.json({
      success: true,
      applicationId: result.insertId,
      message:
        'Your DCRF Federation membership request has been successfully staged! A notification has been sent to our credentials review committee, and we will contact you shortly.',
    });
  } catch (error: any) {
    console.error('Membership apply error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application. Please check your inputs and try again.' },
      { status: 500 }
    );
  }
}
