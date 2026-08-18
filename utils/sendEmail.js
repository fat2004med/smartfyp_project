import nodemailer from "nodemailer";

/**
 * Clean & normalize environment variable string values
 */
const cleanEnv = (val) => {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim().replace(/^["']|["']$/g, "").trim();
  return trimmed === "" ? null : trimmed;
};

/**
 * Retrieve and sanitize SMTP credentials from any standard environment variable naming convention
 */
export const getEmailConfig = () => {
  const user =
    cleanEnv(process.env.EMAIL_USER) ||
    cleanEnv(process.env.EMAIL_USERNAME) ||
    cleanEnv(process.env.MAIL_USER) ||
    cleanEnv(process.env.MAIL_USERNAME) ||
    cleanEnv(process.env.SMTP_USER) ||
    cleanEnv(process.env.SMTP_USERNAME) ||
    cleanEnv(process.env.GMAIL_USER) ||
    cleanEnv(process.env.GMAIL_USERNAME);

  let rawPass =
    cleanEnv(process.env.EMAIL_PASS) ||
    cleanEnv(process.env.EMAIL_PASSWORD) ||
    cleanEnv(process.env.MAIL_PASS) ||
    cleanEnv(process.env.MAIL_PASSWORD) ||
    cleanEnv(process.env.SMTP_PASS) ||
    cleanEnv(process.env.SMTP_PASSWORD) ||
    cleanEnv(process.env.GMAIL_PASS) ||
    cleanEnv(process.env.GMAIL_PASSWORD);

  // If password has spaces (common when copying Google 16-character App Passwords), strip all spaces
  let pass = rawPass;
  if (pass && (user?.endsWith("@gmail.com") || user?.endsWith("@googlemail.com") || pass.includes(" "))) {
    pass = pass.replace(/\s+/g, "");
  }

  const host =
    cleanEnv(process.env.EMAIL_HOST) ||
    cleanEnv(process.env.MAIL_HOST) ||
    cleanEnv(process.env.SMTP_HOST);

  const rawPort =
    cleanEnv(process.env.EMAIL_PORT) ||
    cleanEnv(process.env.MAIL_PORT) ||
    cleanEnv(process.env.SMTP_PORT);
  const port = rawPort ? parseInt(rawPort, 10) : (host === "smtp.gmail.com" ? 587 : 587);

  const service =
    cleanEnv(process.env.EMAIL_SERVICE) ||
    cleanEnv(process.env.MAIL_SERVICE) ||
    cleanEnv(process.env.SMTP_SERVICE) ||
    (user?.endsWith("@gmail.com") || user?.endsWith("@googlemail.com") ? "gmail" : null);

  const fromEmail =
    cleanEnv(process.env.EMAIL_FROM) ||
    cleanEnv(process.env.MAIL_FROM) ||
    cleanEnv(process.env.FROM_EMAIL) ||
    user;

  const fromName = cleanEnv(process.env.EMAIL_FROM_NAME) || "SmartFYP Academic Portal";

  const secure =
    process.env.EMAIL_SECURE === "true" ||
    process.env.MAIL_SECURE === "true" ||
    process.env.SMTP_SECURE === "true" ||
    port === 465;

  return {
    isConfigured: Boolean(user && pass),
    user,
    pass,
    host,
    port,
    service,
    fromEmail,
    fromName,
    secure,
  };
};

/**
 * Create a resilient nodemailer transporter with appropriate timeouts and TLS options
 */
const createTransporter = (config, strategy = "primary") => {
  const { user, pass, host, port, service, secure } = config;

  const connectionTimeout = 4000;
  const greetingTimeout = 4000;
  const socketTimeout = 5000;

  if (strategy === "gmail-service" || (service === "gmail" && !host)) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout,
      greetingTimeout,
      socketTimeout,
    });
  }

  if (strategy === "gmail-587" || (host === "smtp.gmail.com" && port !== 465)) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS
      requireTLS: true,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout,
      greetingTimeout,
      socketTimeout,
    });
  }

  if (strategy === "gmail-465" || (host === "smtp.gmail.com" && port === 465)) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout,
      greetingTimeout,
      socketTimeout,
    });
  }

  // Custom SMTP server configuration
  return nodemailer.createTransport({
    host: host || "smtp.gmail.com",
    port: port || (secure ? 465 : 587),
    secure: secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
  });
};

/**
 * Robust Email Delivery Utility with automatic transport fallback & diagnostics
 *
 * @param {Object} options
 * @param {string} options.email - Target recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.message - Plain text message
 * @param {string} [options.html] - Rich HTML email body
 */
export const sendEmail = async (options) => {
  const config = getEmailConfig();

  if (!config.isConfigured) {
    const errorMsg =
      "SMTP credentials (EMAIL_USER & EMAIL_PASS) are not configured. Please set EMAIL_USER and EMAIL_PASS in your environment or Railway configuration.";
    console.warn(`⚠️ [Email Service] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Determine sender display
  let fromHeader = `"${config.fromName}" <${config.fromEmail || config.user}>`;
  if (config.user && config.user.includes("@gmail.com") && (!config.fromEmail || !config.fromEmail.includes("@gmail.com"))) {
    // Gmail SMTP forces sender to match authenticated account
    fromHeader = `"${config.fromName}" <${config.user}>`;
  }

  const mailOptions = {
    from: fromHeader,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html:
      options.html ||
      `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);">
          <p style="white-space: pre-line; margin: 0;">${options.message}</p>
        </div>
      </div>`,
  };

  // Attempt strategies in sequence:
  // 1. Primary configured strategy
  // 2. Fallback port 587 / service if Gmail
  const strategies = [];
  if (config.service === "gmail" || config.host === "smtp.gmail.com" || config.user?.endsWith("@gmail.com")) {
    strategies.push("gmail-587");
    strategies.push("gmail-service");
    strategies.push("gmail-465");
  } else {
    strategies.push("primary");
    strategies.push("gmail-587");
  }

  let lastError = null;

  for (const strat of strategies) {
    try {
      const transporter = createTransporter(config, strat);
      const info = await transporter.sendMail(mailOptions);
      console.log(
        `✅ [Email Service] Successfully sent "${options.subject}" to ${options.email} via strategy (${strat}). Message ID: ${info.messageId}`
      );
      return { success: true, messageId: info.messageId, strategy: strat };
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ [Email Service] Strategy '${strat}' failed for ${options.email}:`, err.message);
    }
  }

  // Provide clear user-friendly diagnostic guidance
  let friendlyReason = lastError?.message || "Unknown error";
  if (friendlyReason.includes("535") || friendlyReason.includes("Username and Password not accepted") || friendlyReason.includes("Invalid login")) {
    friendlyReason = "Gmail Authentication Failed: Make sure 2-Step Verification is enabled on your Google account and you have generated a 16-character 'App Password' at myaccount.google.com/apppasswords.";
  } else if (friendlyReason.includes("ETIMEDOUT") || friendlyReason.includes("ESOCKETTIMEDOUT") || friendlyReason.includes("ECONNREFUSED")) {
    friendlyReason = "SMTP Connection Timeout: Host/Port is unreachable from the container environment.";
  }

  const finalError = new Error(`Email delivery failed: ${friendlyReason}`);
  finalError.original = lastError;
  throw finalError;
};

export default sendEmail;
