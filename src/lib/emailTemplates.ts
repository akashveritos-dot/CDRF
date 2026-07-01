/**
 * Premium mobile-responsive HTML email templates for DCRF Membership.
 * Uses inline CSS for maximum email client compatibility.
 * All table labels are short & nowrap to prevent vertical letter-wrap on mobile.
 */

// ─── DCRF Real Logo (hosted PNG, works in all email clients) ──────────────────
// Using absolute URL so Gmail/Outlook can load it from the hosted server
const LOGO_URL = 'https://dcrfindia.org/dcrf_icon-Photoroom.png';
const LOGO_HORIZONTAL_URL = 'https://dcrfindia.org/new/DCRF_logo_horizontal-Photoroom.png';

const DCRF_LOGO_HEADER = `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px">
  <tr>
    <td align="center">
      <img src="${LOGO_URL}"
        alt="DCRF"
        width="64" height="64"
        style="display:block;width:64px;height:64px;object-fit:contain;border-radius:12px;background:rgba(255,255,255,0.12);padding:8px"
        onerror="this.style.display='none'"
      />
    </td>
  </tr>
  <tr>
    <td align="center" style="padding-top:10px">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:3px;text-transform:uppercase">DCRF</span>
    </td>
  </tr>
  <tr>
    <td align="center">
      <span style="font-family:Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:1.5px;text-transform:uppercase">Disaster Cyber Response Federation</span>
    </td>
  </tr>
</table>`;

// ─── Tier color map ─────────────────────────────────────────────────────────────
const TIER_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  Basic:   { accent: '#64748b', bg: '#f1f5f9',   border: '#cbd5e1' },
  Prime:   { accent: '#0e7a6b', bg: '#e0f5f1',   border: '#5eead4' },
  Premium: { accent: '#7c3aed', bg: '#ede9fe',   border: '#c4b5fd' },
  Gold:    { accent: '#d97706', bg: '#fef3c7',   border: '#fcd34d' },
};

// ─── Shared HTML shell ─────────────────────────────────────────────────────────
function shell(headerContent: string, bodyContent: string, footerNote = ''): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>DCRF Federation</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    @media only screen and (max-width:600px){
      .email-container{width:100%!important;margin:0!important}
      .header-pad{padding:24px 16px!important}
      .body-pad{padding:20px 16px!important}
      .footer-pad{padding:16px 12px!important}
      h1.email-title{font-size:22px!important}
      h2.greeting{font-size:18px!important}
      .cta-btn{display:block!important;text-align:center!important;width:auto!important;padding:14px 20px!important}
      .info-table td{display:block!important;width:100%!important}
      .info-label{width:100%!important;padding-bottom:2px!important;padding-right:0!important;font-size:10px!important}
      .info-value{width:100%!important;padding-bottom:10px!important;font-size:13px!important}
    }
    * { box-sizing: border-box; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1d;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0f1d;padding:20px 0">
    <tr>
      <td align="center" valign="top">

        <!-- Email container -->
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5)">

          <!-- HEADER -->
          <tr>
            <td class="header-pad" align="center" style="background:linear-gradient(135deg,#7f0000 0%,#b91c1c 50%,#7f0000 100%);padding:32px 32px">
              ${headerContent}
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td class="body-pad" style="background-color:#111827;padding:28px 32px">
              ${bodyContent}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="footer-pad" align="center" style="background-color:#0a0f1d;padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06)">
              <img src="${LOGO_URL}" alt="DCRF" width="28" height="28"
                style="display:inline-block;vertical-align:middle;margin-right:8px;border-radius:6px"
                onerror="this.style.display='none'"
              />
              <span style="font-size:11px;font-weight:700;color:#94a3b8;vertical-align:middle;letter-spacing:0.5px">DISASTER CYBER RESPONSE FEDERATION</span>
              <br/><br/>
              <p style="margin:0 0 6px;font-size:11px;color:#475569;line-height:1.5">${footerNote || 'This is an automated notification. Please do not reply to this email.'}</p>
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
}

// ─── Info Row helper — mobile-safe, no wrapping labels ─────────────────────────
// Key fix: label cell uses white-space:nowrap + fixed 120px width so it never
// wraps vertically on narrow screens. Value cell gets remaining space.
function infoRow(label: string, value: string, valueStyle = ''): string {
  return `
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)">
    <td class="info-label" width="120" style="padding:10px 12px 10px 0;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;vertical-align:top;white-space:nowrap;width:120px">
      ${label}
    </td>
    <td class="info-value" style="padding:10px 0;font-size:14px;color:#ffffff;font-weight:600;vertical-align:top;${valueStyle}">
      ${value}
    </td>
  </tr>`;
}

// ─── Tier badge helper ─────────────────────────────────────────────────────────
function tierBadge(tier: string): string {
  return `<span style="display:inline-block;background:linear-gradient(135deg,#7f0000,#b91c1c);color:#fff;font-size:11px;font-weight:800;padding:4px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase">${tier}</span>`;
}

// ─── Format Date ───────────────────────────────────────────────────────────────
function fmtDate(d: string | Date): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// WELCOME EMAIL
// ══════════════════════════════════════════════════════════════════════════════
export function welcomeEmail(params: {
  name: string;
  tier: string;
  startsAt: string;
  expiresAt: string;
  paymentId: string;
  price?: number | string;
  priceSubText?: string;
  organization?: string;
  title?: string;
}): string {
  const { name, tier, startsAt, expiresAt, paymentId, price, priceSubText, organization, title } = params;

  const formattedPrice = price !== undefined
    ? (Number(price) === 0 ? 'Free / Complimentary' : `₹${Number(price).toLocaleString('en-IN')}`)
    : '—';

  const billingTerm = priceSubText ? priceSubText.replace('Per Annum — ', '') : 'Annual';

  const header = `
    ${DCRF_LOGO_HEADER}
    <h1 class="email-title" style="margin:12px 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">
      Membership Activated
    </h1>
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75)">Welcome to the DCRF Resilience Network</p>`;

  const body = `
    <h2 class="greeting" style="margin:0 0 10px;font-size:18px;color:#ffffff;font-weight:700">
      Welcome, ${name}! 🎉
    </h2>
    <p style="margin:0 0 22px;font-size:14px;color:#94a3b8;line-height:1.7">
      Your <strong style="color:#ffffff">${tier}</strong> membership has been
      <strong style="color:#10b981">successfully activated</strong>.
      You are now part of India's premier disaster resilience network.
    </p>

    <!-- Membership Details Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;margin-bottom:22px">
      <tr>
        <td style="background:rgba(255,255,255,0.03);padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px">Membership & Plan Details</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 18px">
          <table class="info-table" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${infoRow('Member Name', name)}
            ${organization ? infoRow('Organization', organization) : ''}
            ${title ? infoRow('Designation', title) : ''}
            ${infoRow('Membership Tier', tierBadge(tier))}
            ${infoRow('Plan Pricing', `${formattedPrice} (${billingTerm})`)}
            ${infoRow('Start Date', fmtDate(startsAt))}
            ${infoRow('Valid Until', tier === 'Basic' ? '<span style="color:#10b981;font-weight:700">Lifetime</span>' : `<span style="color:#f59e0b;font-weight:700">${fmtDate(expiresAt)}</span>`)}
            ${infoRow('Reference ID', `<span style="font-size:12px;color:#94a3b8;word-break:break-all">${paymentId}</span>`)}
          </table>
        </td>
      </tr>
    </table>

    <!-- Success banner -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;margin-bottom:22px">
      <tr>
        <td style="padding:14px 18px">
          <p style="margin:0;font-size:13px;color:#34d399;line-height:1.6">
            ✅ <strong>Your membership is active.</strong> As a ${tier} member, you have access to DCRF's
            capacity building programmes, information network, and exclusive engagement opportunities.
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:22px">
      <tr>
        <td align="center">
          <a class="cta-btn" href="https://dcrfindia.org/membership"
            style="display:inline-block;background:linear-gradient(135deg,#b91c1c,#ef4444);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:8px;letter-spacing:0.3px">
            Visit Member Portal →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#475569;border-top:1px solid rgba(255,255,255,0.06);padding-top:18px">
      For any queries, contact us at
      <a href="mailto:info@dcrfindia.org" style="color:#ef4444;text-decoration:none">info@dcrfindia.org</a>.
      Please keep your Reference ID for your records.
    </p>`;

  return shell(header, body, 'This confirmation was sent automatically upon membership activation.');
}

// ══════════════════════════════════════════════════════════════════════════════
// UPGRADE CONFIRMATION EMAIL
// ══════════════════════════════════════════════════════════════════════════════
export function upgradeConfirmationEmail(params: {
  name: string;
  oldTier: string;
  newTier: string;
  expiresAt: string;
  paymentId: string;
  price?: number | string;
  priceSubText?: string;
}): string {
  const { name, oldTier, newTier, expiresAt, paymentId, price, priceSubText } = params;

  const formattedPrice = price !== undefined
    ? (Number(price) === 0 ? 'Free / Complimentary' : `₹${Number(price).toLocaleString('en-IN')}`)
    : '—';

  const billingTerm = priceSubText ? priceSubText.replace('Per Annum — ', '') : 'Annual';

  const header = `
    ${DCRF_LOGO_HEADER}
    <h1 class="email-title" style="margin:12px 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#ffffff">
      Membership Upgraded ⬆
    </h1>
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75)">Your plan has been successfully upgraded</p>`;

  const body = `
    <h2 class="greeting" style="margin:0 0 10px;font-size:18px;color:#ffffff;font-weight:700">
      Congratulations, ${name}! 🚀
    </h2>
    <p style="margin:0 0 22px;font-size:14px;color:#94a3b8;line-height:1.7">
      Your DCRF Federation membership has been <strong style="color:#10b981">successfully upgraded</strong> to the
      <strong style="color:#ffffff">${newTier}</strong> tier. You now have access to enhanced benefits.
    </p>

    <!-- Upgrade details -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;margin-bottom:22px">
      <tr>
        <td style="background:rgba(255,255,255,0.03);padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px">Upgrade & Plan Details</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 18px">
          <table class="info-table" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${infoRow('Previous Tier', `<span style="color:#64748b;text-decoration:line-through">${oldTier}</span>`)}
            ${infoRow('New Tier', tierBadge(newTier))}
            ${infoRow('New Price', `${formattedPrice} (${billingTerm})`)}
            ${infoRow('New Expiration', `<span style="color:#f59e0b;font-weight:700">${fmtDate(expiresAt)}</span>`)}
            ${infoRow('Reference ID', `<span style="font-size:12px;color:#94a3b8;word-break:break-all">${paymentId}</span>`)}
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px">
      <tr>
        <td align="center">
          <a class="cta-btn" href="https://dcrfindia.org/membership"
            style="display:inline-block;background:linear-gradient(135deg,#b91c1c,#ef4444);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:8px">
            Explore New Benefits →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#475569;border-top:1px solid rgba(255,255,255,0.06);padding-top:18px">
      Questions? Contact <a href="mailto:info@dcrfindia.org" style="color:#ef4444;text-decoration:none">info@dcrfindia.org</a>
    </p>`;

  return shell(header, body, 'This upgrade confirmation was sent automatically upon payment verification.');
}

// ══════════════════════════════════════════════════════════════════════════════
// RENEWAL REMINDER EMAIL
// ══════════════════════════════════════════════════════════════════════════════
export function renewalReminderEmail(params: {
  name: string;
  tier: string;
  expiresAt: string;
  daysLeft: number;
  upgradePlans?: Array<{ name: string; price: number }>;
}): string {
  const { name, tier, expiresAt, daysLeft, upgradePlans } = params;

  const urgencyColor  = daysLeft === 0 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : '#3b82f6';
  const urgencyBg     = daysLeft === 0 ? 'rgba(239,68,68,0.08)' : daysLeft <= 7 ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)';
  const urgencyBorder = daysLeft === 0 ? 'rgba(239,68,68,0.25)' : daysLeft <= 7 ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.25)';
  const urgencyText   = daysLeft === 0 ? 'expires TODAY' : daysLeft === 1 ? 'expires TOMORROW' : `expires in <strong>${daysLeft} days</strong>`;
  const urgencyEmoji  = daysLeft === 0 ? '🔴' : daysLeft <= 7 ? '🟡' : '🔵';

  const header = `
    ${DCRF_LOGO_HEADER}
    <h1 class="email-title" style="margin:12px 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#ffffff">
      ${daysLeft === 0 ? 'Membership Expiring Today' : 'Renewal Reminder'}
    </h1>
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75)">Action required — DCRF ${tier} Membership</p>`;

  const upgradeSection = upgradePlans && upgradePlans.length > 0 ? `
    <!-- Upgrade options -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.15);border-radius:10px;overflow:hidden;margin-bottom:20px">
      <tr>
        <td style="padding:12px 18px;border-bottom:1px solid rgba(245,158,11,0.15)">
          <p style="margin:0;font-size:10px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:0.8px">⬆ Available Upgrades</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 18px">
          <table class="info-table" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${upgradePlans.map(p => infoRow(
              tierBadge(p.name),
              `<span style="color:#f59e0b;font-weight:700">₹${p.price.toLocaleString('en-IN')}<span style="font-size:11px;color:#64748b;font-weight:400">/yr</span></span>`
            )).join('')}
          </table>
        </td>
      </tr>
    </table>` : '';

  const body = `
    <h2 class="greeting" style="margin:0 0 10px;font-size:20px;color:#ffffff;font-weight:700">
      ${urgencyEmoji} Dear ${name},
    </h2>
    <p style="margin:0 0 18px;font-size:14px;color:#94a3b8;line-height:1.7">
      Your DCRF <strong style="color:#ffffff">${tier}</strong> membership
      <span style="color:${urgencyColor};font-weight:700">${urgencyText}</span>
      on <strong style="color:#ffffff">${fmtDate(expiresAt)}</strong>.
    </p>

    <!-- Urgency Banner -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="background:${urgencyBg};border:1px solid ${urgencyBorder};border-radius:10px;margin-bottom:22px">
      <tr>
        <td style="padding:14px 18px">
          <table class="info-table" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${infoRow('Tier', tierBadge(tier))}
            ${infoRow('Expires', `<span style="color:${urgencyColor};font-weight:700">${fmtDate(expiresAt)}</span>`)}
            ${daysLeft > 0 ? infoRow('Days Left', `<span style="color:${urgencyColor};font-size:18px;font-weight:800">${daysLeft}</span>`) : ''}
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 18px;font-size:14px;color:#94a3b8;line-height:1.7">
      Renew before expiry to continue enjoying DCRF benefits without interruption.
    </p>

    <!-- Primary CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:22px">
      <tr>
        <td align="center">
          <a class="cta-btn" href="https://dcrfindia.org/membership"
            style="display:inline-block;background:linear-gradient(135deg,#b91c1c,#ef4444);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;letter-spacing:0.3px">
            Renew Membership Now →
          </a>
        </td>
      </tr>
    </table>

    ${upgradeSection}

    <p style="margin:0;font-size:12px;color:#475569;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px">
      If you have already renewed, please ignore this message.
      For support: <a href="mailto:info@dcrfindia.org" style="color:#ef4444;text-decoration:none">info@dcrfindia.org</a>.
    </p>`;

  return shell(header, body, 'This is an automated renewal reminder. To unsubscribe, contact info@dcrfindia.org.');
}
