const { Professional } = require("../models");

/**
 * Updates professional verification status based on progressive milestones:
 * NEW -> VERIFIED -> TRUSTED -> EXPERT
 */
const updateVerificationProgression = async (professionalId) => {
  const prof = await Professional.findById(professionalId);
  if (!prof) return null;

  let newStatus = prof.verificationStatus;

  const completed = prof.completedMissions || 0;
  const rating = prof.rating || 0;
  const verScore = prof.verificationScore || 0;

  if (completed >= 20 && rating >= 4.7 && verScore >= 85) {
    newStatus = "EXPERT";
  } else if (completed >= 8 && rating >= 4.4 && verScore >= 75) {
    newStatus = "TRUSTED";
  } else if (completed >= 2 || verScore >= 70) {
    newStatus = "VERIFIED";
  } else {
    newStatus = "NEW";
  }

  if (newStatus !== prof.verificationStatus) {
    prof.verificationStatus = newStatus;
    await prof.save();
  }

  return prof;
};

module.exports = {
  updateVerificationProgression,
};
