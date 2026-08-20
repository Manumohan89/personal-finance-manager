const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { mongoIdParam } = require('../validators/commonValidators');
const validate = require('../middleware/validate');

router.use(protect);
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', mongoIdParam(), validate, markAsRead);
router.delete('/:id', mongoIdParam(), validate, deleteNotification);

module.exports = router;
