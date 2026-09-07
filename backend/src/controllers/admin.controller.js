const { User, Professional, ServiceRequest, Review, Category } = require("../models");

const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const totalProfessionals = await Professional.count();
    const verifiedProfessionals = await Professional.count({ where: { verificationStatus: ["VERIFIED", "TRUSTED", "EXPERT"] } });
    const pendingVerifications = await Professional.count({ where: { verificationStatus: "NEW" } });
    const totalServiceRequests = await ServiceRequest.count();
    const completedMissions = await ServiceRequest.count({ where: { status: "COMPLETED" } });
    const cancelledMissions = await ServiceRequest.count({ where: { status: "CANCELLED" } });

    const reviews = await Review.findAll({ attributes: ["rating"] });
    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalProfessionals,
        verifiedProfessionals,
        pendingVerifications,
        totalServiceRequests,
        completedMissions,
        cancelledMissions,
        averagePlatformRating: Number(avgRating),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getVerificationRequests = async (req, res, next) => {
  try {
    const pendingPros = await Professional.findAll({
      where: { verificationStatus: "NEW" },
      include: [{ model: User, as: "user", attributes: ["id", "firstName", "lastName", "email", "phone", "location"] }],
    });

    return res.json({
      success: true,
      data: pendingPros,
    });
  } catch (error) {
    next(error);
  }
};

const processVerification = async (req, res, next) => {
  try {
    const { action, targetStatus } = req.body; // action: 'APPROVE' or 'REJECT'
    const prof = await Professional.findByPk(req.params.id, {
      include: [{ model: User, as: "user" }],
    });

    if (!prof) {
      return res.status(404).json({
        success: false,
        message: "Professional not found.",
      });
    }

    if (action === "APPROVE") {
      prof.verificationStatus = targetStatus || "VERIFIED";
    } else if (action === "REJECT") {
      prof.verificationStatus = "NEW";
    }

    await prof.save();

    return res.json({
      success: true,
      message: `Verification request ${action === "APPROVE" ? "approved" : "rejected"}.`,
      data: prof,
    });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.json({
      success: true,
      message: `User status changed to ${user.isActive ? "ACTIVE" : "INACTIVE"}.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getVerificationRequests,
  processVerification,
  toggleUserStatus,
};
