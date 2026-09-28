const express = require("express");
const router = express.Router();
const { authenticateAdmin, requireAdminRole } = require("../middleware/adminAuth.middleware");
const { adminLoginLimiter } = require("../middleware/rateLimit.middleware");
const {
  adminLogin,
  adminGetMe,
  getAdminStats,
  getUsers,
  getUserById,
  toggleUserStatus,
  deleteUser,
  getProfessionals,
  getVerificationRequests,
  processVerification,
  getServices,
  toggleServiceStatus,
  deleteService,
  getRequests,
  getReviews,
  deleteReview,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  sendNotification,
  globalSearch,
  getAdminOverview,
  getPayments,
} = require("../controllers/admin.controller");

// Public admin auth routes (no token needed)
router.post("/auth/login", adminLoginLimiter, adminLogin);

// All routes below require admin authentication
router.use(authenticateAdmin);

// Admin profile
router.get("/auth/me", adminGetMe);

// Dashboard stats
router.get("/stats", getAdminStats);
router.get("/overview", getAdminOverview);
router.get("/payments", getPayments);

// Global search
router.get("/search", globalSearch);

// User management
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/status", toggleUserStatus);
router.delete("/users/:id", requireAdminRole("SUPER_ADMIN"), deleteUser);

// Professional management
router.get("/professionals", getProfessionals);

// Verification management
router.get("/verification-requests", getVerificationRequests);
router.put("/verification/:id", processVerification);

// Service management
router.get("/services", getServices);
router.put("/services/:id/status", toggleServiceStatus);
router.delete("/services/:id", requireAdminRole("SUPER_ADMIN", "ADMIN"), deleteService);

// Request / booking management
router.get("/requests", getRequests);

// Review management
router.get("/reviews", getReviews);
router.delete("/reviews/:id", requireAdminRole("SUPER_ADMIN", "ADMIN"), deleteReview);

// Category management
router.get("/categories", getCategories);
router.post("/categories", requireAdminRole("SUPER_ADMIN", "ADMIN"), createCategory);
router.put("/categories/:id", requireAdminRole("SUPER_ADMIN", "ADMIN"), updateCategory);
router.delete("/categories/:id", requireAdminRole("SUPER_ADMIN"), deleteCategory);

// Notification management
router.post("/notifications/send", sendNotification);

module.exports = router;
