const express = require("express");
const router = express.Router();
const { register, login, logout, getMe, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const authenticateToken = require("../middleware/auth.middleware");
const { loginLimiter, resetLimiter, registerLimiter } = require("../middleware/rateLimit.middleware");

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.post("/forgot-password", resetLimiter, forgotPassword);
router.post("/reset-password", resetLimiter, resetPassword);
router.get("/me", authenticateToken, getMe);

module.exports = router;
