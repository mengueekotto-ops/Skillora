const {
  evaluateTechnicalAnswer,
  generateTechnicalQuestions,
  extractSearchIntent,
  generateServiceDescription,
  analyzeDocument,
  calculateVerificationDecision,
  chatAssistant,
} = require("../services/ai.service");
const { recommendProfessionals } = require("../services/recommendation.service");
const { Professional } = require("../models");

/**
 * Technical Answer Evaluation Endpoint (Section 15 of Spec)
 * POST /api/ai/evaluate-answer
 */
async function evaluateAnswer(req, res) {
  try {
    const { profession, question, answer } = req.body || {};

    if (!profession || !question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Profession, question and answer are required",
      });
    }

    const result = await evaluateTechnicalAnswer({
      profession,
      question,
      answer,
    });

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("AI evaluation error:", error);
    return res.status(500).json({
      success: false,
      message: "AI evaluation failed",
      error: error.message,
    });
  }
}

/**
 * Generate Questions for an Artisan Profession
 * POST /api/ai/generate-questions
 */
async function generateQuestions(req, res) {
  try {
    const { profession = "Electrician", count = 3 } = req.body || {};
    const questions = await generateTechnicalQuestions({
      profession,
      count: Number(count) || 3,
    });

    return res.status(200).json({
      success: true,
      data: {
        profession,
        questions,
      },
    });
  } catch (error) {
    console.error("AI question generation error:", error);
    return res.status(500).json({
      success: false,
      message: "Question generation failed",
    });
  }
}

/**
 * Extract Intent from Natural Language Client Prompt
 * POST /api/ai/extract-intent
 */
async function extractIntent(req, res) {
  try {
    const { clientPrompt = "" } = req.body || {};
    const intent = await extractSearchIntent({ clientPrompt });

    return res.status(200).json({
      success: true,
      data: intent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Intent extraction failed",
    });
  }
}

/**
 * Generate Polished Service Description
 * POST /api/ai/generate-description
 */
async function generateDescription(req, res) {
  try {
    const { rawText = "", profession = "Artisan" } = req.body || {};
    const description = await generateServiceDescription({ rawText, profession });

    return res.status(200).json({
      success: true,
      data: { description },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Description generation failed",
    });
  }
}

/**
 * Analyze Uploaded Verification Document
 * POST /api/ai/analyze-document
 */
async function analyzeDoc(req, res) {
  try {
    const { documentType = "CV", textContent = "", declaredProfession = "" } = req.body || {};
    const analysis = await analyzeDocument({ documentType, textContent, declaredProfession });

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Document analysis failed",
    });
  }
}

/**
 * AI Recommendations with Weighted Scoring (Section 6 of Spec)
 * POST /api/ai/recommend
 */
async function handleRecommend(req, res) {
  try {
    const { query = "", categoryId = null, location = "", verifiedOnly = false, limit = 10 } = req.body || {};
    const recommendations = await recommendProfessionals({
      query,
      categoryId,
      location,
      verifiedOnly,
      limit: Number(limit) || 10,
    });

    return res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Recommendation generation failed",
    });
  }
}

/**
 * AI Assistant Chat Endpoint
 * POST /api/ai/chat
 */
async function handleChat(req, res) {
  try {
    const { message = "", location = "Yaoundé & Douala", lang = "fr", history = [] } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    console.log(`📡 [Backend API] POST /api/ai/chat received prompt: "${message}"`);
    const result = await chatAssistant({ message, location, lang, history });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ [Backend API Error] POST /api/ai/chat failed:", error);
    return res.status(500).json({
      success: false,
      message: "AI chat completion failed",
      error: error.message,
    });
  }
}

module.exports = {
  evaluateAnswer,
  generateQuestions,
  extractIntent,
  generateDescription,
  analyzeDoc,
  handleRecommend,
  handleChat,
};
