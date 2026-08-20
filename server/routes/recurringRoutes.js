const express = require('express');
const router = express.Router();
const {
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
} = require('../controllers/recurringController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { recurringValidator, mongoIdParam } = require('../validators/commonValidators');

router.use(protect);
router.route('/').get(getRecurring).post(recurringValidator, validate, createRecurring);
router
  .route('/:id')
  .put(mongoIdParam(), validate, updateRecurring)
  .delete(mongoIdParam(), validate, deleteRecurring);

module.exports = router;
