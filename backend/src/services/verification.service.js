const { Professional } = require("../models");

/**
 * Updates an artisan's trust level from their track record:
 * NEW -> ESTABLISHED -> TRUSTED -> EXPERT
 *
 * This is separate from verificationStatus/verifiedBadge, which only the
 * verification quiz or an admin can change.
 */
const updateVerificationProgression = async (professionalId) => {
  const prof = await Professional.findById(professionalId);
  if (!prof) return null;

  const completed = prof.completedMissions || 0;
  const rating = prof.rating || 0;
  const verified = Boolean(prof.verifiedBadge);

  let trustLevel = "NEW";
  if (verified && completed >= 20 && rating >= 4.7) {
    trustLevel = "EXPERT";
  } else if (verified && completed >= 8 && rating >= 4.4) {
    trustLevel = "TRUSTED";
  } else if (completed >= 2) {
    trustLevel = "ESTABLISHED";
  }

  if (trustLevel !== prof.trustLevel) {
    prof.trustLevel = trustLevel;
    await prof.save();
  }

  return prof;
};

module.exports = {
  updateVerificationProgression,
};
