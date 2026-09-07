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

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const formattedRole = (role || "CUSTOMER").toUpperCase() === "ARTISAN" || (role || "CUSTOMER").toUpperCase() === "PROFESSIONAL" ? "PROFESSIONAL" : (role || "CUSTOMER").toUpperCase() === "ADMIN" ? "ADMIN" : "CUSTOMER";

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: formattedRole,
      location,
    });

    let professionalProfile = null;
    if (formattedRole === "PROFESSIONAL") {
      const skillsArray = Array.isArray(skills) ? skills : typeof skills === "string" ? skills.split(",").map((s) => s.trim()) : [];
      
      const cvAnalysis = await analyzeCV({
        profession: profession || "General Professional",
        skills: skillsArray,
        experience: Number(experience) || 0,
      });

      professionalProfile = await Professional.create({
        userId: user.id,
        profession: profession || "General Professional",
        bio: bio || "",
        experience: Number(experience) || 0,
        skills: skillsArray,
        verificationStatus: "NEW",
        verificationScore: cvAnalysis.verificationScore,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        token,
        user: {
          id: user.id,
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

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [{ model: Professional, as: "professionalProfile" }],
    });

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

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
          profileImage: user.profileImage,
          professionalProfile: user.professionalProfile,
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

const getMe = async (req, res) => {
  return res.json({
    success: true,
    message: "User context retrieved.",
    data: {
      user: req.user,
    },
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
