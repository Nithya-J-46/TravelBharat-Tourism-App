const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'noreply@travelbharat.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
  console.log('Nodemailer SMTP Transporter initialized successfully.');
} else {
  console.warn('SMTP configuration is incomplete. Email service will run in log-only fallback mode.');
}

/**
 * Generic email sender helper
 */
const sendMail = async ({ to, subject, html, text }) => {
  try {
    if (transporter) {
      const info = await transporter.sendMail({
        from: `"TravelBharat" <${SMTP_FROM}>`,
        to,
        subject,
        text,
        html
      });
      console.log(`Email successfully sent to ${to}. MessageId: ${info.messageId}`);
      return info;
    } else {
      console.log(`
============================================================
[EMAIL LOG FALLBACK (SMTP not configured)]
To: ${to}
Subject: ${subject}
Text Content:
${text}
------------------------------------------------------------
HTML Content Preview:
(Branding: TravelBharat, styling active)
============================================================
`);
      return null;
    }
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
};

/**
 * Send welcome email to newly registered users
 */
const sendWelcomeEmail = async (email, name) => {
  const loginUrl = `${FRONTEND_URL}/login`;
  const subject = 'Welcome to TravelBharat! 🌟';
  
  const text = `Hello ${name},\n\nWelcome to TravelBharat, your ultimate companion for exploring India! Plan trips with our AI Assistant, save favorite itineraries, and explore states via interactive maps.\n\nLog in here: ${loginUrl}\n\nHappy exploring,\nThe TravelBharat Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to TravelBharat</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); padding: 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 32px; color: #1f2937; line-height: 1.6; }
    .content h2 { margin-top: 0; font-size: 20px; font-weight: 700; color: #111827; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 20px 0; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2); }
    .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TravelBharat</h1>
    </div>
    <div class="content">
      <h2>Welcome, ${name}!</h2>
      <p>We are absolutely thrilled to welcome you to <strong>TravelBharat</strong>, your ultimate companion for exploring the beautiful, diverse, and vibrant heritage of India.</p>
      <p>With TravelBharat, you can discover hidden gems, plan customized itineraries with our AI assistant, save your favorite trips, and explore interactive maps of all states.</p>
      <p>Get started today by logging into your account:</p>
      <div style="text-align: center;">
        <a href="${loginUrl}" class="btn" style="color: #ffffff;">Explore TravelBharat</a>
      </div>
      <p>If you have any questions or need help, our support team is always here for you.</p>
      <p>Happy exploring!<br>The TravelBharat Team</p>
    </div>
    <div class="footer">
      &copy; 2026 TravelBharat. All rights reserved.<br>
      Discover Incredible India.
    </div>
  </div>
</body>
</html>
  `;

  return sendMail({ to: email, subject, text, html });
};

/**
 * Send login notification security alert email
 */
const sendLoginAlertEmail = async (email, name, userAgent, ipAddress) => {
  const resetUrl = `${FRONTEND_URL}/forgot-password`;
  const subject = 'TravelBharat Security: New Login Detected 🛡️';
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) + ' (IST)';
  
  const text = `Hello ${name},\n\nA login to your TravelBharat account was detected.\n\nTime: ${timestamp}\nDevice/Browser: ${userAgent}\nIP Address: ${ipAddress}\n\nIf this was not you, please reset your password immediately: ${resetUrl}\n\nBest regards,\nTravelBharat Security Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Security Alert</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #1e293b; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
    .content { padding: 32px; color: #1f2937; line-height: 1.6; }
    .alert-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 20px 0; font-weight: 500; }
    .details { background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; font-size: 14px; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 6px 0; }
    .details td.label { font-weight: 600; color: #4b5563; width: 120px; }
    .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TravelBharat Security</h1>
    </div>
    <div class="content">
      <p>Hello ${name || 'User'},</p>
      <div class="alert-box">
        Security Notice: A login to your TravelBharat account was detected. If this was not you, please reset your password immediately.
      </div>
      <p>Here are the details of the login activity:</p>
      <div class="details">
        <table>
          <tr>
            <td class="label">Time:</td>
            <td>${timestamp}</td>
          </tr>
          <tr>
            <td class="label">Device/Browser:</td>
            <td>${userAgent}</td>
          </tr>
          <tr>
            <td class="label">IP Address:</td>
            <td>${ipAddress}</td>
          </tr>
        </table>
      </div>
      <p><strong>If this was you,</strong> you can safely ignore this email.</p>
      <p><strong>If this was not you,</strong> please reset your password immediately to protect your account:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn" style="color: #ffffff;">Reset Password</a>
      </div>
      <p>Best regards,<br>TravelBharat Security Team</p>
    </div>
    <div class="footer">
      &copy; 2026 TravelBharat. All rights reserved.<br>
      Security alerts for your TravelBharat account.
    </div>
  </div>
</body>
</html>
  `;

  return sendMail({ to: email, subject, text, html });
};

/**
 * Send OTP password reset verification email
 */
const sendPasswordResetEmail = async (email, name, otp) => {
  const resetUrl = `${FRONTEND_URL}/forgot-password`;
  const subject = 'TravelBharat Account: Password Reset Request 🔑';
  
  const text = `Hello ${name},\n\nWe received a request to reset your password. Please use the following 6-digit OTP code to verify your identity:\n\nOTP Code: ${otp}\n\nThis code is valid for 15 minutes. If you did not make this request, you can ignore this email.\n\nReset page link: ${resetUrl}\n\nBest regards,\nThe TravelBharat Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); padding: 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
    .content { padding: 32px; color: #1f2937; line-height: 1.6; }
    .otp-code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; text-align: center; background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0; color: #4f46e5; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 20px 0; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2); }
    .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TravelBharat</h1>
    </div>
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset the password for your TravelBharat account. Please use the 6-digit verification code below to complete the reset process:</p>
      <div class="otp-code">${otp}</div>
      <p>This verification code is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.</p>
      <p>You can complete the verification process by visiting the link below:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn" style="color: #ffffff;">Go to Reset Page</a>
      </div>
      <p>Best regards,<br>The TravelBharat Team</p>
    </div>
    <div class="footer">
      &copy; 2026 TravelBharat. All rights reserved.<br>
      Security notifications from TravelBharat.
    </div>
  </div>
</body>
</html>
  `;

  return sendMail({ to: email, subject, text, html });
};

module.exports = {
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendPasswordResetEmail
};
