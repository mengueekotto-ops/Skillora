const { User, Professional } = require("../models");

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      include: [{ model: Professional, as: "professionalProfile" }],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Professional, as: "professionalProfile" }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, location, profileImage, isActive } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Only user themselves or admin can update
    if (req.user.id !== user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Cannot update another user profile.",
      });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (isActive !== undefined && req.user.role === "ADMIN") user.isActive = isActive;

    await user.save();

    return res.json({
      success: true,
      message: "User profile updated.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (req.user.id !== user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Cannot delete another user account.",
      });
    }

    await user.destroy();

    return res.json({
      success: true,
      message: "User account deleted.",
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
