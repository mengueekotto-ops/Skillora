const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.post("/", authenticateToken, authorizeRoles("ADMIN"), createCategory);
router.put("/:id", authenticateToken, authorizeRoles("ADMIN"), updateCategory);
router.delete("/:id", authenticateToken, authorizeRoles("ADMIN"), deleteCategory);

module.exports = router;
