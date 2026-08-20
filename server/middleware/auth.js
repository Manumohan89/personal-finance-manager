const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect private routes - verifies JWT and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    if (error.name === 'TokenExpiredError') {
      throw new Error('Session expired, please log in again');
    }
    throw new Error('Not authorized, invalid token');
  }
});

module.exports = { protect };
