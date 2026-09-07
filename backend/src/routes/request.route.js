const express = require("express");
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
} = require("../controllers/request.controller");
const authenticateToken = require("../middleware/auth.middleware");

router.post("/", authenticateToken, createRequest);
router.get("/", authenticateToken, getAllRequests);
router.get("/:id", authenticateToken, getRequestById);
router.put("/:id", authenticateToken, updateRequestStatus);
router.delete("/:id", authenticateToken, deleteRequest);

module.exports = router;
