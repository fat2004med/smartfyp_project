import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && authHeader.toLowerCase().startsWith("bearer")) {
    try {
      token = authHeader.split(" ")[1];
      if (!token || token === "null" || token === "undefined") {
        return res.status(401).json({ message: "Not authorized, no token" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
      
      // Get user from database to include role and other data
      const user = await User.findById(decoded.id).select("-password").populate("department");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.isActive === false) {
        return res.status(403).json({ message: "Your account has been deactivated." });
      }
      
      req.user = user;
      
      const userRoles = user.role ? user.role.split(",").map(r => r.trim()) : [];
      let selectedRole = req.headers['x-selected-role'] || req.headers['x-active-role'];
      if (selectedRole) {
        selectedRole = selectedRole.trim();
        const matchedRole = userRoles.find(r => r.toLowerCase() === selectedRole.toLowerCase());
        if (matchedRole) {
          req.activeRole = matchedRole;
        }
      }
      
      if (!req.activeRole) {
        req.activeRole = userRoles[0] || "";
      }
      
      return next();
    } catch (error) {
      console.error('Auth error:', error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRoleStr = req.user?.role || "";
    const userRoles = userRoleStr.split(",").map(r => r.trim());
    const hasRole = roles.some(role => userRoles.includes(role));
    if (!req.user || !hasRole) {
      return res.status(403).json({
        message: `User role ${req.user?.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
