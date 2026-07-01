import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { welcomeEmail, upgradeConfirmationEmail } from '@/lib/emailTemplates';

const TIER_RANK: Record<string, number> = {
  Basic: 0,
  Prime: 1,
  Premium: 2,
  Gold: 3,
};

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
      signature,
    } = body;

    // Validation
    if (!name || !email || !organization || !tier || !paymentId || !orderId) {
      return NextResponse.json(
        { error: 'Name, email, organization, tier, Payment ID, and Order ID are required fields' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Fetch the plan details so we can calculate expires_at and fill the welcome template dynamically
    const planRows = await query<any[]>(
      'SELECT price, price_sub_text as priceSubText, duration_months FROM membership_plans WHERE name = ? LIMIT 1',
      [tier]
    );
    const durationMonths: number = planRows[0]?.duration_months ?? 12;
    const planPrice = planRows[0]?.price ?? 0;
    const planSubText = planRows[0]?.priceSubText ?? '';

    // Compute membership validity period
    const startsAt = new Date();
    let expiresAt: Date | null = null;
    if (durationMonths > 0) {
      expiresAt = new Date(startsAt);
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
    }

    const formatDatetime = (d: Date) =>
      d.toISOString().slice(0, 19).replace('T', ' ');

    const paymentDetails = JSON.stringify({
      payment_id: paymentId,
      order_id: orderId,
      signature: signature || '',
      paid_at: startsAt.toISOString(),
    });

    // Check if the user already has an active membership (upgrade scenario)
    const existingRows = await query<any[]>(
      `SELECT id, tier, membership_status, expires_at FROM memberships 
       WHERE email = ? AND is_current = 1 ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail]
    );

    let isUpgrade = false;
    let previousTier = '';
    let previousId: number | null = null;

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      const existingRank = TIER_RANK[existing.tier] ?? -1;
      const requestedRank = TIER_RANK[tier] ?? -1;

      if (requestedRank > existingRank) {
        isUpgrade = true;
        previousTier = existing.tier;
        previousId = existing.id;

        // Mark previous membership as superseded
        await query(
          `UPDATE memberships 
           SET is_current = 0, membership_status = 'Renewed' 
           WHERE id = ?`,
          [previousId]
        );

        // Log the upgrade action in history
        await query(
          `INSERT INTO membership_history (membership_id, email, tier, action, notes) 
           VALUES (?, ?, ?, 'Upgraded', ?)`,
          [
            previousId,
            cleanEmail,
            tier,
            `Upgraded from ${previousTier} to ${tier} on ${startsAt.toISOString()}`,
          ]
        );
      } else if (requestedRank === existingRank) {
        // Same tier — this shouldn't reach here normally (blocked in apply), but handle gracefully
        return NextResponse.json({
          success: false,
          alreadyExists: true,
          message: 'You are already an active member of this plan.',
        });
      }
    }

    const extraData = JSON.stringify(body);

    // Insert new active membership row
    const result = await query<any>(
      `INSERT INTO memberships 
       (name, email, organization, title, tier, message, status, pay_status, payment_details, 
        membership_status, starts_at, expires_at, is_current, extra_data)
       VALUES (?, ?, ?, ?, ?, ?, 'Approved', 'Paid', ?, 'Active', ?, ?, 1, ?)`,
      [
        name,
        cleanEmail,
        organization,
        title || '',
        tier,
        message || '',
        paymentDetails,
        formatDatetime(startsAt),
        expiresAt ? formatDatetime(expiresAt) : null,
        extraData
      ]
    );

    const newMembershipId = result.insertId;

    // Log creation in history
    await query(
      `INSERT INTO membership_history (membership_id, email, tier, action, notes) 
       VALUES (?, ?, ?, 'Created', ?)`,
      [
        newMembershipId,
        cleanEmail,
        tier,
        isUpgrade
          ? `Payment ${paymentId} — Upgrade from ${previousTier}`
          : `Payment ${paymentId} — New membership`,
      ]
    );

    // Send confirmation email in background (non-blocking)
    const emailSubject = isUpgrade
      ? `DCRF Membership Upgrade Confirmed — ${tier} Tier`
      : `Welcome to DCRF Federation — ${tier} Membership Activated`;

    const emailHtml = isUpgrade
      ? upgradeConfirmationEmail({
          name,
          oldTier: previousTier,
          newTier: tier,
          expiresAt: expiresAt ? expiresAt.toISOString() : '',
          paymentId,
          price: planPrice,
          priceSubText: planSubText
        })
      : welcomeEmail({
          name,
          tier,
          startsAt: startsAt.toISOString(),
          expiresAt: expiresAt ? expiresAt.toISOString() : '',
          paymentId,
          price: planPrice,
          priceSubText: planSubText,
          organization,
          title
        });

    sendEmail({ to: cleanEmail, subject: emailSubject, html: emailHtml }).catch((err) => {
      console.error('[PAYMENT SUCCESS] Failed to send welcome email:', err);
    });

    return NextResponse.json({
      success: true,
      applicationId: newMembershipId,
      isUpgrade,
      expiresAt: expiresAt?.toISOString() || null,
      message: isUpgrade
        ? `Membership upgraded to ${tier} successfully! Your new membership is valid until ${expiresAt?.toLocaleDateString('en-IN') || 'N/A'}.`
        : 'Payment verified and membership activated successfully!',
    });
  } catch (error: any) {
    console.error('Payment success verification and insert error:', error);
    return NextResponse.json(
      { error: 'Failed to record payment verification. Please contact support.' },
      { status: 500 }
    );
  }
}
