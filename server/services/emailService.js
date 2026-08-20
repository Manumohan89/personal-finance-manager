const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/**
 * Sends the password-reset email. If SMTP is not configured (e.g. local dev),
 * falls back to logging the reset URL to the console so the flow is still testable.
 */
const sendResetEmail = async (to, resetUrl) => {
  if (!transporter) {
    console.log(`[email:dev-fallback] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@personalfinance.app',
    to,
    subject: 'Reset your Personal Finance Manager password',
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in 30 minutes.</p><p>If you did not request this, you can ignore this email.</p>`,
  });
};

module.exports = { sendResetEmail };
