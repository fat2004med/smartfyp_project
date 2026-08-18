import User from "../models/User.js";
import jwt from "jsonwebtoken";
import sendEmail, { getEmailConfig } from "../utils/sendEmail.js";
import { logEvent } from "../utils/logger.js";
import { validatePassword } from "../utils/passwordValidator.js";
import { getPortalBaseUrl } from "../utils/portalUrl.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate("department");

    if (user && (await user.matchPassword(password))) {
      // Automatic upgrade of HOD role to "HOD, Supervisor" on login
      if (user.role === "HOD") {
        user.role = "HOD, Supervisor";
        await user.save();
      }

      if (user.isActive === false) {
        await logEvent({
          level: "Warning",
          event: "Deactivated User Login Attempt",
          user: user.email,
          details: "Login blocked because the user account is deactivated",
          ip: req.ip || req.headers["x-forwarded-for"] || "Internal",
        });
        return res.status(403).json({ message: "Your account is deactivated. Please contact your HOD or Admin." });
      }

      await logEvent({
        level: "Info",
        event: "User Login",
        user: user.email,
        details: `Successful login as ${user.role}`,
        ip: req.ip || req.headers["x-forwarded-for"] || "Internal",
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isFirstLogin: user.isFirstLogin,
        token: generateToken(user._id),
      });
    } else {
      await logEvent({
        level: "Warning",
        event: "Failed Login Attempt",
        user: email || "unknown@user.com",
        details: "Invalid password attempt for account",
        ip: req.ip || req.headers["x-forwarded-for"] || "Internal",
      });

      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email, origin: clientOrigin } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User with this email was not found in the system." });
    }

    // Generate a secure reset token using JWT
    const resetToken = jwt.sign(
      { id: user._id, email: user.email, purpose: "password-reset" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "2h" }
    );

    // Accurately determine the portal base URL for live portal vs AI Studio
    const baseUrl = getPortalBaseUrl(req, clientOrigin);
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    const loginUrl = `${baseUrl}/login`;

    const subject = "SmartFYP - Password Reset Request";
    const plainTextMessage = `Hello ${user.name},\n\nYou requested to reset the password for your SmartFYP account (${user.email}).\n\nPlease click the link below (or copy and paste it into your browser) to reset your password. This link is valid for 2 hours:\n\n${resetUrl}\n\nIf you did not request this change, you can safely ignore this email and your password will remain unchanged.\n\nBest regards,\nSmartFYP Team`;

    const htmlMessage = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc;">
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
            <div style="width: 38px; height: 38px; background-color: #2563eb; border-radius: 10px; display: inline-block; text-align: center; line-height: 38px; color: #ffffff; font-weight: bold; font-size: 18px;">
              S
            </div>
            <span style="font-size: 22px; font-weight: 800; color: #0f172a; margin-left: 10px;">SmartFYP</span>
          </div>

          <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Reset Your Password</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Hello <strong>${user.name}</strong>,<br/>
            We received a request to reset the password for your SmartFYP account (<strong>${user.email}</strong>). Click the button below to set a new password:
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
              Reset Password
            </a>
          </div>

          <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 16px;">
            This link is valid for <strong>2 hours</strong>. If the button above does not work, copy and paste the following link into your browser:
          </p>
          <p style="font-size: 13px; line-height: 1.5; color: #2563eb; word-break: break-all; margin-bottom: 28px; background-color: #f1f5f9; padding: 12px; border-radius: 8px;">
            <a href="${resetUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">${resetUrl}</a>
          </p>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
        <div style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 20px;">
          &copy; ${new Date().getFullYear()} SmartFYP Portal. All rights reserved.
        </div>
      </div>
    `;

    let emailSent = false;
    let emailErrorMessage = null;
    try {
      const emailPromise = sendEmail({
        email: user.email,
        subject,
        message: plainTextMessage,
        html: htmlMessage
      });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Email sending timed out")), 5000)
      );
      await Promise.race([emailPromise, timeoutPromise]);
      emailSent = true;
      console.log(`[ForgotPassword] Password reset email delivered successfully to ${user.email}`);
    } catch (emailErr) {
      emailErrorMessage = emailErr.message;
      console.warn(`[ForgotPassword] Email delivery notice for ${user.email}:`, emailErr.message);
    }

    // Save a system log for record & debugging
    await logEvent({
      level: emailSent ? "Info" : "Warning",
      event: "Password Reset Token Generated",
      user: user.email,
      details: `Password reset link generated for ${user.email}. Target Link: ${resetUrl}. Email delivery: ${emailSent ? 'Delivered via SMTP' : 'Email failed to send (' + emailErrorMessage + ')'}`,
      ip: req.ip || req.headers["x-forwarded-for"] || "Internal",
    });

    res.json({ 
      success: true,
      message: emailSent 
        ? "Password reset link sent to your email inbox." 
        : "Password reset link generated. If email delivery is unavailable in your environment, use the direct reset link.",
      resetUrl,
      token: resetToken,
      emailSent,
      emailError: emailSent ? null : emailErrorMessage,
      devInfo: `Reset Link: ${resetUrl}`
    });
  } catch (error) {
    console.error("[ForgotPassword] Error:", error);
    res.status(500).json({ message: error.message || "Failed to process forgot password request." });
  }
};

export const resetPassword = async (req, res) => {
  const { email, newPassword, token } = req.body;
  try {
    let targetEmail = email;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
        if (decoded.purpose !== "password-reset") {
          return res.status(400).json({ message: "Invalid reset token." });
        }
        const foundUser = await User.findById(decoded.id);
        if (!foundUser) {
          return res.status(404).json({ message: "User not found or account deleted." });
        }
        targetEmail = foundUser.email;
      } catch (err) {
        return res.status(400).json({ message: "Password reset link is invalid or has expired." });
      }
    } else if (!targetEmail) {
      // Try verifying authorization header
      if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        const jwtToken = req.headers.authorization.split(" ")[1];
        try {
          const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET || "fallback_secret");
          const foundUser = await User.findById(decoded.id);
          if (foundUser) {
            targetEmail = foundUser.email;
          }
        } catch (err) {
          return res.status(401).json({ message: "Invalid session. Please login again." });
        }
      }
    }

    if (!targetEmail) {
      return res.status(400).json({ message: "Email, session, or reset token is missing." });
    }

    const user = await User.findOne({ email: targetEmail }).populate("department");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const pwdErrors = validatePassword(newPassword);
    if (pwdErrors.length > 0) {
      return res.status(400).json({ 
        message: `Password does not meet requirements. It must contain: ${pwdErrors.join(", ")}.` 
      });
    }

    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    await logEvent({
      level: "Info",
      event: "Password Updated Successfully",
      user: user.email,
      details: "Password was updated/reset successfully",
      ip: req.ip || req.headers["x-forwarded-for"] || "Internal",
    });

    // Send confirmation email with portal login button
    try {
      const baseUrl = getPortalBaseUrl(req, req.body.origin);
      const loginUrl = `${baseUrl}/login`;
      await sendEmail({
        email: user.email,
        subject: "SmartFYP - Password Changed Successfully",
        message: `Hello ${user.name},\n\nYour SmartFYP password has been updated successfully.\n\nYou can sign in to the portal here: ${loginUrl}\n\nIf you did not perform this action, please contact your administrator immediately.\n\nBest regards,\nSmartFYP Team`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc;">
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
                <div style="width: 38px; height: 38px; background-color: #2563eb; border-radius: 10px; display: inline-block; text-align: center; line-height: 38px; color: #ffffff; font-weight: bold; font-size: 18px;">
                  S
                </div>
                <span style="font-size: 22px; font-weight: 800; color: #0f172a; margin-left: 10px;">SmartFYP</span>
              </div>

              <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Password Changed Successfully</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                Hello <strong>${user.name}</strong>,<br>
                The password for your SmartFYP account (<strong>${user.email}</strong>) was recently changed. You can now use your new password to sign in.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                  Sign In To Portal
                </a>
              </div>

              <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 16px;">
                If you did not make this change, please contact your department coordinator or administrator immediately.
              </p>

              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0;" />

              <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0;">
                © 2026 SmartFYP Academic Portal. All rights reserved.
              </p>
            </div>
          </div>
        `
      });
    } catch (mailErr) {
      console.warn("[ResetPassword] Confirmation email notification notice:", mailErr.message);
    }

    res.json({
      message: "Password reset successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isFirstLogin: user.isFirstLogin,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Match current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid current password" });
    }

    const pwdErrors = validatePassword(newPassword);
    if (pwdErrors.length > 0) {
      return res.status(400).json({ 
        message: `Password does not meet requirements. It must contain: ${pwdErrors.join(", ")}.` 
      });
    }

    // Set new password (the pre-save hook will hash it automatically)
    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    await logEvent({
      level: "Info",
      event: "Password Changed",
      user: user.email,
      details: "Password was changed by logged-in user inside security settings",
      ip: req.ip || req.headers["x-forwarded-for"] || "Internal",
    });

    // Send confirmation email with portal login button
    try {
      const baseUrl = getPortalBaseUrl(req, req.body.origin);
      const loginUrl = `${baseUrl}/login`;
      await sendEmail({
        email: user.email,
        subject: "SmartFYP - Password Updated Successfully",
        message: `Hello ${user.name},\n\nYour SmartFYP password was updated successfully.\n\nPortal: ${loginUrl}\n\nIf you did not perform this change, please alert your administrator immediately.\n\nBest regards,\nSmartFYP Team`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc;">
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
                <div style="width: 38px; height: 38px; background-color: #2563eb; border-radius: 10px; display: inline-block; text-align: center; line-height: 38px; color: #ffffff; font-weight: bold; font-size: 18px;">
                  S
                </div>
                <span style="font-size: 22px; font-weight: 800; color: #0f172a; margin-left: 10px;">SmartFYP</span>
              </div>

              <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Security Notice: Password Updated</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                Hello <strong>${user.name}</strong>,<br>
                Your password for <strong>SmartFYP Academic Portal</strong> (${user.email}) was recently updated from your account security settings.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                  Go To Portal
                </a>
              </div>

              <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 16px;">
                If you did not make this change, please contact your department coordinator or administrator immediately.
              </p>

              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0;" />

              <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0;">
                © 2026 SmartFYP Academic Portal. All rights reserved.
              </p>
            </div>
          </div>
        `
      });
    } catch (mailErr) {
      console.warn("[UpdatePassword] Confirmation email notification notice:", mailErr.message);
    }

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmailStatus = async (req, res) => {
  try {
    const config = getEmailConfig();
    const baseUrl = getPortalBaseUrl(req);
    res.json({
      configured: config.isConfigured,
      smtpUser: config.user ? `${config.user.substring(0, 3)}***@${config.user.split('@')[1] || 'domain'}` : null,
      smtpHost: config.host || "smtp.gmail.com",
      smtpPort: config.port,
      smtpService: config.service || "gmail",
      portalUrl: baseUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const testSendEmail = async (req, res) => {
  const { targetEmail } = req.body;
  const recipient = targetEmail || req.user?.email;

  if (!recipient) {
    return res.status(400).json({ message: "Target email address is required." });
  }

  try {
    const baseUrl = getPortalBaseUrl(req);
    const result = await sendEmail({
      email: recipient,
      subject: "SmartFYP - SMTP Service Test Email",
      message: `Hello,\n\nThis is a test email dispatched from SmartFYP Academic Portal (${baseUrl}) to confirm that your SMTP email service is active and working properly.\n\nTime sent: ${new Date().toISOString()}\n\nBest regards,\nSmartFYP Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc;">
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
            <h2 style="color: #2563eb; margin-top: 0;">SMTP Test Successful!</h2>
            <p>This is a verification email from <strong>SmartFYP Academic Portal</strong>.</p>
            <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px;">
              <p style="margin: 4px 0;">Portal URL: ${baseUrl}</p>
              <p style="margin: 4px 0;">Recipient: ${recipient}</p>
              <p style="margin: 4px 0;">Timestamp: ${new Date().toISOString()}</p>
            </div>
          </div>
        </div>
      `,
    });

    res.json({
      success: true,
      message: `Test email successfully dispatched to ${recipient}!`,
      details: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

