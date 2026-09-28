const express = require("express");
const router = express.Router();
const { getUserNotifications, markAsRead, markAllAsRead } = require("../controllers/notification.controller");
const authenticateToken = require("../middleware/auth.middleware");

router.get("/", authenticateToken, getUserNotifications);
router.put("/read-all", authenticateToken, markAllAsRead);
router.put("/:id/read", authenticateToken, markAsRead);

module.exports = router;
