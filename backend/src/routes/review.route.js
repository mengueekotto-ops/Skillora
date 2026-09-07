const express = require("express");
const router = express.Router();
const {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
} = require("../controllers/review.controller");
const authenticateToken = require("../middleware/auth.middleware");

router.post("/", authenticateToken, createReview);
router.get("/", getAllReviews);
router.get("/:id", getReviewById);
router.put("/:id", authenticateToken, updateReview);
router.delete("/:id", authenticateToken, deleteReview);

module.exports = router;
