const { Review, Professional, User, ServiceRequest } = require("../models");
const { updateVerificationProgression } = require("../services/verification.service");

const recalculateProfessionalRating = async (professionalId) => {
  const reviews = await Review.findAll({ where: { professionalId } });
  if (reviews.length === 0) return;

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = Number((total / reviews.length).toFixed(1));

  const prof = await Professional.findByPk(professionalId);
  if (prof) {
    prof.rating = avgRating;
    await prof.save();
    await updateVerificationProgression(prof.id);
  }
};

const createReview = async (req, res, next) => {
  try {
    const {
      professionalId,
      serviceRequestId,
      rating,
      comment,
      qualityRating = 5,
      professionalismRating = 5,
      communicationRating = 5,
      punctualityRating = 5,
      reliabilityRating = 5,
    } = req.body;

    if (!professionalId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "Professional ID and overall rating are required.",
      });
    }

    const review = await Review.create({
      customerId: req.user.id,
      professionalId,
      serviceRequestId,
      rating: Number(rating),
      comment,
      qualityRating: Number(qualityRating),
      professionalismRating: Number(professionalismRating),
      communicationRating: Number(communicationRating),
      punctualityRating: Number(punctualityRating),
      reliabilityRating: Number(reliabilityRating),
    });

    await recalculateProfessionalRating(professionalId);

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const getAllReviews = async (req, res, next) => {
  try {
    const { professionalId, customerId } = req.query;
    const where = {};

    if (professionalId) where.professionalId = professionalId;
    if (customerId) where.customerId = customerId;

    const reviews = await Review.findAll({
      where,
      include: [
        { model: User, as: "customer", attributes: ["firstName", "lastName", "profileImage"] },
        { model: Professional, as: "professional" },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id, {
      include: [
        { model: User, as: "customer", attributes: ["firstName", "lastName", "profileImage"] },
        { model: Professional, as: "professional" },
      ],
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    return res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    if (review.customerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    const { rating, comment, qualityRating, professionalismRating, communicationRating, punctualityRating, reliabilityRating } = req.body;

    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment;
    if (qualityRating !== undefined) review.qualityRating = Number(qualityRating);
    if (professionalismRating !== undefined) review.professionalismRating = Number(professionalismRating);
    if (communicationRating !== undefined) review.communicationRating = Number(communicationRating);
    if (punctualityRating !== undefined) review.punctualityRating = Number(punctualityRating);
    if (reliabilityRating !== undefined) review.reliabilityRating = Number(reliabilityRating);

    await review.save();
    await recalculateProfessionalRating(review.professionalId);

    return res.json({
      success: true,
      message: "Review updated.",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    const profId = review.professionalId;
    await review.destroy();
    await recalculateProfessionalRating(profId);

    return res.json({
      success: true,
      message: "Review deleted.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
