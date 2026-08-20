const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { success } = require('../utils/formatResponse');

// @desc  Get profile
// @route GET /api/users/profile
const getProfile = asyncHandler(async (req, res) => {
  return success(res, 200, 'Profile fetched', { user: req.user });
});

// @desc  Update profile
// @route PUT /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, currency, theme, monthlyIncome, onboardingCompleted, notificationPrefs } = req.body;
  const user = await User.findById(req.user._id);

  if (name !== undefined) user.name = name;
  if (currency !== undefined) user.currency = currency;
  if (theme !== undefined) user.theme = theme;
  if (monthlyIncome !== undefined) user.monthlyIncome = Number(monthlyIncome) || 0;
  if (onboardingCompleted !== undefined) user.onboardingCompleted = Boolean(onboardingCompleted);
  if (notificationPrefs !== undefined) {
    user.notificationPrefs = { ...user.notificationPrefs.toObject(), ...notificationPrefs };
  }

  await user.save();
  return success(res, 200, 'Profile updated', { user });
});

// @desc  Change password
// @route PUT /api/users/password
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  return success(res, 200, 'Password updated successfully');
});

module.exports = { getProfile, updateProfile, updatePassword };
