const express = require('express');
const router = express.Router();
const { getSummary, getMonthlyBreakdown, getCategoryBreakdown } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/summary', getSummary);
router.get('/monthly', getMonthlyBreakdown);
router.get('/categories', getCategoryBreakdown);

module.exports = router;
