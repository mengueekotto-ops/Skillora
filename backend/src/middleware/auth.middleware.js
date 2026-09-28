const { User } = require("../models");
const { verifyToken } = require("../utils/jwt.util");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication token missing or invalid format.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or account disabled.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed. Invalid or expired token.",
      error: error.message,
    });
  }
};

module.exports = authenticateToken;
