const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/user.controller");
const authenticateToken = require("../middleware/auth.middleware");

// Direct access to list all users for Admin Dashboard
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", authenticateToken, updateUser);
router.delete("/:id", authenticateToken, deleteUser);

module.exports = router;