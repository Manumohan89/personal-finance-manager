const express = require('express');
const router = express.Router();
const {
  getMonthlyReport,
  getYearlyReport,
  getCategoryReport,
  getPaymentMethodReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/monthly', getMonthlyReport);
router.get('/yearly', getYearlyReport);
router.get('/categories', getCategoryReport);
router.get('/payment-methods', getPaymentMethodReport);

module.exports = router;
