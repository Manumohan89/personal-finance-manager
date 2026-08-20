const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const Category = require('../models/Category');
const PaymentMethod = require('../models/PaymentMethod');
const generateToken = require('../utils/generateToken');
const { success } = require('../utils/formatResponse');
const { seedDefaultsForUser } = require('../services/defaultsService');
const { sendResetEmail } = require('../services/emailService');

// @desc  Register new user
// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password });
  await seedDefaultsForUser(user._id);

  const token = generateToken(user._id);
  return success(res, 201, 'Account created successfully', { user, token });
});

// @desc  Login user
// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user._id);
  user.password = undefined;
  return success(res, 200, 'Login successful', { user, token });
});

// @desc  Get current logged-in user
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  return success(res, 200, 'Current user fetched', { user: req.user });
});

// @desc  Request password reset
// @route POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond the same way to avoid leaking which emails are registered
  if (!user) {
    return success(res, 200, 'If that email exists, a reset link has been sent');
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendResetEmail(user.email, resetUrl);

  return success(res, 200, 'If that email exists, a reset link has been sent');
});

// @desc  Reset password with token
// @route POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    res.status(400);
    throw new Error('Reset link is invalid or has expired');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const authToken = generateToken(user._id);
  return success(res, 200, 'Password reset successful', { token: authToken });
});

module.exports = { register, login, getMe, forgotPassword, resetPassword };
