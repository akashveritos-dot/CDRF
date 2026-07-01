import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const LOGO_URL = 'https://dcrfindia.org/dcrf_icon-Photoroom.png';

const emailShell = (title: string, subtitle: string, bodyContent: string, footerNote: string) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DCRF Federation</title>
  <style>
    @media only screen and (max-width:600px){
      .email-container{width:100%!important;margin:0!important}
      .header-pad{padding:24px 16px!important}
      .body-pad{padding:20px 16px!important}
      .footer-pad{padding:16px 12px!important}
      h1.email-title{font-size:22px!important}
      .cta-btn{display:block!important;text-align:center!important;width:auto!important;padding:14px 20px!important}
    }
    * { box-sizing: border-box; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1d;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0f1d;padding:20px 0">
    <tr>
      <td align="center" valign="top">
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5)">
          <!-- HEADER -->
          <tr>
            <td class="header-pad" align="center" style="background:linear-gradient(135deg,#7f0000 0%,#b91c1c 50%,#7f0000 100%);padding:32px 32px">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px">
                <tr>
                  <td align="center">
                    <img src="${LOGO_URL}" alt="DCRF Logo" width="60" height="60" style="display:block;width:60px;height:60px;object-fit:contain;border-radius:12px;background:rgba(255,255,255,0.12);padding:8px" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:10px">
                    <span style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:3px;text-transform:uppercase">DCRF</span>
                  </td>
                </tr>
              </table>
              <h1 class="email-title" style="margin:6px 0 0;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#ffffff">${title}</h1>
              <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75)">${subtitle}</p>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td class="body-pad" style="background-color:#111827;padding:28px 32px;color:#94a3b8;font-size:14px;line-height:1.6">
              ${bodyContent}
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td class="footer-pad" align="center" style="background-color:#0a0f1d;padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06)">
              <span style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.5px">DISASTER CYBER RESPONSE FEDERATION</span>
              <p style="margin:6px 0;font-size:11px;color:#475569">${footerNote}</p>
              <p style="margin:0;font-size:11px;color:#475569">
                <a href="https://dcrfindia.org" style="color:#64748b;text-decoration:underline">dcrfindia.org</a>
                &nbsp;|&nbsp;
                <a href="mailto:info@dcrfindia.org" style="color:#64748b;text-decoration:underline">info@dcrfindia.org</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const defaultTemplates = [
  {
    key: 'membership_registration_confirmation',
    name: 'Membership Application Confirmed',
    subject: 'DCRF Membership Application Received',
    body: emailShell(
      'Application Staged',
      'Membership Review Process',
      `<p style="margin:0 0 16px;">Dear {{name}},</p>
       <p style="margin:0 0 16px;">We have successfully received your membership application for the <strong>{{tier}}</strong> tier.</p>
       <p style="margin:0 0 16px;">Our Secretariat is currently verifying your details. For paid tiers, once review is complete, your payment and member dashboard credentials will be activated.</p>
       <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:20px;padding:12px">
         <tr><td style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;">Name</td><td style="color:#ffffff;font-weight:600;">{{name}}</td></tr>
         <tr><td style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;padding-top:8px;">Tier</td><td style="color:#ffffff;font-weight:600;padding-top:8px;">{{tier}}</td></tr>
         <tr><td style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;padding-top:8px;">Organization</td><td style="color:#ffffff;font-weight:600;padding-top:8px;">{{organization}}</td></tr>
         <tr><td style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;padding-top:8px;">Pricing</td><td style="color:#ffffff;font-weight:600;padding-top:8px;">{{price}} ({{priceSubText}})</td></tr>
       </table>
       <p style="margin:0;">No action is required from you at this moment. You will receive an update once the verification is finished.</p>`,
      'This is an automated confirmation of application staging. Please keep this email for your records.'
    )
  },
  {
    key: 'subscriber_confirmation',
    name: 'Newsletter Subscription Active',
    subject: 'Welcome to the DCRF Circle!',
    body: emailShell(
      'Subscription Activated',
      'DCRF Resilience & Cyber updates',
      `<p style="margin:0 0 16px;">Hello,</p>
       <p style="margin:0 0 16px;">Thank you for subscribing to the <strong>Disaster Cyber Response Federation (DCRF) Policy Feed</strong>!</p>
       <p style="margin:0 0 24px;">You have joined our network of policy experts, disaster managers, and cybersecurity professionals. You will now receive policy briefs, bulletin updates, and notifications on upcoming conclaves and workshops directly in your inbox.</p>
       <div align="center" style="margin-bottom:24px">
         <a class="cta-btn" href="https://dcrfindia.org" style="display:inline-block;background:linear-gradient(135deg,#b91c1c,#ef4444);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:6px">Visit Website</a>
       </div>
       <p style="margin:0;">You can unsubscribe or change your preferences at any time by contacting the Secretariat.</p>`,
      'This confirmation was sent automatically upon newsletter subscription.'
    )
  },
  {
    key: 'general_newsletter',
    name: 'Branded Custom Announcement',
    subject: 'DCRF Cyber & Disaster Resilience Update',
    body: emailShell(
      'Federation Announcement',
      'Updates & Security Bulletins',
      `<p style="margin:0 0 16px;">Dear Member / Partner,</p>
       <p style="margin:0 0 24px;">[Enter your custom message here. You can edit this text fully before dispatching this email to your selected contacts from the admin tables.]</p>
       <div align="center" style="margin-bottom:24px">
         <a class="cta-btn" href="https://dcrfindia.org" style="display:inline-block;background:linear-gradient(135deg,#b91c1c,#ef4444);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:6px">Explore Bulletins</a>
       </div>
       <p style="margin:0;">Disaster Cyber Response Federation Secretariat</p>`,
      'This email was sent by the DCRF Administration panel.'
    )
  }
];

async function ensureTableAndSeed() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS \`email_templates\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`template_key\` VARCHAR(100) NOT NULL UNIQUE,
        \`name\` VARCHAR(255) NOT NULL,
        \`subject\` VARCHAR(255) NOT NULL,
        \`body\` TEXT NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    for (const t of defaultTemplates) {
      await query(`
        INSERT IGNORE INTO \`email_templates\` (template_key, name, subject, body) 
        VALUES (?, ?, ?, ?)
      `, [t.key, t.name, t.subject, t.body]);
    }
  } catch (err) {
    console.error('[API TEMPLATES] Self-healing failed:', err);
  }
}

// GET /api/admin/email-templates
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureTableAndSeed();

    const templates = await query<any[]>('SELECT id, template_key as templateKey, name, subject, body, updated_at as updatedAt FROM email_templates ORDER BY name ASC');
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error('[API EMAIL TEMPLATES GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
  }
}

// PUT /api/admin/email-templates
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, subject, body: templateBody, name } = body;

    if (!id || !subject || !templateBody) {
      return NextResponse.json({ error: 'Missing template identification, subject, or body text.' }, { status: 400 });
    }

    await ensureTableAndSeed();

    await query(
      'UPDATE email_templates SET subject = ?, body = ?, name = COALESCE(?, name) WHERE id = ?',
      [subject, templateBody, name || null, id]
    );

    // Fetch the updated template key to log properly
    const updated = await query<any[]>('SELECT template_key FROM email_templates WHERE id = ?', [id]);
    const keyName = updated.length > 0 ? updated[0].template_key : id;

    await logAction(
      req,
      session,
      'UPDATE',
      'Email Templates',
      `Updated email template: "${keyName}"`
    );

    return NextResponse.json({ success: true, message: 'Template updated successfully.' });
  } catch (error: any) {
    console.error('[API EMAIL TEMPLATES PUT] Error:', error);
    return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 });
  }
}
