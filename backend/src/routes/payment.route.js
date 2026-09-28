const express = require("express");
const router = express.Router();
const {
  getFeeEstimate,
  initiatePayment,
  confirmPayment,
  getPaymentHistory,
  getDigiPayBalance,
} = require("../controllers/payment.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

// Public fee calculator
router.get("/estimate", getFeeEstimate);
router.post("/estimate", getFeeEstimate);

// Protected payment routes
router.post("/initiate", authenticateToken, initiatePayment);
router.post("/confirm", authenticateToken, confirmPayment);
router.get("/history", authenticateToken, getPaymentHistory);

// The platform's DigiPay account balance is for admins only
router.get("/balance", authenticateToken, authorizeRoles("ADMIN"), getDigiPayBalance);

module.exports = router;
