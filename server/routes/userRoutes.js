const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getProfile, updateProfile, updatePassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[!@#$%^&*(),.?":{}|<>_\-+=]/)
      .withMessage('Password must contain at least one special character'),
  ],
  validate,
  updatePassword
);

module.exports = router;
