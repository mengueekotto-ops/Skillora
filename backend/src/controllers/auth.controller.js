const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Professional } = require("../models");
const { analyzeCV } = require("../services/ai.service");

const register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role = "CUSTOMER",
      location,
      profession,
      bio,
      experience,
      skills,
    } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and password are required.",
      });
    }

    // Step 1: Normalize email (trim + lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    // Step 2: Pre-check if email already exists in MongoDB
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRole = (role || "CUSTOMER").toUpperCase();
    const formattedRole =
      normalizedRole === "ARTISAN" || normalizedRole === "PROFESSIONAL"
        ? "PROFESSIONAL"
        : normalizedRole === "ADMIN"
        ? "ADMIN"
        : "CUSTOMER";

    // Step 3: Create user in MongoDB
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : null,
      password: hashedPassword,
      role: formattedRole,
      location: location ? location.trim() : null,
    });

    let professionalProfile = null;
    if (formattedRole === "PROFESSIONAL") {
      const skillsArray = Array.isArray(skills)
        ? skills
        : typeof skills === "string"
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      let cvAnalysis = { verificationScore: 0 };
      try {
        cvAnalysis = await analyzeCV({
          profession: profession || "General Professional",
          skills: skillsArray,
          experience: Number(experience) || 0,
        });
      } catch (aiErr) {
        console.warn("AI CV analysis skipped or failed:", aiErr.message);
      }

      professionalProfile = await Professional.create({
        userId: user._id,
        profession: profession || "General Professional",
        bio: bio || "",
        experience: Number(experience) || 0,
        skills: skillsArray,
        verificationStatus: "unverified",
        verifiedBadge: false,
        verificationScore: cvAnalysis.verificationScore || 0,
      });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        token,
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
          professionalProfile,
        },
      },
    });
  } catch (error) {
    // Final protection: Catch MongoDB E11000 duplicate key error
    if (error.code === 11000 || (error.name === "MongoServerError" && error.code === 11000)) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
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

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    let professionalProfile = null;
    if (user.role === "PROFESSIONAL") {
      professionalProfile = await Professional.findOne({ userId: user._id });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
          profileImage: user.profileImage,
          professionalProfile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  return res.json({
    success: true,
    message: "Logged out successfully.",
  });
};

const getMe = async (req, res, next) => {
  try {
    let professionalProfile = null;
    if (req.user && req.user.role === "PROFESSIONAL") {
      professionalProfile = await Professional.findOne({ userId: req.user._id });
    }

    return res.json({
      success: true,
      message: "User context retrieved.",
      data: {
        user: {
          id: req.user._id.toString(),
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          phone: req.user.phone,
          role: req.user.role,
          location: req.user.location,
          profileImage: req.user.profileImage,
          isActive: req.user.isActive,
          professionalProfile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
