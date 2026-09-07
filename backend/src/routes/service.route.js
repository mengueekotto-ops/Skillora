const express = require("express");
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/service.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

router.get("/", getAllServices);
router.get("/:id", getServiceById);
router.post("/", authenticateToken, authorizeRoles("PROFESSIONAL", "ADMIN"), createService);
router.put("/:id", authenticateToken, authorizeRoles("PROFESSIONAL", "ADMIN"), updateService);
router.delete("/:id", authenticateToken, authorizeRoles("PROFESSIONAL", "ADMIN"), deleteService);

module.exports = router;
