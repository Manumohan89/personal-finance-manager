const express = require('express');
const router = express.Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  depositToGoal,
  withdrawFromGoal,
} = require('../controllers/goalController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { goalValidator, mongoIdParam } = require('../validators/commonValidators');
const { body } = require('express-validator');

router.use(protect);
router.route('/').get(getGoals).post(goalValidator, validate, createGoal);
router.route('/:id').put(mongoIdParam(), validate, updateGoal).delete(mongoIdParam(), validate, deleteGoal);
router.post('/:id/deposit', mongoIdParam(), body('amount').isFloat({ gt: 0 }), validate, depositToGoal);
router.post('/:id/withdraw', mongoIdParam(), body('amount').isFloat({ gt: 0 }), validate, withdrawFromGoal);

module.exports = router;
