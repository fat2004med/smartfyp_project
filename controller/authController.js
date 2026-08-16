import User from "../models/User.js";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import { logEvent } from "../utils/logger.js";
import { validatePassword } from "../utils/passwordValidator.js";

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
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a secure reset token using JWT
    const resetToken = jwt.sign(
      { id: user._id, email: user.email, purpose: "password-reset" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1h" }
    );

    // Accurately determine the frontend base URL
    let baseUrl = clientOrigin;
    if (!baseUrl) {
      const originHeader = req.get('origin');
      const refererHeader = req.get('referer');
      if (originHeader) {
        baseUrl = originHeader;
      } else if (refererHeader) {
        try {
          baseUrl = new URL(refererHeader).origin;
        } catch (e) {
          baseUrl = null;
        }
      }
    }

    if (!baseUrl) {
      const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : req.protocol) || 'https';
      const host = req.headers['x-forwarded-host'] || req.get('host');
      baseUrl = `${proto}://${host}`;
    }

    baseUrl = baseUrl.replace(/\/+$/, "");
    if (baseUrl.includes('.run.app') && baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.replace('http://', 'https://');
    }

    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const subject = "Password Reset Request - SmartFYP";
    const plainTextMessage = `Hello ${user.name},\n\nYou requested to reset the password for your SmartFYP account.\n\nPlease click the link below (or copy and paste it into your browser) to reset your password. This link will expire in 1 hour:\n\n${resetUrl}\n\nIf you did not request this change, you can safely ignore this email and your password will remain unchanged.\n\nBest regards,\nSmartFYP Team`;

    const htmlMessage = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc;">
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
            <div style="width: 36px; height: 36px; background-color: #2563eb; border-radius: 8px; display: inline-block; text-align: center; line-height: 36px; color: #ffffff; font-weight: bold; font-size: 18px;">
              S
            </div>
            <span style="font-size: 20px; font-weight: 800; color: #0f172a; margin-left: 8px;">SmartFYP</span>
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
            This link is valid for <strong>1 hour</strong>. If the button above does not work, copy and paste the following link into your browser:
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
    try {
      await sendEmail({
        email: user.email,
        subject,
        message: plainTextMessage,
        html: htmlMessage
      });
      emailSent = true;
    } catch (emailErr) {
      console.error("Nodemailer failed to send password reset email:", emailErr.message);
    }

    // Save a system log for easy testing
    await logEvent({
      level: "Info",
      event: "Password Reset Token Generated",
      user: user.email,
      details: `Password reset requested. Link generated: ${resetUrl}. Email delivery status: ${emailSent ? 'Delivered' : 'Failed - logged for testing (SMTP might need config)'}`,
      ip: req.ip || req.headers["x-forwarded-for"] || "Internal",
    });

    res.json({ 
      message: "Password reset link sent to your email",
      resetUrl,
      devInfo: `[TESTING ONLY] A system log was added. Reset Link: ${resetUrl}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
