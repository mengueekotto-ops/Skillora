const express = require("express");
const router = express.Router();
const {
  getAdminStats,
  getVerificationRequests,
  processVerification,
  toggleUserStatus,
} = require("../controllers/admin.controller");

// Direct unauthenticated access to Admin endpoints as requested
router.get("/stats", getAdminStats);
router.get("/verification-requests", getVerificationRequests);
router.put("/verification/:id", processVerification);
router.put("/users/:id/status", toggleUserStatus);

module.exports = router;
