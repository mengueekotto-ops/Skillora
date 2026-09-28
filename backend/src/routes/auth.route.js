const express = require("express");
const router = express.Router();
const { register, login, logout, getMe, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const authenticateToken = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticateToken, getMe);

module.exports = router;
