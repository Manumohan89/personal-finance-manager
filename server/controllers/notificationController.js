const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const { success } = require('../utils/formatResponse');

// @desc  List notifications (most recent first)
// @route GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  return success(res, 200, 'Notifications fetched', { notifications, unreadCount });
});

// @desc  Mark one notification as read
// @route PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  notification.isRead = true;
  await notification.save();
  return success(res, 200, 'Notification marked as read', { notification });
});

// @desc  Mark all notifications as read
// @route PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
  return success(res, 200, 'All notifications marked as read');
});

// @desc  Delete a notification
// @route DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  await notification.deleteOne();
  return success(res, 200, 'Notification deleted');
});

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
