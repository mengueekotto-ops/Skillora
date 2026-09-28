const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, updateUser, updateUserLocation, deleteUser } = require("../controllers/user.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

router.use(authenticateToken);

router.get("/", authorizeRoles("ADMIN"), getAllUsers);
router.post("/location", updateUserLocation);
router.put("/location", updateUserLocation);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
