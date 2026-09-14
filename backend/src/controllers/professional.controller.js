const { Professional, User, Service, Review, Category } = require("../models");
const { analyzeCV } = require("../services/ai.service");
const { updateVerificationProgression } = require("../services/verification.service");

const getAllProfessionals = async (req, res, next) => {
  try {
    const { profession, status, location, search } = req.query;
    const query = {};

    if (profession) query.profession = new RegExp(profession, "i");
    if (status) query.verificationStatus = status;

    if (search) {
      const reg = new RegExp(search, "i");
      query.$or = [{ profession: reg }, { bio: reg }, { groupName: reg }];
    }

    let professionals = await Professional.find(query)
      .populate("userId", "id firstName lastName email phone profileImage location isActive")
      .sort({ rating: -1, createdAt: -1 });

    if (location) {
      const locReg = new RegExp(location, "i");
      professionals = professionals.filter(
        (p) => p.userId && p.userId.location && locReg.test(p.userId.location)
      );
    }

    // Attach services and reviews
    const enriched = await Promise.all(
      professionals.map(async (p) => {
        const pObj = p.toObject();
        pObj.services = await Service.find({ professionalId: p._id }).populate("categoryId");
        pObj.reviews = await Review.find({ professionalId: p._id })
          .populate("customerId", "firstName lastName profileImage")
          .limit(5);
        return pObj;
      })
    );

    return res.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

const getProfessionalById = async (req, res, next) => {
  try {
    const professional = await Professional.findById(req.params.id).populate(
      "userId",
      "id firstName lastName email phone profileImage location isActive"
    );

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
      });
    }

    const pObj = professional.toObject();
    pObj.services = await Service.find({ professionalId: professional._id }).populate("categoryId");
    pObj.reviews = await Review.find({ professionalId: professional._id }).populate(
      "customerId",
      "firstName lastName profileImage"
    );

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
  deleteProfessional,
};
