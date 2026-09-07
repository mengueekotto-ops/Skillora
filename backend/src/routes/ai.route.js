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

// Section 16 & 17 of Specification: POST /api/ai/evaluate-answer
router.post("/evaluate-answer", evaluateAnswer);
router.post("/generate-questions", generateQuestions);
router.post("/extract-intent", extractIntent);
router.post("/generate-description", generateDescription);
router.post("/analyze-document", analyzeDoc);
router.post("/recommend", handleRecommend);
router.post("/chat", handleChat);

module.exports = router;
