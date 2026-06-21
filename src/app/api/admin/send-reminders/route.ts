import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/email';
import { renewalReminderEmail } from '@/lib/emailTemplates';

/**
 * POST /api/admin/send-reminders
 * Admin-triggered endpoint that scans for memberships expiring in:
 *   - 30 days → sends a heads-up reminder
 *   - 7 days  → sends an urgent reminder
 *   - 0 days  → sends a final expiry notice
 * Returns a summary of emails sent.
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();

    // Fetch all active memberships that expire within the next 31 days
    const expiringRows = await query<any[]>(
      `SELECT id, name, email, tier, expires_at 
       FROM memberships 
       WHERE is_current = 1 
         AND membership_status = 'Active'
         AND expires_at IS NOT NULL
         AND expires_at >= NOW()
         AND expires_at <= DATE_ADD(NOW(), INTERVAL 31 DAY)
       ORDER BY expires_at ASC`,
      []
    );

    // Fetch all available plans for upgrade suggestions
    const allPlans = await query<any[]>(
      'SELECT name, price FROM membership_plans WHERE price > 0 ORDER BY price ASC',
      []
    );

    const TIER_RANK: Record<string, number> = { Basic: 0, Prime: 1, Premium: 2, Gold: 3 };

    let sent30 = 0;
    let sent7 = 0;
    let sent0 = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const m of expiringRows) {
      const expiresAt = new Date(m.expires_at);
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Only send on exact day thresholds (30, 7, 0)
      let daysLeft: number | null = null;
      if (diffDays === 30) daysLeft = 30;
      else if (diffDays === 7) daysLeft = 7;
      else if (diffDays === 0) daysLeft = 0;
      else {
        skipped++;
        continue;
      }

      // Build upgrade options (only show higher tiers)
      const upgradePlans = allPlans.filter(
        (p) => (TIER_RANK[p.name] ?? -1) > (TIER_RANK[m.tier] ?? -1)
      );

      const html = renewalReminderEmail({
        name: m.name,
        tier: m.tier,
        expiresAt: m.expires_at,
        daysLeft,
        upgradePlans,
      });

      const urgency = daysLeft === 0 ? 'URGENT: ' : daysLeft <= 7 ? 'Action Required: ' : '';
      const subject = `${urgency}Your DCRF ${m.tier} Membership Expires ${daysLeft === 0 ? 'Today' : `in ${daysLeft} Days`}`;

      const result = await sendEmail({ to: m.email, subject, html });

      if (result.success) {
        if (daysLeft === 30) sent30++;
        else if (daysLeft === 7) sent7++;
        else if (daysLeft === 0) sent0++;

        // Log in history
        await query(
          `INSERT INTO membership_history (membership_id, email, tier, action, notes) 
           VALUES (?, ?, ?, 'Expired', ?)`,
          [
            m.id,
            m.email,
            m.tier,
            `Renewal reminder sent (${daysLeft} days remaining) by admin ${session.email}`,
          ]
        ).catch(() => {}); // Non-critical
      } else {
        errors.push(`${m.email}: ${result.error}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        sent30DayReminders: sent30,
        sent7DayReminders: sent7,
        sentExpiryNotices: sent0,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      },
      message: `Reminders sent: ${sent30} (30-day), ${sent7} (7-day), ${sent0} (today). ${errors.length > 0 ? `${errors.length} failed.` : 'All successful.'}`,
    });
  } catch (error: any) {
    console.error('Send reminders error:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
