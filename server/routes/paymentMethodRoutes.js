const express = require('express');
const router = express.Router();
const {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = require('../controllers/paymentMethodController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { mongoIdParam } = require('../validators/commonValidators');
const { body } = require('express-validator');

router.use(protect);
router
  .route('/')
  .get(getPaymentMethods)
  .post(body('name').trim().notEmpty().withMessage('Name is required'), validate, createPaymentMethod);
router
  .route('/:id')
  .put(mongoIdParam(), validate, updatePaymentMethod)
  .delete(mongoIdParam(), validate, deletePaymentMethod);

module.exports = router;
