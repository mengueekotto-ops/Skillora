const { Bookmark, Professional, User, Service } = require("../models");

const toggleBookmark = async (req, res, next) => {
  try {
    const { professionalId } = req.body || {};
    if (!professionalId) {
      return res.status(400).json({
        success: false,
        message: "professionalId is required.",
      });
    }

    const existing = await Bookmark.findOne({
      where: { userId: req.user.id, professionalId },
    });

    if (existing) {
      await existing.destroy();
      return res.json({
        success: true,
        message: "Removed from My Favorites.",
        isBookmarked: false,
      });
    } else {
      await Bookmark.create({
        userId: req.user.id,
        professionalId,
      });
      return res.json({
        success: true,
        message: "Saved to My Favorites!",
        isBookmarked: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

const getUserBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Professional,
          as: "professional",
          include: [
            { model: User, as: "user", attributes: ["id", "firstName", "lastName", "email", "phone", "profileImage", "location"] },
            { model: Service, as: "services" },
          ],
        },
      ],
    });

    return res.json({
      success: true,
      data: bookmarks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleBookmark,
  getUserBookmarks,
};
