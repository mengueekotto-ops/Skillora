const { Notification } = require("../models");

const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);

    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const isOwner = req.user._id.toString() === notification.userId.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    return res.json({
      success: true,
      message: "All notifications marked as read.",
      data: { updated: result.modifiedCount || 0 },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
