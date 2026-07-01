const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// 1. Manually parse .env to get database credentials
function parseEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found at', envPath);
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const config = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      config[key] = val;
    }
  });
  return config;
}

// Default premium email template shells
const LOGO_URL = 'https://dcrfindia.org/dcrf_icon-Photoroom.png';

const emailShell = (title, subtitle, bodyContent, footerNote) => `<!DOCTYPE html>
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

const templates = [
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

async function run() {
  const env = parseEnv();
  
  const host = env.DB_HOST || 'localhost';
  const user = env.DB_USER || 'root';
  const password = env.DB_PASSWORD || '';
  const database = env.DB_NAME || 'dcrs_db';
  const port = parseInt(env.DB_PORT || '3306', 10);

  console.log(`Connecting to database ${database} at ${host}:${port} as ${user}...`);

  const connection = await mysql.createConnection({
    host,
    user,
    password,
    database,
    port
  });

  // 1. Create table
  console.log('Creating table `email_templates`...');
  await connection.execute(`
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
  console.log('✓ Table `email_templates` ensured.');

  // 2. Seed templates
  for (const t of templates) {
    try {
      console.log(`Seeding template "${t.name}" (${t.key})...`);
      await connection.execute(
        `INSERT INTO \`email_templates\` (template_key, name, subject, body) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
           name = VALUES(name), 
           subject = VALUES(subject), 
           body = VALUES(body)`,
        [t.key, t.name, t.subject, t.body]
      );
      console.log(`✓ Template "${t.key}" seeded successfully.`);
    } catch (err) {
      console.error(`✗ Failed to seed template ${t.key}:`, err.message);
    }
  }

  await connection.end();
  console.log('Database email template migration completed.');
}

run().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
