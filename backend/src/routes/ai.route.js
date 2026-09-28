const express = require("express");
const router = express.Router();
const {
  evaluateAnswer,
  generateQuestions,
  extractIntent,
  generateDescription,
  analyzeDoc,
  handleRecommend,
  handleChat,
} = require("../controllers/ai.controller");

const authenticateToken = require("../middleware/auth.middleware");

// AI calls cost money per request, so every endpoint requires a logged-in user
router.use(authenticateToken);

router.post("/evaluate-answer", evaluateAnswer);
router.post("/generate-questions", generateQuestions);
router.post("/extract-intent", extractIntent);
router.post("/generate-description", generateDescription);
router.post("/analyze-document", analyzeDoc);
router.post("/recommend", handleRecommend);
router.post("/chat", handleChat);

module.exports = router;
