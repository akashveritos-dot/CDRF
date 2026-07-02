import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Tier rank helper for upgrade/downgrade detection
async function getDynamicTierRanks(): Promise<Record<string, number>> {
  try {
    const plans = await query<any[]>('SELECT name, price FROM membership_plans ORDER BY price ASC');
    const ranks: Record<string, number> = {};
    plans.forEach((p, idx) => {
      ranks[p.name] = idx;
    });
    // Ensure basic fallback rank
    if (!ranks['Basic']) {
      ranks['Basic'] = 0;
    }
    return ranks;
  } catch (err) {
    console.error('[getDynamicTierRanks] Failed to query plans:', err);
    return { Basic: 0, Prime: 1, Premium: 2, Gold: 3 };
  }
}

async function findExistingMembership(cleanEmail: string): Promise<any | null> {
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
    // Fallback if lifecycle columns do not exist
  }

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
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const { checkOnly } = body;

    // 1. Fetch dynamic membership form fields
    const activeFields = await query<any[]>(
      `SELECT name, label, type, is_required as isRequired 
       FROM form_fields 
       WHERE form_type = 'membership' 
       ORDER BY display_order ASC`
    );

    // Fallback if no fields found in DB
    const fieldsToValidate = activeFields.length > 0 ? activeFields : [
      { name: 'name', label: 'Full Name', type: 'text', isRequired: 1 },
      { name: 'email', label: 'Email Address', type: 'email', isRequired: 1 },
      { name: 'organization', label: 'Organisation / Institution', type: 'text', isRequired: 1 },
      { name: 'title', label: 'Professional Title', type: 'text', isRequired: 0 },
      { name: 'tier', label: 'Membership Tier', type: 'select', isRequired: 1 },
      { name: 'message', label: 'Additional Notes / Purpose', type: 'textarea', isRequired: 0 }
    ];

    // 2. Validate inputs dynamically
    const validatedData: Record<string, any> = {};
    for (const field of fieldsToValidate) {
      const isReq = field.isRequired === 1 || field.isRequired === true;
      const value = body[field.name];

      if (isReq && (value === undefined || value === null || String(value).trim() === '')) {
        return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 });
      }

      if (value !== undefined && value !== null) {
        let cleanVal = String(value).trim();
        
        // Email validation
        if (field.type === 'email' && cleanVal) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(cleanVal)) {
            return NextResponse.json({ error: `Please enter a valid email address for ${field.label}.` }, { status: 400 });
          }
          cleanVal = cleanVal.toLowerCase();
        }

        validatedData[field.name] = cleanVal;
      }
    }

    const email = validatedData.email || body.email || '';
    const name = validatedData.name || body.name || '';
    const organization = validatedData.organization || body.organization || '';
    const title = validatedData.title || body.title || '';
    const tier = validatedData.tier || body.tier || 'Basic';
    const message = validatedData.message || body.message || '';

    if (!email) {
      return NextResponse.json({ error: 'Email Address is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check for existing active/paid membership
    const existing = await findExistingMembership(cleanEmail);

    if (existing) {
      const now = new Date();
      const expiresAt = existing.expires_at ? new Date(existing.expires_at) : null;
      const isExpired = expiresAt ? expiresAt < now : false;

      if (!isExpired && existing.membership_status !== 'Cancelled') {
        const TIER_RANK = await getDynamicTierRanks();
        const existingRank = TIER_RANK[existing.tier] ?? -1;
        const requestedRank = TIER_RANK[tier] ?? -1;

        if (requestedRank === existingRank) {
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
          return NextResponse.json({
            success: true,
            alreadyExists: true,
            downgradeBlocked: true,
            existingTier: existing.tier,
            message: `You are already a ${existing.tier} member. Downgrading to ${tier} is not permitted. Consider upgrading to a higher tier instead.`,
          });
        }
      }
    }

    if (checkOnly) {
      return NextResponse.json({
        success: true,
        alreadyExists: false,
        message: 'Email is available for this plan registration.',
      });
    }

    // Collect all submitted fields in extraData
    const extraData = JSON.stringify(body);

    // Insert new application
    const result = await query<any>(
      `INSERT INTO memberships (name, email, organization, title, tier, message, status, pay_status, extra_data) 
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', 'Unpaid', ?)`,
      [name, cleanEmail, organization, title, tier, message, extraData]
    );

    // Trigger background membership application confirmation email
    (async () => {
      try {
        const planRows = await query<any[]>('SELECT price, price_sub_text as priceSubText FROM membership_plans WHERE name = ? LIMIT 1', [tier]);
        const priceVal = planRows.length > 0 ? planRows[0].price : 0;
        const subTextVal = planRows.length > 0 ? planRows[0].priceSubText : '';
        const formattedPrice = priceVal === 0 ? 'Free / Complimentary' : `₹${priceVal.toLocaleString('en-IN')}`;

        const templates = await query<any[]>('SELECT subject, body FROM email_templates WHERE template_key = "membership_registration_confirmation"');
        if (templates.length > 0) {
          const { subject, body } = templates[0];
          const compiledSubject = subject.replace(/{{name}}/g, name).replace(/{{tier}}/g, tier);
          const compiledBody = body
            .replace(/{{name}}/g, name)
            .replace(/{{tier}}/g, tier)
            .replace(/{{organization}}/g, organization || 'N/A')
            .replace(/{{price}}/g, formattedPrice)
            .replace(/{{priceSubText}}/g, subTextVal ? subTextVal.replace('Per Annum — ', '') : 'Annual');
          
          const { sendEmail } = require('@/lib/email');
          await sendEmail({
            to: cleanEmail,
            subject: compiledSubject,
            html: compiledBody
          });
        }
      } catch (err) {
        console.error('[API MEMBERSHIP APPLY EMAIL ERROR]', err);
      }
    })();

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
