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
  generateMCQQuestions,
  calculateVerificationDecision,
  analyzeDocument,
} = require("../services/ai.service");
const { resolveOwnedProfessional, isAdmin, isSameId } = require("../utils/ownership.util");

const QUIZ_QUESTION_COUNT = 10;
const QUIZ_PASSING_PERCENT = 60;
const QUIZ_SECONDS_PER_QUESTION = 30;
const QUIZ_SESSION_TTL_MS = 30 * 60 * 1000;
const QUIZ_ENGINE = "Skillora AI Quiz Engine";

const fail = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

/**
 * Load a verification session and make sure the current user owns the artisan it belongs to.
 */
async function loadOwnedVerification(req, verificationId) {
  const verification = await Verification.findById(verificationId).populate("artisanId");
  if (!verification || !verification.artisanId) {
    return { status: 404, message: "Verification record not found" };
  }
  if (!isAdmin(req.user) && !isSameId(verification.artisanId.userId, req.user._id)) {
    return { status: 404, message: "Verification record not found" };
  }
  return { verification };
}

/** Rough profile completeness score (0-100) from the fields an artisan has filled in. */
function computeProfileCompleteness(artisan) {
  const checks = [
    Boolean(artisan.profession),
    Boolean(artisan.bio && artisan.bio.length >= 30),
    Array.isArray(artisan.skills) && artisan.skills.length > 0,
    (artisan.experience || 0) > 0,
    Boolean(artisan.videoUrl),
    Boolean(artisan.coverPhoto),
    Array.isArray(artisan.portfolio) && artisan.portfolio.length > 0,
    Boolean(artisan.serviceArea || artisan.latitude),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/**
 * Start the written technical-assessment workflow
 * POST /api/verifications/start   Body: { artisanId? }
 */
async function startVerification(req, res, next) {
  try {
    const owned = await resolveOwnedProfessional(req.user, (req.body || {}).artisanId);
    if (!owned.professional) return fail(res, owned.status, owned.message);
    const artisan = owned.professional;

    const verification = await Verification.create({
      artisanId: artisan._id,
      status: "pending",
      profileCompletenessScore: computeProfileCompleteness(artisan),
    });

    artisan.verificationStatus = "pending";
    artisan.verificationAttempts = (artisan.verificationAttempts || 0) + 1;
    await artisan.save();

    let generatedQuestions = [];
    try {
      generatedQuestions = await generateTechnicalQuestions({ profession: artisan.profession, count: 3 });
    } catch (e) {
      generatedQuestions = [
        { question: "How do you ensure workplace safety before starting your work?", expectedAnswer: "Safety check" },
      ];
    }

    const questionRecords = await VerificationQuestion.insertMany(
      generatedQuestions.map((q) => ({
        verificationId: verification._id,
        question: q.question,
        expectedAnswer: q.expectedAnswer || null,
        profession: artisan.profession,
        weight: q.weight || 33,
      }))
    );

    return res.status(201).json({
      success: true,
      message: "AI Verification workflow initialized.",
      data: {
        verificationId: verification._id,
        artisanId: artisan._id,
        status: "pending",
        profession: artisan.profession,
        // expectedAnswer stays on the server
        questions: questionRecords.map((q) => ({ id: q._id, question: q.question, weight: q.weight })),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit an answer to a written technical question
 * POST /api/verifications/:id/submit-answer   Body: { questionId, answer }
 */
async function submitAnswer(req, res, next) {
  try {
    const { questionId, answer } = req.body || {};
    if (!questionId || !answer) return fail(res, 400, "questionId and answer are required");

    const owned = await loadOwnedVerification(req, req.params.id);
    if (!owned.verification) return fail(res, owned.status, owned.message);
    const { verification } = owned;

    if (verification.status !== "pending") return fail(res, 400, "This verification session is already closed.");

    const question = await VerificationQuestion.findOne({ _id: questionId, verificationId: verification._id });
    if (!question) return fail(res, 404, "Assessment question not found");

    const alreadyAnswered = await VerificationAnswer.exists({ questionId: question._id });
    if (alreadyAnswered) return fail(res, 409, "This question has already been answered.");

    let aiResult = { score: 0, passed: false, feedback: "Answer could not be evaluated." };
    try {
      aiResult = await evaluateTechnicalAnswer({
        profession: question.profession,
        question: question.question,
        answer,
      });
    } catch (e) {
      console.warn("AI answer evaluation failed:", e.message);
    }

    const answerRecord = await VerificationAnswer.create({
      questionId: question._id,
      artisanId: verification.artisanId._id,
      answer,
      aiScore: aiResult.score,
      aiFeedback: aiResult.feedback,
      passed: aiResult.passed,
    });

    return res.status(200).json({
      success: true,
      message: "Answer evaluated by AI.",
      data: {
        answerId: answerRecord._id,
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
 * Attach and analyse a verification document
 * POST /api/verifications/:id/upload-document   Body: { documentType, fileUrl, textSnippet? }
 */
async function uploadDocument(req, res, next) {
  try {
    const { documentType = "ID_CARD", fileUrl = "", textSnippet = "" } = req.body || {};
    if (!fileUrl) return fail(res, 400, "fileUrl is required. Upload the file first via /api/upload/image.");

    const owned = await loadOwnedVerification(req, req.params.id);
    if (!owned.verification) return fail(res, owned.status, owned.message);
    const { verification } = owned;

    let aiResult = { consistencyScore: 0, flags: ["NOT_ANALYSED"] };
    try {
      aiResult = await analyzeDocument({
        documentType,
        textContent: textSnippet,
        declaredProfession: verification.artisanId.profession || "",
      });
    } catch (e) {
      console.warn("AI document analysis failed:", e.message);
    }

    const docRecord = await VerificationDocument.create({
      verificationId: verification._id,
      documentType,
      fileUrl,
      aiResult,
      // Identity documents always get a human review; others only when the AI raises flags
      reviewStatus:
        ["ID_CARD", "PASSPORT", "SELFIE"].includes(documentType) || aiResult.flags?.length > 0
          ? "FLAGGED_FOR_ADMIN"
          : "APPROVED",
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded & queued for review.",
      data: docRecord,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Finalize the written-assessment verification decision
 * POST /api/verifications/:id/complete
 */
async function completeVerification(req, res, next) {
  try {
    const owned = await loadOwnedVerification(req, req.params.id);
    if (!owned.verification) return fail(res, owned.status, owned.message);
    const { verification } = owned;

    if (verification.status !== "pending") return fail(res, 400, "This verification session is already closed.");

    const questions = await VerificationQuestion.find({ verificationId: verification._id });
    const answers = await VerificationAnswer.find({ questionId: { $in: questions.map((q) => q._id) } });
    if (questions.length === 0 || answers.length < questions.length) {
      return fail(res, 400, "Answer every assessment question before completing verification.");
    }

    const techScore = Math.round(answers.reduce((sum, a) => sum + (a.aiScore || 0), 0) / answers.length);

    const documents = await VerificationDocument.find({ verificationId: verification._id });
    const documentConsistency = documents.length
      ? Math.round(
          documents.reduce((sum, d) => sum + (Number(d.aiResult?.consistencyScore) || 0), 0) / documents.length
        )
      : 0;

    const artisan = await Professional.findById(verification.artisanId._id);
    const profileCompleteness = computeProfileCompleteness(artisan);

    const decision = calculateVerificationDecision({
      profileCompleteness,
      technicalScore: techScore,
      documentScore: documentConsistency,
      videoSubmitted: Boolean(artisan.videoUrl),
    });

    verification.status = decision.status;
    verification.score = decision.overallScore;
    verification.completedAt = new Date();
    verification.profileCompletenessScore = profileCompleteness;
    verification.technicalAssessmentScore = techScore;
    verification.documentConsistencyScore = documentConsistency;
    verification.videoVerified = Boolean(artisan.videoUrl);
    await verification.save();

    artisan.verificationStatus = decision.status;
    artisan.verifiedBadge = decision.verifiedBadge;
    artisan.verificationScore = decision.overallScore;
    artisan.verificationDate = decision.passed ? new Date() : null;
    await artisan.save();

    return res.status(200).json({
      success: true,
      message: decision.message,
      data: {
        artisanId: artisan._id,
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
 * Skip verification (artisan works without the Verified Badge)
 * POST /api/verifications/skip   Body: { artisanId? }
 */
async function skipVerification(req, res, next) {
  try {
    const owned = await resolveOwnedProfessional(req.user, (req.body || {}).artisanId);
    if (!owned.professional) return fail(res, owned.status, owned.message);
    const artisan = owned.professional;

    // Skipping never removes a badge that was already earned
    if (!artisan.verifiedBadge) {
      artisan.verificationStatus = "unverified";
      await artisan.save();
    }

    return res.status(200).json({
      success: true,
      message: "You can offer services now and complete verification at any time.",
      data: {
        artisanId: artisan._id,
        verificationStatus: artisan.verificationStatus,
        verifiedBadge: artisan.verifiedBadge,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Public verification status of an artisan
 * GET /api/verifications/:artisanId/status
 */
async function getVerificationStatus(req, res, next) {
  try {
    const artisan = await Professional.findById(req.params.artisanId);
    if (!artisan) return fail(res, 404, "Artisan profile not found");

    const latestVerification = await Verification.findOne({
      artisanId: artisan._id,
      status: { $ne: "pending" },
    })
      .sort({ createdAt: -1 })
      .select("status score completedAt reviewedBy");

    return res.status(200).json({
      success: true,
      data: {
        artisanId: artisan._id,
        profession: artisan.profession,
        verificationStatus: artisan.verificationStatus || "unverified",
        verifiedBadge: Boolean(artisan.verifiedBadge),
        verificationScore: artisan.verificationScore || 0,
        verificationDate: artisan.verificationDate,
        attempts: artisan.verificationAttempts || 0,
        latestVerification,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Start a 10-question MCQ quiz for the logged-in artisan.
 * The correct answers are stored server-side; the client only receives the questions.
 * POST /api/verifications/quiz/start   Body: { artisanId?, lang? }
 */
async function startQuizVerification(req, res, next) {
  try {
    const { artisanId, lang = "fr" } = req.body || {};

    const owned = await resolveOwnedProfessional(req.user, artisanId);
    if (!owned.professional) return fail(res, owned.status, owned.message);
    const artisan = owned.professional;
    const profession = artisan.profession || "General Artisan";

    // Close any quiz session left open, so only one can be active at a time
    await Verification.updateMany(
      { artisanId: artisan._id, status: "pending", reviewedBy: QUIZ_ENGINE },
      { status: "failed", completedAt: new Date(), adminDecision: "ABANDONED — superseded by a new quiz" }
    );

    let questions = [];
    try {
      questions = await generateMCQQuestions({ profession, lang });
    } catch (e) {
      console.warn("⚠️ generateMCQQuestions failed:", e.message);
    }

    questions = (questions || []).filter(
      (q) => q && q.q && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.correct)
    );
    if (questions.length < QUIZ_QUESTION_COUNT) {
      return fail(res, 503, "The quiz could not be generated right now. Please try again in a moment.");
    }
    questions = questions.slice(0, QUIZ_QUESTION_COUNT);

    const verification = await Verification.create({
      artisanId: artisan._id,
      status: "pending",
      reviewedBy: QUIZ_ENGINE,
    });

    const records = await VerificationQuestion.insertMany(
      questions.map((q) => ({
        verificationId: verification._id,
        question: q.q,
        profession,
        options: q.options,
        correctOption: q.correct,
        explanation: q.explanation || "",
        weight: 10,
      }))
    );

    return res.status(200).json({
      success: true,
      message: `Quiz generated for ${profession} (${records.length} questions)`,
      data: {
        sessionToken: verification._id.toString(),
        artisanId: artisan._id,
        profession,
        totalQuestions: records.length,
        timePerQuestion: QUIZ_SECONDS_PER_QUESTION,
        passingScore: QUIZ_PASSING_PERCENT,
        questions: records.map((r, idx) => ({ index: idx, q: r.question, options: r.options })),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Grade a quiz session and update the artisan's verification status.
 * POST /api/verifications/quiz/submit   Body: { sessionToken, answers: number[], timedOut? }
 */
async function submitQuizResult(req, res, next) {
  try {
    const { sessionToken, answers = [], timedOut = false } = req.body || {};
    if (!sessionToken) return fail(res, 400, "sessionToken is required");

    const owned = await loadOwnedVerification(req, sessionToken).catch(() => ({
      status: 400,
      message: "Invalid quiz session token",
    }));
    if (!owned.verification) return fail(res, owned.status, owned.message);
    const { verification } = owned;

    if (verification.reviewedBy !== QUIZ_ENGINE) return fail(res, 400, "Invalid quiz session token");
    if (verification.status !== "pending") {
      return fail(res, 409, "This quiz has already been submitted. Start a new quiz to retry.", {
        code: "SESSION_CLOSED",
      });
    }

    const artisan = await Professional.findById(verification.artisanId._id);
    const expired = Date.now() - new Date(verification.startedAt).getTime() > QUIZ_SESSION_TTL_MS;

    if (timedOut || expired) {
      verification.status = "failed";
      verification.score = 0;
      verification.completedAt = new Date();
      verification.adminDecision = expired ? "EXPIRED — session window elapsed" : "TIMED OUT — retry allowed";
      await verification.save();

      artisan.verificationAttempts = (artisan.verificationAttempts || 0) + 1;
      await artisan.save();

      return res.status(200).json({
        success: true,
        timedOut: true,
        message: "Time expired. Please start a new quiz.",
        data: {
          artisanId: artisan._id,
          passed: false,
          score: 0,
          scorePercent: 0,
          verificationStatus: artisan.verificationStatus,
          verifiedBadge: artisan.verifiedBadge,
          attempts: artisan.verificationAttempts,
        },
      });
    }

    const questions = await VerificationQuestion.find({ verificationId: verification._id }).sort({ _id: 1 });
    let correct = 0;
    const detailed = questions.map((q, idx) => {
      const given = Number.isInteger(answers[idx]) ? answers[idx] : null;
      const expected = Number(q.correctOption);
      const isCorrect = given === expected;
      if (isCorrect) correct++;
      return { question: idx + 1, given, expected, isCorrect, explanation: q.explanation };
    });

    const total = questions.length || QUIZ_QUESTION_COUNT;
    const scorePercent = Math.round((correct / total) * 100);
    const passed = scorePercent >= QUIZ_PASSING_PERCENT;

    verification.status = passed ? "verified" : "failed";
    verification.score = scorePercent;
    verification.technicalAssessmentScore = scorePercent;
    verification.completedAt = new Date();
    verification.adminDecision = passed
      ? `PASSED — Score: ${scorePercent}% (${correct}/${total} correct)`
      : `FAILED — Score: ${scorePercent}% (${correct}/${total} correct) — Retry allowed`;
    await verification.save();

    artisan.verificationAttempts = (artisan.verificationAttempts || 0) + 1;
    if (passed) {
      artisan.verificationStatus = "verified";
      artisan.verifiedBadge = true;
      artisan.verificationScore = scorePercent;
      artisan.verificationDate = new Date();
    } else if (!artisan.verifiedBadge) {
      // A failed retry never removes a badge that was already earned
      artisan.verificationStatus = "failed";
    }
    await artisan.save();

    return res.status(200).json({
      success: true,
      message: passed
        ? `Congratulations! You scored ${scorePercent}% and earned the Skillora Verified Badge! ✓`
        : `Score: ${scorePercent}%. You need ${QUIZ_PASSING_PERCENT}% to pass. You may retry.`,
      data: {
        artisanId: artisan._id,
        passed,
        score: correct,
        scorePercent,
        totalQuestions: total,
        passingThreshold: QUIZ_PASSING_PERCENT,
        verificationStatus: artisan.verificationStatus,
        verifiedBadge: artisan.verifiedBadge,
        verificationDate: artisan.verificationDate,
        attempts: artisan.verificationAttempts,
        verificationId: verification._id,
        detailed,
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
  startQuizVerification,
  submitQuizResult,
};
