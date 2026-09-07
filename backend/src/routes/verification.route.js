const express = require("express");
const router = express.Router();
const {
  startVerification,
  submitAnswer,
  uploadDocument,
  completeVerification,
  skipVerification,
  getVerificationStatus,
} = require("../controllers/verification.controllers");

router.post("/start", startVerification);
router.post("/skip", skipVerification);
router.post("/:id/submit-answer", submitAnswer);
router.post("/:id/upload-document", uploadDocument);
router.post("/:id/complete", completeVerification);
router.get("/:artisanId/status", getVerificationStatus);

module.exports = router;
