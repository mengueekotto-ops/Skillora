const express = require("express");
const router = express.Router();
const {
  startVerification,
  submitAnswer,
  uploadDocument,
  completeVerification,
  skipVerification,
  getVerificationStatus,
  startQuizVerification,
  submitQuizResult,
} = require("../controllers/verification.controllers");
const authenticateToken = require("../middleware/auth.middleware");

// Public: anyone can check whether an artisan is verified
router.get("/:artisanId/status", getVerificationStatus);

// Everything else acts on the logged-in artisan's own profile
router.use(authenticateToken);

// ── Automated MCQ Quiz Routes ──────────────────────────────────────────────────
router.post("/quiz/start", startQuizVerification);
router.post("/quiz/submit", submitQuizResult);

// ── Written assessment workflow ────────────────────────────────────────────────
router.post("/start", startVerification);
router.post("/skip", skipVerification);
router.post("/:id/submit-answer", submitAnswer);
router.post("/:id/upload-document", uploadDocument);
router.post("/:id/complete", completeVerification);

module.exports = router;
