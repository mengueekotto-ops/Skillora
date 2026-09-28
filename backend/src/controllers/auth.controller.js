const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { User, Professional } = require("../models");
const { analyzeCV } = require("../services/ai.service");
const { signToken } = require("../utils/jwt.util");

const MIN_PASSWORD_LENGTH = 8;
const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_RESET_ATTEMPTS = 5;

// Only these roles can be self-assigned at sign-up. Admins are created with scripts/createNewAdmin.js.
const PUBLIC_ROLES = {
  CUSTOMER: "CUSTOMER",
  CLIENT: "CUSTOMER",
  PROFESSIONAL: "PROFESSIONAL",
  ARTISAN: "PROFESSIONAL",
};

const hashResetCode = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");

const buildUserPayload = (user, professionalProfile = null) => ({
  id: user._id.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  location: user.location,
  profileImage: user.profileImage,
  isActive: user.isActive,
  professionalProfile,
});

const issueToken = (user) =>
  signToken({ id: user._id.toString(), email: user.email, role: user.role });

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
      artisanType,
      groupName,
      groupSize,
      groupRegNum,
    } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and password are required.",
      });
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      });
    }

    const formattedRole = PUBLIC_ROLES[String(role).toUpperCase()];
    if (!formattedRole) {
      return res.status(403).json({
        success: false,
        message: "This account type cannot be created through public registration.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
        artisanType: artisanType === "GROUPED" ? "GROUPED" : "SINGLE",
        groupName: artisanType === "GROUPED" ? groupName || null : null,
        groupSize: artisanType === "GROUPED" ? Number(groupSize) || 1 : 1,
        groupRegNum: artisanType === "GROUPED" ? groupRegNum || null : null,
        profession: profession || "General Professional",
        bio: bio || "",
        experience: Number(experience) || 0,
        skills: skillsArray,
        serviceArea: location ? location.trim() : null,
        verificationStatus: "unverified",
        verifiedBadge: false,
        verificationScore: cvAnalysis.verificationScore || 0,
      });
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        token: issueToken(user),
        user: buildUserPayload(user, professionalProfile),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
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

    const rawInput = email.trim();
    const normalizedInput = rawInput.toLowerCase();

    // Single login field: email OR phone number
    const user = await User.findOne({
      $or: [{ email: normalizedInput }, { phone: rawInput }],
    }).select("+password");

    // Same message for unknown account and wrong password, so accounts cannot be enumerated
    if (!user || !(await bcrypt.compare(password, user.password))) {
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

    // Admins must use the admin portal (stricter rate limit, short-lived session)
    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts must sign in through the admin portal.",
      });
    }

    let professionalProfile = null;
    if (user.role === "PROFESSIONAL") {
      professionalProfile = await Professional.findOne({ userId: user._id });
    }

    return res.json({
      success: true,
      message: "Login successful.",
      data: {
        token: issueToken(user),
        user: buildUserPayload(user, professionalProfile),
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
    if (req.user.role === "PROFESSIONAL") {
      professionalProfile = await Professional.findOne({ userId: req.user._id });
    }

    return res.json({
      success: true,
      message: "User context retrieved.",
      data: {
        user: buildUserPayload(req.user, professionalProfile),
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address or phone number is required.",
      });
    }

    // Identical response whether or not the account exists (prevents account enumeration)
    const genericResponse = {
      success: true,
      message:
        "If an account matches this email or phone number, a 6-digit reset code has been sent. It expires in 15 minutes.",
    };

    const rawInput = email.trim();
    const user = await User.findOne({
      $or: [{ email: rawInput.toLowerCase() }, { phone: rawInput }],
    });

    if (!user || !user.isActive) {
      return res.json(genericResponse);
    }

    const resetCode = crypto.randomInt(100000, 1000000).toString();
    user.resetPasswordToken = hashResetCode(resetCode);
    user.resetPasswordExpires = new Date(Date.now() + RESET_CODE_TTL_MS);
    user.resetPasswordAttempts = 0;
    await user.save();

    // TODO: deliver the code by email/SMS once a provider is configured.
    // Until then it is only printed in the server console, and only outside production.
    if (process.env.NODE_ENV !== "production") {
      console.log(`🔐 [DEV ONLY] Password reset code for ${user.email}: ${resetCode}`);
    }

    return res.json(genericResponse);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, resetCode, newPassword } = req.body || {};

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, reset code, and new password are required.",
      });
    }

    if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      });
    }

    const rawInput = email.trim();
    const user = await User.findOne({
      $or: [{ email: rawInput.toLowerCase() }, { phone: rawInput }],
    }).select("+resetPasswordToken +resetPasswordExpires +resetPasswordAttempts");

    const invalid = () =>
      res.status(400).json({
        success: false,
        message: "Invalid or expired password reset code.",
      });

    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) return invalid();

    if (new Date() > user.resetPasswordExpires || user.resetPasswordAttempts >= MAX_RESET_ATTEMPTS) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return invalid();
    }

    if (user.resetPasswordToken !== hashResetCode(String(resetCode).trim())) {
      user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
      await user.save();
      return invalid();
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.resetPasswordAttempts = 0;
    await user.save();

    return res.json({
      success: true,
      message: "Password reset successfully. You can now log in.",
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
  forgotPassword,
  resetPassword,
};
