import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends an email using Nodemailer SMTP.
 * Configure via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 *
 * If SMTP_HOST is not set, it will fall back to logging the email to console
 * (safe for local development / staging).
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, text } = opts;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailFrom = process.env.EMAIL_FROM || 'DCRF Federation <noreply@dcrf.org>';

  // Fallback: no SMTP configured → log to console
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('---------- [SIMULATED EMAIL] ----------');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || '(html only)'}`);
    console.log('---------------------------------------');
    return { success: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false, // Hostinger requires this
      },
    });

    await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''), // auto-strip HTML for plain text
    });

    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    return { success: true };
  } catch (error: any) {
    console.error('[EMAIL ERROR]', error.message);
    return { success: false, error: error.message };
  }
}
