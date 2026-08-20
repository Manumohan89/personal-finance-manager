const express = require('express');
const router = express.Router();
const { getPlans, getPlan, createPlan, updatePlan, deletePlan } = require('../controllers/planController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { planValidator, mongoIdParam } = require('../validators/commonValidators');

router.use(protect);
router.route('/').get(getPlans).post(planValidator, validate, createPlan);
router
  .route('/:id')
  .get(mongoIdParam(), validate, getPlan)
  .put(mongoIdParam(), validate, updatePlan)
  .delete(mongoIdParam(), validate, deletePlan);

module.exports = router;
