const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  User,
  Professional,
  ServiceRequest,
  Review,
  Category,
  Service,
  Notification,
  Verification,
  VerificationQuestion,
  VerificationAnswer,
  VerificationDocument,
} = require("../models");

// Admin Login
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.role !== "ADMIN") {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is deactivated. Contact system owner.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: "ADMIN",
        adminRole: "SUPER_ADMIN",
      },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.json({
      success: true,
      message: "Admin login successful.",
      token,
      data: {
        token,
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          adminRole: "SUPER_ADMIN",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin Profile
const adminGetMe = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: {
        admin: {
          id: req.admin._id.toString(),
          firstName: req.admin.firstName,
          lastName: req.admin.lastName,
          email: req.admin.email,
          role: req.admin.role,
        },
        adminRole: req.adminRole || "SUPER_ADMIN",
      },
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard Real-Time Statistics
const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: "CUSTOMER" });
    const totalProfessionals = await Professional.countDocuments();

    const verifiedProfessionals = await Professional.countDocuments({
      $or: [
        { verificationStatus: "verified" },
        { verificationStatus: "VERIFIED" },
        { verificationStatus: "TRUSTED" },
        { verificationStatus: "EXPERT" },
        { verifiedBadge: true },
      ],
    });

    const unverifiedProfessionals = await Professional.countDocuments({
      $or: [
        { verificationStatus: "unverified" },
        { verificationStatus: "NEW" },
        { verificationStatus: "failed" },
        { verifiedBadge: false },
      ],
    });

    const pendingVerifications = await Verification.countDocuments({
      status: "pending",
    });

    const activeUsers = await User.countDocuments({ isActive: true });
    const suspendedUsers = await User.countDocuments({ isActive: false });

    const totalServices = await Service.countDocuments();
    const totalServiceRequests = await ServiceRequest.countDocuments();
    const completedMissions = await ServiceRequest.countDocuments({ status: "COMPLETED" });
    const cancelledMissions = await ServiceRequest.countDocuments({ status: "CANCELLED" });

    const totalReviews = await Review.countDocuments();
    const allReviews = await Review.find({}, "rating");
    const avgRating =
      allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length).toFixed(1)
        : "0.0";

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalClients,
        totalProfessionals,
        verifiedProfessionals,
        unverifiedProfessionals,
        pendingVerifications,
        activeUsers,
        suspendedUsers,
        totalServices,
        totalServiceRequests,
        completedMissions,
        cancelledMissions,
        totalReviews,
        averagePlatformRating: Number(avgRating),
        totalTransactions: completedMissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Global Search
const globalSearch = async (req, res, next) => {
  try {
    const query = (req.query.q || "").trim();
    if (!query) {
      return res.json({
        success: true,
        data: { users: [], professionals: [], services: [], categories: [] },
      });
    }

    const reg = new RegExp(query, "i");

    const users = await User.find({
      $or: [{ firstName: reg }, { lastName: reg }, { email: reg }, { location: reg }],
    })
      .select("-password")
      .limit(10);

    const professionals = await Professional.find({
      $or: [{ profession: reg }, { bio: reg }, { groupName: reg }],
    })
      .populate("userId", "firstName lastName email location profileImage")
      .limit(10);

    const services = await Service.find({
      $or: [{ title: reg }, { description: reg }, { location: reg }],
    })
      .populate("professionalId")
      .limit(10);

    const categories = await Category.find({
      $or: [{ name: reg }, { description: reg }],
    }).limit(10);

    return res.json({
      success: true,
      data: { users, professionals, services, categories },
    });
  } catch (error) {
    next(error);
  }
};

// User Management (Paginated)
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const search = (req.query.search || "").trim();
    const role = (req.query.role || "").trim();
    const status = (req.query.status || "").trim();

    const query = {};

    if (search) {
      const reg = new RegExp(search, "i");
      query.$or = [{ firstName: reg }, { lastName: reg }, { email: reg }, { phone: reg }];
    }

    if (role && role !== "ALL") {
      query.role = role.toUpperCase();
    }

    if (status && status !== "ALL") {
      query.isActive = status === "active" || status === "true";
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Enrich professionals with their professional profile
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const uObj = u.toObject();
        if (u.role === "PROFESSIONAL") {
          const pro = await Professional.findOne({ userId: u._id });
          uObj.professionalProfile = pro;
        }
        return uObj;
      })
    );

    return res.json({
      success: true,
      data: enrichedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get User by ID
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const uObj = user.toObject();
    if (user.role === "PROFESSIONAL") {
      uObj.professionalProfile = await Professional.findOne({ userId: user._id });
    }

    return res.json({ success: true, data: uObj });
  } catch (error) {
    next(error);
  }
};

// Toggle User Active / Inactive Status
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.json({
      success: true,
      message: `User status changed to ${user.isActive ? "ACTIVE" : "SUSPENDED"}.`,
      data: {
        id: user._id.toString(),
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete User Safely
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === "ADMIN" && user._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own active administrator account.",
      });
    }

    // Remove professional profile if exists
    if (user.role === "PROFESSIONAL") {
      const pro = await Professional.findOne({ userId: user._id });
      if (pro) {
        await Service.deleteMany({ professionalId: pro._id });
        await Verification.deleteMany({ artisanId: pro._id });
        await Professional.findByIdAndDelete(pro._id);
      }
    }

    await User.findByIdAndDelete(user._id);

    return res.json({
      success: true,
      message: "User account and associated resources removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// Professional / Artisan Management
const getProfessionals = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const profession = (req.query.profession || "").trim();
    const verificationStatus = (req.query.verificationStatus || "").trim();
    const search = (req.query.search || "").trim();

    const query = {};

    if (profession && profession !== "ALL") {
      query.profession = new RegExp(profession, "i");
    }

    if (verificationStatus && verificationStatus !== "ALL") {
      query.verificationStatus = verificationStatus;
    }

    if (search) {
      const reg = new RegExp(search, "i");
      query.$or = [{ profession: reg }, { bio: reg }, { groupName: reg }];
    }

    const total = await Professional.countDocuments(query);
    const pros = await Professional.find(query)
      .populate("userId", "firstName lastName email phone profileImage location isActive createdAt")
      .sort({ rating: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: pros,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verification Requests Management
const getVerificationRequests = async (req, res, next) => {
  try {
    const status = (req.query.status || "").trim();
    const query = {};
    if (status && status !== "ALL") {
      query.status = status;
    }

    const requests = await Verification.find(query)
      .populate({
        path: "artisanId",
        populate: { path: "userId", select: "firstName lastName email phone location profileImage isActive" },
      })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// Process Verification Request (Approve / Reject)
const processVerification = async (req, res, next) => {
  try {
    const { action, targetStatus, reason } = req.body || {};
    const verification = await Verification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Verification record not found.",
      });
    }

    const isApproved =
      action === "approve" ||
      action === "verify" ||
      targetStatus === "verified" ||
      targetStatus === "VERIFIED";

    const newStatus = isApproved ? "verified" : "failed";
    verification.status = newStatus;
    verification.adminDecision = reason || (isApproved ? "Approved by Administrator" : "Rejected by Administrator");
    verification.completedAt = new Date();
    verification.reviewedBy = req.admin ? `${req.admin.firstName} ${req.admin.lastName}` : "Super Admin";
    await verification.save();

    // Update Professional model
    const prof = await Professional.findById(verification.artisanId);
    if (prof) {
      prof.verificationStatus = newStatus;
      prof.verifiedBadge = isApproved;
      prof.verificationDate = isApproved ? new Date() : null;
      if (isApproved && prof.verificationScore < 80) {
        prof.verificationScore = 85;
      }
      await prof.save();
    }

    return res.json({
      success: true,
      message: `Artisan verification ${isApproved ? "approved" : "rejected"} successfully.`,
      data: {
        verification,
        professional: prof,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Services Management
const getServices = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const search = (req.query.search || "").trim();
    const status = (req.query.status || "").trim();
    const categoryId = (req.query.categoryId || "").trim();

    const query = {};
    if (status && status !== "ALL") {
      query.status = status.toUpperCase();
    }
    if (categoryId && categoryId !== "ALL") {
      query.categoryId = categoryId;
    }
    if (search) {
      const reg = new RegExp(search, "i");
      query.$or = [{ title: reg }, { description: reg }, { location: reg }];
    }

    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
      .populate({
        path: "professionalId",
        populate: { path: "userId", select: "firstName lastName email phone location profileImage" },
      })
      .populate("categoryId", "name description image")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: services,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Toggle Service Active / Inactive
const toggleServiceStatus = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    service.status = service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await service.save();

    return res.json({
      success: true,
      message: `Service status updated to ${service.status}.`,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Service
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }
    return res.json({ success: true, message: "Service removed successfully." });
  } catch (error) {
    next(error);
  }
};

// Service Requests / Bookings Management
const getRequests = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const status = (req.query.status || "").trim();

    const query = {};
    if (status && status !== "ALL") {
      query.status = status.toUpperCase();
    }

    const total = await ServiceRequest.countDocuments(query);
    const requests = await ServiceRequest.find(query)
      .populate("customerId", "firstName lastName email phone location profileImage")
      .populate({
        path: "professionalId",
        populate: { path: "userId", select: "firstName lastName email phone location profileImage" },
      })
      .populate("serviceId", "title price image")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reviews Management
const getReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const minRating = parseFloat(req.query.minRating);
    const maxRating = parseFloat(req.query.maxRating);

    const query = {};
    if (!isNaN(minRating)) query.rating = { ...query.rating, $gte: minRating };
    if (!isNaN(maxRating)) query.rating = { ...query.rating, $lte: maxRating };

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate("customerId", "firstName lastName email profileImage")
      .populate({
        path: "professionalId",
        populate: { path: "userId", select: "firstName lastName email" },
      })
      .populate("serviceRequestId", "description status scheduledDate")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete Review (Moderation)
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    const profId = review.professionalId;
    await Review.findByIdAndDelete(review._id);

    // Recalculate average rating for the artisan
    const remaining = await Review.find({ professionalId: profId });
    const prof = await Professional.findById(profId);
    if (prof) {
      if (remaining.length > 0) {
        prof.rating = Number((remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length).toFixed(1));
      } else {
        prof.rating = 0;
      }
      await prof.save();
    }

    return res.json({
      success: true,
      message: "Review removed and artisan rating recalculated.",
    });
  } catch (error) {
    next(error);
  }
};

// Categories Management
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required." });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      image: image || null,
    });

    return res.status(201).json({ success: true, message: "Category created.", data: category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body || {};
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description ? description.trim() : null;
    if (image !== undefined) category.image = image;

    await category.save();

    return res.json({ success: true, message: "Category updated.", data: category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }
    return res.json({ success: true, message: "Category deleted." });
  } catch (error) {
    next(error);
  }
};

// Send Broadcast or Targeted System Notification
const sendNotification = async (req, res, next) => {
  try {
    const { userId, targetRole, title, message } = req.body || {};

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required.",
      });
    }

    let recipients = [];
    if (userId) {
      recipients = [userId];
    } else if (targetRole && targetRole !== "ALL") {
      const users = await User.find({ role: targetRole, isActive: true }, "_id");
      recipients = users.map((u) => u._id);
    } else {
      const users = await User.find({ isActive: true }, "_id");
      recipients = users.map((u) => u._id);
    }

    const docs = recipients.map((uid) => ({
      userId: uid,
      title,
      message,
      type: "SYSTEM_BROADCAST",
      isRead: false,
    }));

    if (docs.length > 0) {
      await Notification.insertMany(docs);
    }

    return res.json({
      success: true,
      message: `Notification broadcast sent to ${docs.length} users.`,
      count: docs.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  adminGetMe,
  getAdminStats,
  getUsers,
  getUserById,
  toggleUserStatus,
  deleteUser,
  getProfessionals,
  getVerificationRequests,
  processVerification,
  getServices,
  toggleServiceStatus,
  deleteService,
  getRequests,
  getReviews,
  deleteReview,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  sendNotification,
  globalSearch,
};
