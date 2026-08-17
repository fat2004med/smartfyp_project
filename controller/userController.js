import User from "../models/User.js";
import Department from "../models/Department.js";
import Project from "../models/Project.js";
import sendEmail from "../utils/sendEmail.js";
import { validatePassword, generateCompliantPassword } from "../utils/passwordValidator.js";
import { getPortalBaseUrl } from "../utils/portalUrl.js";

export const getUsers = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role !== "Admin") {
      // Data Isolation: Non-admin users can only view users in their own department
      if (req.user.department) {
        query.department = req.user.department?._id || req.user.department;
      } else {
        // If they don't have a department assigned yet, limit to themselves
        query._id = req.user._id;
      }
    }
    const users = await User.find(query).populate("department", "name").select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("department").select("-password");
    if (user) {
      const reqDeptId = req.user.department?._id || req.user.department;
      if (req.user && req.user.role !== "Admin" && String(user.department?._id || user.department) !== String(reqDeptId)) {
        return res.status(403).json({ message: "Access denied to users of other departments." });
      }
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  const { name, email, password, role, department, interests, studentRegNo, designation, phone } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      const existingRoles = userExists.role ? userExists.role.split(",").map(r => r.trim()) : [];
      const isHOD = existingRoles.includes("HOD");
      const isSupervisor = existingRoles.includes("Supervisor");
      
      if ((isHOD && role === "Supervisor") || (isSupervisor && role === "HOD")) {
        if (!isHOD || !isSupervisor) {
          userExists.role = "HOD, Supervisor";
          if (department) {
            userExists.department = department;
          }
          if (designation) {
            userExists.designation = designation;
          }
          if (phone) {
            userExists.phone = phone;
          }
          await userExists.save();
          return res.status(201).json({
            _id: userExists._id,
            name: userExists.name,
            email: userExists.email,
            role: userExists.role,
            department: userExists.department,
            isFirstLogin: userExists.isFirstLogin,
            tempPasswordUsed: "Password remains unchanged"
          });
        } else {
          return res.status(400).json({ message: "User already exists with both HOD and Supervisor roles." });
        }
      }
      return res.status(400).json({ message: "User already exists" });
    }

    // Role permissions check for HOD
    const isHOD = req.user && req.user.role && req.user.role.includes("HOD");
    if (isHOD) {
      if (role === "Admin" || role === "HOD") {
        return res.status(403).json({ message: "You cannot create users with HOD or Admin roles." });
      }
    }

    // Set department automatically for HOD
    const finalDepartment = isHOD ? (req.user.department?._id || req.user.department) : department;

    // Generate/get temporary password
    let temporaryPassword = password;
    if (password) {
      const pwdErrors = validatePassword(password);
      if (pwdErrors.length > 0) {
        return res.status(400).json({ 
          message: `Provided password does not meet requirements. It must contain: ${pwdErrors.join(", ")}.` 
        });
      }
    } else {
      temporaryPassword = generateCompliantPassword();
    }

    const user = await User.create({
      name,
      email,
      password: temporaryPassword,
      role,
      department: finalDepartment,
      interests,
      studentRegNo,
      designation,
      phone: phone || "",
      isFirstLogin: true // Force password reset on login
    });

    if (user) {
      // If user is HOD, also automatically assign as the HOD of the department
      if (role === "HOD" && finalDepartment) {
        const dept = await Department.findById(finalDepartment);
        if (dept) {
          dept.hod = user._id;
          await dept.save();
        }
      }

      // Send greeting email with temp credentials
      try {
        const portalUrl = getPortalBaseUrl(req, req.body.origin);
        const loginUrl = `${portalUrl}/login`;
        
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SmartFYP Academic Portal</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #2563eb;
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px 24px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 16px;
      color: #0f172a;
    }
    .intro {
      font-size: 15px;
      color: #475569;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .credentials-card {
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      word-wrap: break-word;
      word-break: break-word;
    }
    .credentials-card td {
      word-wrap: break-word;
      word-break: break-word;
    }
    @media only screen and (max-width: 600px) {
      .credentials-card table, 
      .credentials-card tbody, 
      .credentials-card tr, 
      .credentials-card td {
        display: block !important;
        width: 100% !important;
      }
      .credentials-card td {
        box-sizing: border-box !important;
      }
      .credentials-card td:first-child {
        font-weight: 600 !important;
        color: #64748b !important;
        font-size: 11px !important;
        padding-bottom: 2px !important;
        padding-top: 8px !important;
        text-transform: uppercase !important;
      }
      .credentials-card td:last-child {
        font-size: 14px !important;
        padding-top: 2px !important;
        padding-bottom: 8px !important;
        border-bottom: 1px dashed #cbd5e1;
      }
      .credentials-card tr:last-child td:last-child {
        border-bottom: none !important;
        padding-bottom: 2px !important;
      }
    }
    .instructions {
      font-size: 14px;
      color: #475569;
      margin-bottom: 28px;
      padding: 16px;
      background-color: #eff6ff;
      border-left: 4px solid #2563eb;
      border-radius: 8px;
    }
    .cta-container {
      text-align: center;
      margin: 28px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 15px;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>SmartFYP Academic Portal</h1>
      </div>
      <div class="content">
        <p class="greeting">Dear ${user.name},</p>
        <p class="intro">Your account has been successfully created on the <strong>SmartFYP Academic Portal</strong>. Below are your temporary login details generated by the administrator:</p>
        
        <div class="credentials-card">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; width:150px;">Email Address</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 15px; word-break: break-all;">${user.email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase;">Temporary Pass</td>
              <td style="padding: 6px 0; font-weight: 700; color: #2563eb; font-size: 15px;"><code style="background-color:#e2e8f0; padding:2px 8px; border-radius:4px; font-family:monospace;">${temporaryPassword}</code></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase;">Assigned Role</td>
              <td style="padding: 6px 0; font-weight: 800; color: #2563eb; font-size: 15px;">${user.role}</td>
            </tr>
          </table>
        </div>

        <div class="instructions">
          <strong style="color: #1e3a8a; font-size: 15px;">Next Steps:</strong>
          <ul style="margin-top: 8px; margin-bottom: 0; padding-left: 20px;">
            <li style="margin-bottom: 6px;">Click the button below to access the academic portal.</li>
            <li style="margin-bottom: 6px;">When prompted, use these credentials to log in, selecting <strong>"${user.role}"</strong> as your role.</li>
            <li>For security reasons, you will be required to change your password immediately upon your first login.</li>
          </ul>
        </div>

        <div class="cta-container">
          <a href="${loginUrl}" class="cta-button" target="_blank" style="color: #ffffff; text-decoration: none;">Sign In To SmartFYP</a>
        </div>

        <p class="intro" style="margin-top: 28px; margin-bottom: 0;">If you have any questions or require assistance, please get in touch with your department Head of Department (HOD) or Admin.<br><br>Best Regards,<br><strong>SmartFYP Team</strong></p>
      </div>
      <div class="footer">
        <p>© 2026 SmartFYP Portal. All rights reserved.</p>
        <p>This is an automatically generated system notification. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

        await sendEmail({
          email: user.email,
          subject: "Welcome to SmartFYP Academic Portal",
          message: `Dear ${user.name},\n\nYour account has been created on the SmartFYP Portal. Here are your credentials:\n\nEmail: ${user.email}\nTemporary Password: ${temporaryPassword}\nRole: ${user.role}\n\nPlease reset your password on your first login and select the role "${user.role}" when logging in.\n\nBest Regards,\nSmartFYP Team`,
          html: htmlContent
        });
      } catch (err) {
        console.log("Welcome Email could not be sent (transporter settings missing). Temporary password for " + user.email + " is: " + temporaryPassword);
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isFirstLogin: user.isFirstLogin,
        tempPasswordUsed: temporaryPassword
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      // Authorization Check: HOD can't update others outside department
      const isHOD = req.user && req.user.role && req.user.role.includes("HOD");
      const reqDeptId = req.user.department?._id || req.user.department;
      if (isHOD && String(user.department?._id || user.department) !== String(reqDeptId)) {
        return res.status(403).json({ message: "You cannot edit users outside of your department." });
      }

      const oldRole = user.role;
      const oldDeptId = user.department;

      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      let updatedRole = req.body.role || user.role;
      if (updatedRole === "HOD" || updatedRole === "Supervisor") {
        const isSupervising = await Project.exists({ supervisor: user._id });
        if (isSupervising) {
          updatedRole = "HOD, Supervisor";
        }
      }
      user.role = updatedRole;
      
      user.department = req.body.department || user.department;
      user.interests = req.body.interests || user.interests;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      if (req.body.password) {
        const pwdErrors = validatePassword(req.body.password);
        if (pwdErrors.length > 0) {
          return res.status(400).json({ 
            message: `Password does not meet requirements. It must contain: ${pwdErrors.join(", ")}.` 
          });
        }
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      // Synchronize Department HOD mapping if changes occurred
      if (user.role === "HOD" && String(oldRole) !== "HOD" && user.department) {
        const dept = await Department.findById(user.department);
        if (dept) {
          dept.hod = user._id;
          await dept.save();
        }
      }

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        phone: updatedUser.phone,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.isActive = !user.isActive;
      await user.save();
      res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { newPassword, requirePasswordChange = true } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Authorization Check: HOD can only reset passwords within their department
    const isHOD = req.user && req.user.role && req.user.role.includes("HOD");
    const reqDeptId = req.user.department?._id || req.user.department;
    if (isHOD && String(user.department?._id || user.department) !== String(reqDeptId)) {
      return res.status(403).json({ message: "You can only reset passwords for users in your department." });
    }

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ message: "Temporary password must be at least 6 characters long." });
    }

    const pwdErrors = validatePassword(newPassword);
    if (pwdErrors.length > 0) {
      return res.status(400).json({ 
        message: `Password does not meet requirements. Missing: ${pwdErrors.join(", ")}.` 
      });
    }

    user.password = newPassword;
    user.isFirstLogin = requirePasswordChange;
    await user.save();

    // Log the event
    await logSystemEvent(
      "Direct Password Reset",
      `Password reset directly by ${req.user.name} (${req.user.role}) for user ${user.email}. RequireChangeOnLogin: ${requirePasswordChange}`,
      req.user.email,
      "Info",
      req.ip
    );

    // Try to notify the user via email with their new credentials
    try {
      const portalUrl = getPortalBaseUrl(req, req.body.origin);
      const loginUrl = `${portalUrl}/login`;
      await sendEmail({
        email: user.email,
        subject: "SmartFYP Account Password Reset",
        message: `Hello ${user.name},\n\nYour account password has been reset by the department administrator/HOD.\n\nNew Temporary Password: ${newPassword}\nAssigned Role: ${user.role}\n\nPlease login at: ${loginUrl}\n${requirePasswordChange ? "You will be prompted to change your password immediately upon login." : ""}\n\nBest regards,\nSmartFYP Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
              <h2 style="color: #2563eb; margin-top: 0;">Password Reset Notification</h2>
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>Your password for the <strong>SmartFYP Academic Portal</strong> has been reset by your administrator/HOD.</p>
              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 4px 0;"><strong>Email:</strong> ${user.email}</p>
                <p style="margin: 4px 0;"><strong>New Temporary Password:</strong> <code style="background:#e2e8f0; padding:2px 8px; border-radius:4px; font-weight:bold; color:#1e40af;">${newPassword}</code></p>
                <p style="margin: 4px 0;"><strong>Assigned Role:</strong> ${user.role}</p>
              </div>
              <p>${requirePasswordChange ? "You will be prompted to create your new personal password upon your next login." : ""}</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${loginUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Login to SmartFYP</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #94a3b8;">If you did not request this assistance, please contact your department coordinator.</p>
            </div>
          </div>
        `
      });
    } catch (mailErr) {
      console.log("Could not send password reset notification email:", mailErr.message);
    }

    res.json({
      message: `Password for ${user.name} reset successfully!`,
      email: user.email,
      temporaryPassword: newPassword,
      isFirstLogin: user.isFirstLogin
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.interests = req.body.interests || user.interests;
      user.profilePicture = req.body.profilePicture !== undefined ? req.body.profilePicture : user.profilePicture;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      
      if (req.body.password) {
        const pwdErrors = validatePassword(req.body.password);
        if (pwdErrors.length > 0) {
          return res.status(400).json({ 
            message: `Password does not meet requirements. It must contain: ${pwdErrors.join(", ")}.` 
          });
        }
        user.password = req.body.password;
        user.isFirstLogin = false;
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        interests: updatedUser.interests,
        profilePicture: updatedUser.profilePicture,
        phone: updatedUser.phone,
        isFirstLogin: updatedUser.isFirstLogin
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSupervisors = async (req, res) => {
  try {
    const query = { role: { $in: ["Supervisor", "HOD", "HOD, Supervisor"] } };
    if (req.user && req.user.role !== "Admin" && req.user.department) {
      query.department = req.user.department?._id || req.user.department;
    }
    const supervisors = await User.find(query).select("name email");
    res.json(supervisors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
