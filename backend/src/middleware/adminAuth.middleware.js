const jwt = require("jsonwebtoken");
const { User } = require("../models");

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin access denied. Authentication token missing.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_jwt_secret"
    );

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Admin access only.",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Admin account not found, inactive, or unauthorized role.",
      });
    }

    req.admin = user;
    req.adminRole = decoded.adminRole || "SUPER_ADMIN";
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication failed. Invalid or expired token.",
      error: error.message,
    });
  }
};

const requireAdminRole = (...roles) => {
  return (req, res, next) => {
    if (!req.adminRole) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    if (roles.length > 0 && !roles.includes(req.adminRole) && req.adminRole !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires role: [${roles.join(", ")}]. Your role: ${req.adminRole}`,
      });
    }
    next();
  };
};

module.exports = { authenticateAdmin, requireAdminRole };
