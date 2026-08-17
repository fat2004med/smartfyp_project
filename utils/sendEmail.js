import nodemailer from "nodemailer";

/**
 * Robust Email Delivery Utility
 * Supports:
 * 1. Custom SMTP (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS)
 * 2. Pre-configured services like Gmail (EMAIL_SERVICE=gmail, EMAIL_USER, EMAIL_PASS)
 * 3. Safe fallback with descriptive error reporting
 */
const sendEmail = async (options) => {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const service = process.env.EMAIL_SERVICE;
  const port = parseInt(process.env.EMAIL_PORT || "587", 10);
  const secure = process.env.EMAIL_SECURE === "true" || port === 465;

  let transporterConfig = null;

  if (service) {
    transporterConfig = {
      service,
      auth: { user, pass },
    };
  } else if (host && user && pass) {
    transporterConfig = {
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed certificate errors on cloud hosts
      },
    };
  } else if (user && pass) {
    // If user and pass are provided without host, default to Gmail SMTP
    transporterConfig = {
      service: "gmail",
      auth: { user, pass },
    };
  }

  if (!transporterConfig) {
    const errorMsg = "SMTP credentials (EMAIL_USER & EMAIL_PASS) are not configured in environment variables.";
    console.warn(`⚠️ [Email Service] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const transporter = nodemailer.createTransport(transporterConfig);

  const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@smartfyp.com";
  const mailOptions = {
    from: `"SmartFYP Portal" <${senderEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);">
        <p style="white-space: pre-line; margin: 0;">${options.message}</p>
      </div>
    </div>`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ [Email Service] Email sent successfully to ${options.email}. Message ID: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
};

export default sendEmail;

