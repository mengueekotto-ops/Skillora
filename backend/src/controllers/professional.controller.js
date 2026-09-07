const { Professional, User, Service, Review, Category } = require("../models");
const { analyzeCV } = require("../services/ai.service");
const { updateVerificationProgression } = require("../services/verification.service");

const getAllProfessionals = async (req, res, next) => {
  try {
    const { profession, status, location } = req.query;
    const where = {};

    if (profession) where.profession = profession;
    if (status) where.verificationStatus = status;

    const userWhere = {};
    if (location) userWhere.location = location;

    const professionals = await Professional.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email", "phone", "profileImage", "location"],
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
        },
        {
          model: Service,
          as: "services",
          include: [{ model: Category, as: "category" }],
        },
        {
          model: Review,
          as: "reviews",
          include: [{ model: User, as: "customer", attributes: ["firstName", "lastName"] }],
        },
      ],
      order: [["rating", "DESC"]],
    });

    return res.json({
      success: true,
      data: professionals,
    });
  } catch (error) {
    next(error);
  }
};

const getProfessionalById = async (req, res, next) => {
  try {
    const professional = await Professional.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email", "phone", "profileImage", "location"],
        },
        {
          model: Service,
          as: "services",
          include: [{ model: Category, as: "category" }],
        },
        {
          model: Review,
          as: "reviews",
          include: [{ model: User, as: "customer", attributes: ["firstName", "lastName", "profileImage"] }],
        },
      ],
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
      });
    }

    return res.json({
      success: true,
      data: professional,
    });
  } catch (error) {
    next(error);
  }
};

const createProfessional = async (req, res, next) => {
  try {
    const { profession, bio, experience, skills, education, certifications, cvUrl, videoUrl } = req.body;

    const existing = await Professional.findOne({ where: { userId: req.user.id } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Professional profile already exists for this user.",
      });
    }

    const skillsArray = Array.isArray(skills) ? skills : typeof skills === "string" ? skills.split(",").map((s) => s.trim()) : [];
    const certsArray = Array.isArray(certifications) ? certifications : [];

    const cvAnalysis = await analyzeCV({
      profession,
      skills: skillsArray,
      experience: Number(experience) || 0,
      education,
    });

    const professional = await Professional.create({
      userId: req.user.id,
      profession: profession || "General Specialist",
      bio,
      experience: Number(experience) || 0,
      skills: skillsArray,
      education,
      certifications: certsArray,
      cvUrl,
      videoUrl,
      verificationStatus: "NEW",
      verificationScore: cvAnalysis.verificationScore,
    });

    // Update user role to PROFESSIONAL if needed
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
    const professional = await Professional.findByPk(req.params.id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
      });
    }

    if (req.user.id !== professional.userId && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Cannot update another professional's profile.",
      });
    }

    const { profession, bio, experience, skills, education, certifications, cvUrl, videoUrl, availability } = req.body;

    if (profession) professional.profession = profession;
    if (bio !== undefined) professional.bio = bio;
    if (experience !== undefined) professional.experience = Number(experience);
    if (skills) professional.skills = Array.isArray(skills) ? skills : typeof skills === "string" ? skills.split(",").map((s) => s.trim()) : professional.skills;
    if (education !== undefined) professional.education = education;
    if (certifications) professional.certifications = certifications;
    if (cvUrl !== undefined) professional.cvUrl = cvUrl;
    if (videoUrl !== undefined) professional.videoUrl = videoUrl;
    if (availability !== undefined) professional.availability = availability;

    // Recalculate AI score
    const cvAnalysis = await analyzeCV({
      profession: professional.profession,
      skills: professional.skills,
      experience: professional.experience,
      education: professional.education,
    });

    professional.verificationScore = cvAnalysis.verificationScore;
    await professional.save();

    await updateVerificationProgression(professional.id);

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
    const professional = await Professional.findByPk(req.params.id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
      });
    }

    if (req.user.id !== professional.userId && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    await professional.destroy();

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
