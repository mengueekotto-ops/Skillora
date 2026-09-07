const { Notification } = require("../models");

const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

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
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    if (notification.userId !== req.user.id && req.user.role !== "ADMIN") {
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

module.exports = {
  getUserNotifications,
  markAsRead,
};
