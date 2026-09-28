const { Professional, User, Service, Review, Category } = require("../models");
const { analyzeCV } = require("../services/ai.service");
const { updateVerificationProgression } = require("../services/verification.service");
const { calculateHaversineDistance, formatDistance } = require("../utils/distance.util");

const getAllProfessionals = async (req, res, next) => {
  try {
    const { profession, status, location, search, latitude, longitude } = req.query;
    const query = {};

    if (profession) query.profession = new RegExp(profession, "i");
    if (status) query.verificationStatus = status;

    if (search) {
      const reg = new RegExp(search, "i");
      query.$or = [{ profession: reg }, { bio: reg }, { groupName: reg }];
    }

    let professionals = await Professional.find(query)
      .populate("userId", "id firstName lastName phone profileImage location isActive latitude longitude")
      .sort({ rating: -1, createdAt: -1 });

    if (location) {
      const locReg = new RegExp(location, "i");
      professionals = professionals.filter(
        (p) => p.userId && p.userId.location && locReg.test(p.userId.location)
      );
    }

    const clientLat = latitude !== undefined && latitude !== null && latitude !== "" ? Number(latitude) : null;
    const clientLon = longitude !== undefined && longitude !== null && longitude !== "" ? Number(longitude) : null;

    // Attach services, reviews, and distance
    const enriched = await Promise.all(
      professionals.map(async (p) => {
        const pObj = p.toObject();
        pObj.services = await Service.find({ professionalId: p._id }).populate("categoryId");
        pObj.reviews = await Review.find({ professionalId: p._id })
          .populate("customerId", "firstName lastName profileImage")
          .limit(5);

        const profLat = p.latitude ?? p.userId?.latitude ?? null;
        const profLon = p.longitude ?? p.userId?.longitude ?? null;

        let distanceKm = null;
        if (clientLat !== null && clientLon !== null && profLat !== null && profLon !== null) {
          distanceKm = calculateHaversineDistance(clientLat, clientLon, profLat, profLon);
        }

        pObj.distanceKm = distanceKm;
        pObj.distanceText = formatDistance(distanceKm);
        pObj.reviewCount = await Review.countDocuments({ professionalId: p._id });
        delete pObj.walletBalance;

        if (pObj.locationVisibility === "CITY_ONLY" || pObj.locationVisibility === "APPROXIMATE") {
          delete pObj.latitude;
          delete pObj.longitude;
          if (pObj.userId) {
            delete pObj.userId.latitude;
            delete pObj.userId.longitude;
          }
        }

        return pObj;
      })
    );

    return res.json({
      success: true,
      // Deactivated accounts are hidden from the marketplace
      data: enriched.filter((p) => p.userId && p.userId.isActive !== false),
    });
  } catch (error) {
    next(error);
  }
};

const getProfessionalById = async (req, res, next) => {
  try {
    const professional = await Professional.findById(req.params.id).populate(
      "userId",
      "id firstName lastName phone profileImage location isActive"
    );

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
      });
    }

    const pObj = professional.toObject();
    pObj.services = await Service.find({ professionalId: professional._id }).populate("categoryId");
    pObj.reviews = await Review.find({ professionalId: professional._id })
      .populate("customerId", "firstName lastName profileImage")
      .sort({ createdAt: -1 });
    pObj.reviewCount = pObj.reviews.length;

    // Earnings are private to the artisan and admins
    if (!req.user || (req.user.role !== "ADMIN" && req.user._id.toString() !== professional.userId?._id?.toString())) {
      delete pObj.walletBalance;
    }

    return res.json({
      success: true,
      data: pObj,
    });
  } catch (error) {
    next(error);
  }
};

const createProfessional = async (req, res, next) => {
  try {
    const {
      profession,
      bio,
      experience,
      skills,
      education,
      certifications,
      cvUrl,
      videoUrl,
      coverPhoto,
      portfolio,
      artisanType,
      groupName,
      groupSize,
      groupRegNum,
      leadName,
    } = req.body;

    const existing = await Professional.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Professional profile already exists for this user.",
      });
    }

    const skillsArray = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const certsArray = Array.isArray(certifications) ? certifications : [];
    const portfolioArray = Array.isArray(portfolio) ? portfolio : [];

    let cvAnalysis = { verificationScore: 0 };
    try {
      cvAnalysis = await analyzeCV({
        profession,
        skills: skillsArray,
        experience: Number(experience) || 0,
        education,
      });
    } catch (e) {
      console.warn("CV analysis skipped:", e.message);
    }

    const professional = await Professional.create({
      userId: req.user._id,
      artisanType: artisanType || "SINGLE",
      groupName: groupName || null,
      groupSize: Number(groupSize) || 1,
      groupRegNum: groupRegNum || null,
      leadName: leadName || null,
      profession: profession || "General Specialist",
      bio,
      experience: Number(experience) || 0,
      skills: skillsArray,
      education,
      certifications: certsArray,
      cvUrl,
      videoUrl,
      coverPhoto,
      portfolio: portfolioArray,
      verificationStatus: "unverified",
      verifiedBadge: false,
      verificationScore: cvAnalysis.verificationScore || 0,
    });

    if (req.user.role !== "PROFESSIONAL" && req.user.role !== "ADMIN") {
      req.user.role = "PROFESSIONAL";
      await req.user.save();
    }

    return res.status(201).json({
      success: true,
      message: "Professional profile created successfully.",
      data: professional,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfessional = async (req, res, next) => {
  try {
    const professional = await Professional.findById(req.params.id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
      });
    }

    const isOwner = req.user._id.toString() === professional.userId.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Cannot update another professional's profile.",
      });
    }

    const {
      profession,
      bio,
      experience,
      skills,
      education,
      certifications,
      cvUrl,
      videoUrl,
      availability,
      coverPhoto,
      portfolio,
      artisanType,
      groupName,
      latitude,
      longitude,
      serviceArea,
      locationVisibility,
    } = req.body;

    if (profession) professional.profession = profession;
    if (bio !== undefined) professional.bio = bio;
    if (experience !== undefined) professional.experience = Number(experience);
    if (skills) {
      professional.skills = Array.isArray(skills)
        ? skills
        : typeof skills === "string"
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : professional.skills;
    }
    if (education !== undefined) professional.education = education;
    if (certifications) professional.certifications = certifications;
    if (cvUrl !== undefined) professional.cvUrl = cvUrl;
    if (videoUrl !== undefined) professional.videoUrl = videoUrl;
    if (coverPhoto !== undefined) professional.coverPhoto = coverPhoto;
    if (portfolio !== undefined) professional.portfolio = Array.isArray(portfolio) ? portfolio : professional.portfolio;
    if (availability !== undefined) professional.availability = availability;
    if (artisanType) professional.artisanType = artisanType;
    if (groupName !== undefined) professional.groupName = groupName;
    if (latitude !== undefined && latitude !== null) professional.latitude = Number(latitude);
    if (longitude !== undefined && longitude !== null) professional.longitude = Number(longitude);
    if (serviceArea !== undefined) professional.serviceArea = serviceArea ? String(serviceArea).trim() : null;
    if (locationVisibility && ["EXACT", "APPROXIMATE", "CITY_ONLY"].includes(locationVisibility)) {
      professional.locationVisibility = locationVisibility;
    }

    try {
      const cvAnalysis = await analyzeCV({
        profession: professional.profession,
        skills: professional.skills,
        experience: professional.experience,
        education: professional.education,
      });
      if (cvAnalysis.verificationScore) {
        professional.verificationScore = cvAnalysis.verificationScore;
      }
    } catch (e) {
      // ignore
    }

    await professional.save();
    await updateVerificationProgression(professional._id);

    return res.json({
      success: true,
      message: "Professional profile updated.",
      data: professional,
    });
  } catch (error) {
    next(error);
  }
};

const updateArtisanLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, serviceArea, locationVisibility, location } = req.body;

    let professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      if (req.params.id) {
        professional = await Professional.findById(req.params.id);
      }
    }

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found for this user.",
      });
    }

    const isOwner = req.user._id.toString() === professional.userId.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Cannot update another professional's location.",
      });
    }

    if (latitude !== undefined && latitude !== null) {
      const numLat = Number(latitude);
      if (isNaN(numLat) || numLat < -90 || numLat > 90) {
        return res.status(400).json({ success: false, message: "Invalid latitude value." });
      }
      professional.latitude = numLat;
    }

    if (longitude !== undefined && longitude !== null) {
      const numLon = Number(longitude);
      if (isNaN(numLon) || numLon < -180 || numLon > 180) {
        return res.status(400).json({ success: false, message: "Invalid longitude value." });
      }
      professional.longitude = numLon;
    }

    if (serviceArea !== undefined) {
      professional.serviceArea = serviceArea ? String(serviceArea).trim() : null;
    }

    if (locationVisibility) {
      if (!["EXACT", "APPROXIMATE", "CITY_ONLY"].includes(locationVisibility)) {
        return res.status(400).json({
          success: false,
          message: "Invalid locationVisibility option. Allowed: EXACT, APPROXIMATE, CITY_ONLY",
        });
      }
      professional.locationVisibility = locationVisibility;
    }

    await professional.save();

    if (location) {
      await User.findByIdAndUpdate(professional.userId, {
        location: location.trim(),
        latitude: professional.latitude,
        longitude: professional.longitude,
      });
    } else if (professional.latitude && professional.longitude) {
      await User.findByIdAndUpdate(professional.userId, {
        latitude: professional.latitude,
        longitude: professional.longitude,
      });
    }

    return res.json({
      success: true,
      message: "Artisan location updated successfully.",
      data: professional,
    });
  } catch (error) {
    next(error);
  }
};

const getNearbyProfessionals = async (req, res, next) => {
  try {
    const { latitude, longitude, maxDistance, profession, search, sortBy = "distance" } = req.query;

    const query = {};
    if (profession) query.profession = new RegExp(profession, "i");
    if (search) {
      const reg = new RegExp(search, "i");
      query.$or = [{ profession: reg }, { bio: reg }, { groupName: reg }, { skills: reg }];
    }

    let professionals = await Professional.find(query).populate(
      "userId",
      "id firstName lastName phone profileImage location isActive latitude longitude"
    );

    professionals = professionals.filter((p) => p.userId && p.userId.isActive !== false);

    const clientLat = latitude !== undefined && latitude !== null && latitude !== "" ? Number(latitude) : null;
    const clientLon = longitude !== undefined && longitude !== null && longitude !== "" ? Number(longitude) : null;
    const maxDist = maxDistance !== undefined && maxDistance !== null && maxDistance !== "" && maxDistance !== "all" ? Number(maxDistance) : null;

    const enriched = await Promise.all(
      professionals.map(async (p) => {
        const pObj = p.toObject();
        pObj.services = await Service.find({ professionalId: p._id }).populate("categoryId");
        pObj.reviews = await Review.find({ professionalId: p._id })
          .populate("customerId", "firstName lastName profileImage")
          .limit(5);

        const profLat = p.latitude ?? p.userId?.latitude ?? null;
        const profLon = p.longitude ?? p.userId?.longitude ?? null;

        let distanceKm = null;
        if (clientLat !== null && clientLon !== null && profLat !== null && profLon !== null) {
          distanceKm = calculateHaversineDistance(clientLat, clientLon, profLat, profLon);
        }

        pObj.distanceKm = distanceKm;
        pObj.distanceText = formatDistance(distanceKm);
        pObj.reviewCount = await Review.countDocuments({ professionalId: p._id });
        delete pObj.walletBalance;

        if (pObj.locationVisibility === "CITY_ONLY" || pObj.locationVisibility === "APPROXIMATE") {
          delete pObj.latitude;
          delete pObj.longitude;
          if (pObj.userId) {
            delete pObj.userId.latitude;
            delete pObj.userId.longitude;
          }
        }

        return pObj;
      })
    );

    let filtered = enriched;
    if (maxDist !== null && !isNaN(maxDist) && clientLat !== null && clientLon !== null) {
      filtered = enriched.filter((p) => p.distanceKm !== null && p.distanceKm <= maxDist);
    }

    if (sortBy === "distance" && clientLat !== null && clientLon !== null) {
      filtered.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "relevance") {
      filtered.sort((a, b) => {
        const distPenaltyA = a.distanceKm ? a.distanceKm * 0.5 : 50;
        const distPenaltyB = b.distanceKm ? b.distanceKm * 0.5 : 50;
        const scoreA = (a.rating || 0) * 20 + (a.verificationScore || 0) * 0.2 - distPenaltyA;
        const scoreB = (b.rating || 0) * 20 + (b.verificationScore || 0) * 0.2 - distPenaltyB;
        return scoreB - scoreA;
      });
    }

    return res.json({
      success: true,
      count: filtered.length,
      clientLocation: clientLat !== null && clientLon !== null ? { latitude: clientLat, longitude: clientLon } : null,
      data: filtered,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProfessional = async (req, res, next) => {
  try {
    const professional = await Professional.findById(req.params.id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
      });
    }

    const isOwner = req.user._id.toString() === professional.userId.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    await Service.deleteMany({ professionalId: professional._id });
    await Professional.findByIdAndDelete(professional._id);

    return res.json({
      success: true,
      message: "Professional profile deleted.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProfessionals,
  getProfessionalById,
  createProfessional,
  updateProfessional,
  updateArtisanLocation,
  getNearbyProfessionals,
  deleteProfessional,
};
