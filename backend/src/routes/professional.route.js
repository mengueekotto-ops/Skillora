const express = require("express");
const router = express.Router();
const {
  getAllProfessionals,
  getProfessionalById,
  createProfessional,
  updateProfessional,
  updateArtisanLocation,
  getNearbyProfessionals,
  deleteProfessional,
} = require("../controllers/professional.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

router.get("/", getAllProfessionals);
router.get("/nearby", getNearbyProfessionals);
router.put("/location", authenticateToken, authorizeRoles("PROFESSIONAL", "ADMIN"), updateArtisanLocation);
router.put("/:id/location", authenticateToken, authorizeRoles("PROFESSIONAL", "ADMIN"), updateArtisanLocation);
router.get("/:id", getProfessionalById);
router.post("/", authenticateToken, authorizeRoles("PROFESSIONAL", "ADMIN"), createProfessional);
router.put("/:id", authenticateToken, authorizeRoles("PROFESSIONAL", "ADMIN"), updateProfessional);
router.delete("/:id", authenticateToken, authorizeRoles("PROFESSIONAL", "ADMIN"), deleteProfessional);

module.exports = router;
