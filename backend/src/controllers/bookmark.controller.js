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
      userId: req.user._id,
      professionalId,
    });

    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      return res.json({
        success: true,
        message: "Removed from My Favorites.",
        isBookmarked: false,
      });
    } else {
      await Bookmark.create({
        userId: req.user._id,
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
    const bookmarks = await Bookmark.find({ userId: req.user._id })
      .populate({
        path: "professionalId",
        populate: [
          { path: "userId", select: "firstName lastName email phone profileImage location" },
        ],
      })
      .sort({ createdAt: -1 });

    // Enrich with services
    const enriched = await Promise.all(
      bookmarks.map(async (b) => {
        const bObj = b.toObject();
        if (b.professionalId) {
          bObj.professionalId.services = await Service.find({ professionalId: b.professionalId._id });
        }
        return bObj;
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

module.exports = {
  toggleBookmark,
  getUserBookmarks,
};
