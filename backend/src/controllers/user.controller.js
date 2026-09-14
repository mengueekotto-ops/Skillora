const { User, Professional } = require("../models");

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    const enriched = await Promise.all(
      users.map(async (u) => {
        const uObj = u.toObject();
        if (u.role === "PROFESSIONAL") {
          uObj.professionalProfile = await Professional.findOne({ userId: u._id });
        }
        return uObj;
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

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const uObj = user.toObject();
    if (user.role === "PROFESSIONAL") {
      uObj.professionalProfile = await Professional.findOne({ userId: user._id });
    }

    return res.json({
      success: true,
      data: uObj,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, location, profileImage, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Only user themselves or admin can update
    const isOwner = req.user._id.toString() === user._id.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Cannot update another user profile.",
      });
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phone !== undefined) user.phone = phone ? phone.trim() : null;
    if (location !== undefined) user.location = location ? location.trim() : null;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (isActive !== undefined && isAdmin) user.isActive = isActive;

    await user.save();

    const uObj = user.toObject();
    delete uObj.password;

    return res.json({
      success: true,
      message: "User profile updated.",
      data: uObj,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isOwner = req.user._id.toString() === user._id.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Cannot delete another user account.",
      });
    }

    if (user.role === "PROFESSIONAL") {
      await Professional.deleteMany({ userId: user._id });
    }

    await User.findByIdAndDelete(user._id);

    return res.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
