const express = require("express");
const router = express.Router();
const { toggleBookmark, getUserBookmarks } = require("../controllers/bookmark.controller");
const authenticateToken = require("../middleware/auth.middleware");

router.post("/toggle", authenticateToken, toggleBookmark);
router.get("/", authenticateToken, getUserBookmarks);

module.exports = router;
