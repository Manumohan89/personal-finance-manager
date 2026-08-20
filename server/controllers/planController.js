const asyncHandler = require('express-async-handler');
const FinancialPlan = require('../models/FinancialPlan');
const { success } = require('../utils/formatResponse');

// @desc  List financial plans
// @route GET /api/plans
const getPlans = asyncHandler(async (req, res) => {
  const plans = await FinancialPlan.find({ user: req.user._id }).sort({ createdAt: -1 });
  return success(res, 200, 'Financial plans fetched', { plans });
});

// @desc  Get single plan
// @route GET /api/plans/:id
const getPlan = asyncHandler(async (req, res) => {
  const plan = await FinancialPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) {
    res.status(404);
    throw new Error('Financial plan not found');
  }
  return success(res, 200, 'Financial plan fetched', { plan });
});

// @desc  Create financial plan
// @route POST /api/plans
const createPlan = asyncHandler(async (req, res) => {
  const { planName, initialAmount, description, allocations } = req.body;
  const plan = await FinancialPlan.create({
    user: req.user._id,
    planName,
    initialAmount,
    description,
    allocations: allocations || [],
  });
  return success(res, 201, 'Financial plan created', { plan });
});

// @desc  Update financial plan (name, amount, description, or full allocations array)
// @route PUT /api/plans/:id
const updatePlan = asyncHandler(async (req, res) => {
  const plan = await FinancialPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) {
    res.status(404);
    throw new Error('Financial plan not found');
  }
  const { planName, initialAmount, description, allocations } = req.body;
  if (planName !== undefined) plan.planName = planName;
  if (initialAmount !== undefined) plan.initialAmount = initialAmount;
  if (description !== undefined) plan.description = description;
  if (allocations !== undefined) plan.allocations = allocations;
  await plan.save();
  return success(res, 200, 'Financial plan updated', { plan });
});

// @desc  Delete financial plan
// @route DELETE /api/plans/:id
const deletePlan = asyncHandler(async (req, res) => {
  const plan = await FinancialPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) {
    res.status(404);
    throw new Error('Financial plan not found');
  }
  await plan.deleteOne();
  return success(res, 200, 'Financial plan deleted');
});

module.exports = { getPlans, getPlan, createPlan, updatePlan, deletePlan };
