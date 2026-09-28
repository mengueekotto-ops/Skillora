const { Professional } = require("../models");

const isAdmin = (user) => Boolean(user && user.role === "ADMIN");

const isSameId = (a, b) => Boolean(a && b && a.toString() === b.toString());

/**
 * Resolve the Professional profile the current user is allowed to act on.
 * - Admins may target any profile by id.
 * - Everyone else may only target their own profile (the id is optional for them).
 * Returns { professional } or { status, message } on failure.
 */
const resolveOwnedProfessional = async (user, professionalId) => {
  if (isAdmin(user) && professionalId) {
    const professional = await Professional.findById(professionalId);
    return professional
      ? { professional }
      : { status: 404, message: "Artisan profile not found." };
  }

  const professional = await Professional.findOne({ userId: user._id });
  if (!professional) {
    return { status: 404, message: "No artisan profile is linked to this account." };
  }
  if (professionalId && !isSameId(professional._id, professionalId)) {
    return { status: 403, message: "Forbidden. You can only act on your own artisan profile." };
  }
  return { professional };
};

module.exports = { isAdmin, isSameId, resolveOwnedProfessional };
