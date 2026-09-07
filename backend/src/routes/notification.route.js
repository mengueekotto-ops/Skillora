const express = require("express");
const router = express.Router();
const { getUserNotifications, markAsRead } = require("../controllers/notification.controller");
const authenticateToken = require("../middleware/auth.middleware");

router.get("/", authenticateToken, getUserNotifications);
router.put("/:id/read", authenticateToken, markAsRead);

module.exports = router;
