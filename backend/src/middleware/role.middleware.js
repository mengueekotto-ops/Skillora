const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Authentication required.",
      });
    }

    const userRole = req.user.role ? req.user.role.toUpperCase() : "";
    const allowedRoles = roles.map((r) => r.toUpperCase());

    // Map common aliases
    if (allowedRoles.includes("CUSTOMER") && (userRole === "CLIENT" || userRole === "CUSTOMER")) {
      return next();
    }
    if (allowedRoles.includes("PROFESSIONAL") && (userRole === "ARTISAN" || userRole === "PROFESSIONAL")) {
      return next();
    }
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden. Role '${req.user.role}' is not authorized to perform this action. Required: [${roles.join(", ")}]`,
    });
  };
};

module.exports = authorizeRoles;
