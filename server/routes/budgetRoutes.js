const express = require('express');
const router = express.Router();
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { budgetValidator, mongoIdParam } = require('../validators/commonValidators');

router.use(protect);
router.route('/').get(getBudgets).post(budgetValidator, validate, createBudget);
router.route('/:id').put(mongoIdParam(), validate, updateBudget).delete(mongoIdParam(), validate, deleteBudget);

module.exports = router;
