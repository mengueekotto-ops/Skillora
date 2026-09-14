const { Professional, User, Service, Category, Review } = require("../models");

/**
 * AI Professional Recommendation Engine (Section 6 of Skillora Specification)
 */
const recommendProfessionals = async ({
  query = "",
  categoryId = null,
  location = "",
  verifiedOnly = false,
  maxPrice = null,
  limit = 10,
}) => {
  const queryFilter = {};
  if (verifiedOnly) {
    queryFilter.verifiedBadge = true;
  }

  let professionals = await Professional.find(queryFilter).populate(
    "userId",
    "id firstName lastName email phone profileImage location isActive"
  );

  // Filter only active users
  professionals = professionals.filter((p) => p.userId && p.userId.isActive !== false);

  if (location) {
    const locReg = new RegExp(location, "i");
    professionals = professionals.filter(
      (p) => p.userId && p.userId.location && locReg.test(p.userId.location)
    );
  }

  // Enrich with services and reviews
  const populatedProfessionals = await Promise.all(
    professionals.map(async (prof) => {
      const pObj = prof.toObject();
      pObj.services = await Service.find({ professionalId: prof._id }).populate("categoryId");
      pObj.receivedReviews = await Review.find({ professionalId: prof._id });
      return pObj;
    })
  );

  const queryTerms = query.toLowerCase().split(" ").filter((t) => t.length > 2);

  const scoredProfessionals = populatedProfessionals.map((prof) => {
    const userLoc = prof.userId?.location || "";
    const profSkills = Array.isArray(prof.skills) ? prof.skills.join(" ").toLowerCase() : "";
    const profession = (prof.profession || "").toLowerCase();
    const bio = (prof.bio || "").toLowerCase();

    // 1. Service Relevance (35%)
    let serviceRelevance = 60;
    if (queryTerms.length > 0) {
      let matches = 0;
      queryTerms.forEach((term) => {
        if (profession.includes(term)) matches += 3;
        if (profSkills.includes(term)) matches += 2;
        if (bio.includes(term)) matches += 1;
      });
      serviceRelevance = Math.min(100, Math.max(30, matches * 25));
    } else {
      serviceRelevance = 85;
    }

    // 2. Rating Score (20%)
    const ratingScore = prof.rating ? Math.min(100, (prof.rating / 5.0) * 100) : 75;

    // 3. Verification Score (20%)
    let verificationFactor = 40;
    if (prof.verifiedBadge) {
      verificationFactor = 100;
    } else if (prof.verificationStatus === "pending") {
      verificationFactor = 65;
    } else if (prof.verificationScore) {
      verificationFactor = Math.min(80, prof.verificationScore);
    }

    // 4. Experience Score (10%)
    const expScore = Math.min(100, ((prof.experience || 0) / 10) * 100);

    // 5. Availability Score (10%)
    const availScore = prof.availability?.isAvailable !== false ? 100 : 40;

    // 6. Reviews Score (5%)
    const reviewsCount = prof.receivedReviews?.length || prof.completedMissions || 0;
    const reviewsScore = Math.min(100, reviewsCount * 10);

    // Weighted Overall Recommendation Score
    const recommendationScore = Math.round(
      serviceRelevance * 0.35 +
      ratingScore * 0.20 +
      verificationFactor * 0.20 +
      expScore * 0.10 +
      availScore * 0.10 +
      reviewsScore * 0.05
    );

    return {
      professional: {
        id: prof._id,
        name: `${prof.userId?.firstName || ""} ${prof.userId?.lastName || ""}`.trim() || prof.profession,
        artisanType: prof.artisanType,
        groupName: prof.groupName,
        profession: prof.profession,
        location: userLoc,
        rating: prof.rating,
        experience: prof.experience,
        verificationStatus: prof.verificationStatus || "unverified",
        verifiedBadge: Boolean(prof.verifiedBadge),
        verificationScore: prof.verificationScore,
        services: prof.services,
      },
      matchScore: recommendationScore,
      breakdown: {
        serviceRelevance: Math.round(serviceRelevance),
        rating: Math.round(ratingScore),
        verification: Math.round(verificationFactor),
        experience: Math.round(expScore),
        availability: Math.round(availScore),
        reviews: Math.round(reviewsScore),
      },
    };
  });

  scoredProfessionals.sort((a, b) => b.matchScore - a.matchScore);

  return scoredProfessionals.slice(0, limit);
};

module.exports = {
  recommendProfessionals,
};
