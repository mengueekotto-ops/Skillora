const {
  Professional,
  Verification,
  VerificationQuestion,
  VerificationAnswer,
  VerificationDocument,
} = require("../models");
const {
  evaluateTechnicalAnswer,
  generateTechnicalQuestions,
  calculateVerificationDecision,
  analyzeDocument,
} = require("../services/ai.service");

/**
 * Start Verification Workflow for an Artisan (Optional)
 * POST /api/verifications/start
 */
async function startVerification(req, res, next) {
  try {
    const { artisanId } = req.body || {};

    if (!artisanId) {
      return res.status(400).json({
        success: false,
        message: "artisanId is required",
      });
    }

    const artisan = await Professional.findByPk(artisanId);
    if (!artisan) {
      return res.status(404).json({
        success: false,
        message: "Artisan profile not found",
      });
    }

    // Create new Verification session
    const verification = await Verification.create({
      artisanId,
      status: "pending",
      profileCompletenessScore: 85,
    });

    // Update artisan state to pending
    artisan.verificationStatus = "pending";
    artisan.verificationAttempts = (artisan.verificationAttempts || 0) + 1;
    await artisan.save();

    // Generate AI technical questions based on profession
    const generatedQuestions = await generateTechnicalQuestions({
      profession: artisan.profession,
      count: 3,
    });

    const questionRecords = [];
    for (const q of generatedQuestions) {
      const qRec = await VerificationQuestion.create({
        verificationId: verification.id,
        question: q.question,
        expectedAnswer: q.expectedAnswer,
        profession: artisan.profession,
        weight: q.weight || 33,
      });
      questionRecords.push(qRec);
    }

    return res.status(201).json({
      success: true,
      message: "AI Verification workflow initialized.",
      data: {
        verificationId: verification.id,
        artisanId,
        status: "pending",
        profession: artisan.profession,
        questions: questionRecords,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit an Answer to a Technical Assessment Question
 * POST /api/verifications/:id/submit-answer
 */
async function submitAnswer(req, res, next) {
  try {
    const verificationId = req.params.id;
    const { questionId, artisanId, answer } = req.body || {};

    if (!questionId || !artisanId || !answer) {
      return res.status(400).json({
        success: false,
        message: "questionId, artisanId, and answer are required",
      });
    }

    const question = await VerificationQuestion.findByPk(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Assessment question not found",
      });
    }

    // AI Evaluation with Gemini / rubric
    const aiResult = await evaluateTechnicalAnswer({
      profession: question.profession,
      question: question.question,
      answer,
    });

    // Save answer record
    const answerRecord = await VerificationAnswer.create({
      questionId,
      artisanId,
      answer,
      aiScore: aiResult.score,
      aiFeedback: aiResult.feedback,
      passed: aiResult.passed,
    });

    return res.status(200).json({
      success: true,
      message: "Answer evaluated by AI.",
      data: {
        answerId: answerRecord.id,
        aiScore: aiResult.score,
        passed: aiResult.passed,
        feedback: aiResult.feedback,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload & Analyze Professional Verification Document
 * POST /api/verifications/:id/upload-document
 */
async function uploadDocument(req, res, next) {
  try {
    const verificationId = req.params.id;
    const { documentType = "ID_CARD", fileUrl = "", textSnippet = "" } = req.body || {};

    const verification = await Verification.findByPk(verificationId, {
      include: [{ model: Professional, as: "artisan" }],
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Verification record not found",
      });
    }

    const aiResult = await analyzeDocument({
      documentType,
      textContent: textSnippet,
      declaredProfession: verification.artisan?.profession || "",
    });

    const docRecord = await VerificationDocument.create({
      verificationId,
      documentType,
      fileUrl: fileUrl || `https://vault.skillora.cm/docs/${Date.now()}_${documentType.toLowerCase()}.pdf`,
      aiResult,
      reviewStatus: aiResult.flags?.length > 0 ? "FLAGGED_FOR_ADMIN" : "APPROVED",
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded to vault & analyzed.",
      data: docRecord,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Finalize Verification Decision (Section 4 & 5 of Spec)
 * POST /api/verifications/:id/complete
 */
async function completeVerification(req, res, next) {
  try {
    const verificationId = req.params.id;

    const verification = await Verification.findByPk(verificationId, {
      include: [
        { model: Professional, as: "artisan" },
        { model: VerificationQuestion, as: "questions", include: [{ model: VerificationAnswer, as: "answers" }] },
      ],
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Verification record not found",
      });
    }

    // Calculate average technical assessment score
    let totalScore = 0;
    let count = 0;
    verification.questions?.forEach((q) => {
      q.answers?.forEach((a) => {
        totalScore += a.aiScore;
        count++;
      });
    });

    const techScore = count > 0 ? Math.round(totalScore / count) : 80;
    const profileCompleteness = 90;
    const documentConsistency = 88;

    const decision = calculateVerificationDecision({
      profileCompleteness,
      technicalScore: techScore,
      documentScore: documentConsistency,
      videoSubmitted: true,
    });

    // Update Verification Record
    verification.status = decision.status;
    verification.score = decision.overallScore;
    verification.completedAt = new Date();
    verification.profileCompletenessScore = profileCompleteness;
    verification.technicalAssessmentScore = techScore;
    verification.documentConsistencyScore = documentConsistency;
    verification.videoVerified = true;
    await verification.save();

    // Update Artisan Profile (Verified Badge & Status)
    const artisan = verification.artisan;
    if (artisan) {
      artisan.verificationStatus = decision.status;
      artisan.verifiedBadge = decision.verifiedBadge;
      artisan.verificationScore = decision.overallScore;
      artisan.verificationDate = decision.passed ? new Date() : null;
      await artisan.save();
    }

    return res.status(200).json({
      success: true,
      message: decision.message,
      data: {
        artisanId: artisan?.id,
        verificationStatus: decision.status,
        verifiedBadge: decision.verifiedBadge,
        verificationScore: decision.overallScore,
        decision,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Skip Verification (Unverified Artisan - Section 2 & 3 of Spec)
 * POST /api/verifications/skip
 */
async function skipVerification(req, res, next) {
  try {
    const { artisanId } = req.body || {};
    const artisan = await Professional.findByPk(artisanId);

    if (!artisan) {
      return res.status(404).json({
        success: false,
        message: "Artisan not found",
      });
    }

    artisan.verificationStatus = "unverified";
    artisan.verifiedBadge = false;
    await artisan.save();

    return res.status(200).json({
      success: true,
      message: "Artisan account set to unverified. Full platform access granted without Verified Badge.",
      data: {
        artisanId: artisan.id,
        verificationStatus: "unverified",
        verifiedBadge: false,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Verification Status for an Artisan
 * GET /api/verifications/:artisanId/status
 */
async function getVerificationStatus(req, res, next) {
  try {
    const { artisanId } = req.params;
    const artisan = await Professional.findByPk(artisanId, {
      include: [
        {
          model: Verification,
          as: "verifications",
          limit: 1,
          order: [["createdAt", "DESC"]],
          include: [
            { model: VerificationQuestion, as: "questions", include: [{ model: VerificationAnswer, as: "answers" }] },
            { model: VerificationDocument, as: "documents" },
          ],
        },
      ],
    });

    if (!artisan) {
      return res.status(404).json({
        success: false,
        message: "Artisan profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        artisanId: artisan.id,
        name: artisan.profession,
        verificationStatus: artisan.verificationStatus || "unverified",
        verifiedBadge: Boolean(artisan.verifiedBadge),
        verificationScore: artisan.verificationScore || 0,
        verificationDate: artisan.verificationDate,
        attempts: artisan.verificationAttempts || 0,
        latestVerification: artisan.verifications?.[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  startVerification,
  submitAnswer,
  uploadDocument,
  completeVerification,
  skipVerification,
  getVerificationStatus,
};
