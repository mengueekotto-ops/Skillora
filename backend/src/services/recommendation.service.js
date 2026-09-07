const { Professional, User, Service, Category, Review } = require("../models");

/**
 * AI Professional Recommendation Engine (Section 6 of Skillora Specification)
 * Calculates multi-factor match score:
 * Recommendation Score =
 *     Service Relevance * 0.35
 *   + Rating * 0.20
 *   + Verification * 0.20
 *   + Experience * 0.10
 *   + Availability * 0.10
 *   + Reviews * 0.05
 */
const recommendProfessionals = async ({
  query = "",
  categoryId = null,
  location = "",
  verifiedOnly = false,
  maxPrice = null,
  limit = 10,
}) => {
  const whereClause = {};
  if (verifiedOnly) {
    whereClause.verifiedBadge = true;
  }

  // Fetch active professionals with user profile
  const professionals = await Professional.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email", "phone", "profileImage", "location"],
        where: { isActive: true },
      },
      {
        model: Service,
        as: "services",
        include: [{ model: Category, as: "category" }],
      },
      {
        model: Review,
        as: "receivedReviews",
      },
    ],
  });

  const queryTerms = query.toLowerCase().split(" ").filter((t) => t.length > 2);

  const scoredProfessionals = professionals.map((prof) => {
    const userLoc = prof.user?.location || "";
    const profSkills = Array.isArray(prof.skills) ? prof.skills.join(" ").toLowerCase() : "";
    const profession = prof.profession.toLowerCase();
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

    // 3. Verification Score (20%) - 100 for verified badge, 0-60 for unverified
    let verificationFactor = 40;
    if (prof.verifiedBadge) {
      verificationFactor = 100;
    } else if (prof.verificationStatus === "pending") {
      verificationFactor = 65;
    } else if (prof.verificationScore) {
      verificationFactor = Math.min(80, prof.verificationScore);
    }

    // 4. Experience Score (10%)
    const expScore = Math.min(100, (prof.experience / 10) * 100);

    // 5. Availability Score (10%)
    const availScore = prof.availability?.isAvailable !== false ? 100 : 40;

    // 6. Reviews Score (5%)
    const reviewsCount = prof.receivedReviews?.length || prof.completedMissions || 0;
    const reviewsScore = Math.min(100, reviewsCount * 10);

    // Weighted Overall Recommendation Score (Section 6)
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
        id: prof.id,
        name: `${prof.user?.firstName || ""} ${prof.user?.lastName || ""}`.trim() || prof.profession,
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

  // Sort by highest match score
  scoredProfessionals.sort((a, b) => b.matchScore - a.matchScore);

  return scoredProfessionals.slice(0, limit);
};

module.exports = {
  recommendProfessionals,
};
