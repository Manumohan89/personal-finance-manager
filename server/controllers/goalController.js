const asyncHandler = require('express-async-handler');
const Goal = require('../models/Goal');
const { success } = require('../utils/formatResponse');

const shapeGoal = (goal) => {
  const obj = goal.toObject ? goal.toObject() : goal;
  const percentage = obj.targetAmount > 0 ? Number(((obj.currentAmount / obj.targetAmount) * 100).toFixed(1)) : 0;
  return { ...obj, percentage: Math.min(percentage, 100), remaining: Math.max(obj.targetAmount - obj.currentAmount, 0) };
};

// @desc  List goals
// @route GET /api/goals
const getGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
  return success(res, 200, 'Goals fetched', { goals: goals.map(shapeGoal) });
});

// @desc  Create goal
// @route POST /api/goals
const createGoal = asyncHandler(async (req, res) => {
  const { name, targetAmount, currentAmount, deadline, description, icon } = req.body;
  const goal = await Goal.create({
    user: req.user._id,
    name,
    targetAmount,
    currentAmount: currentAmount || 0,
    deadline,
    description,
    icon,
  });
  return success(res, 201, 'Goal created', { goal: shapeGoal(goal) });
});

// @desc  Update goal
// @route PUT /api/goals/:id
const updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }
  const fields = ['name', 'targetAmount', 'deadline', 'description', 'icon'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) goal[f] = req.body[f];
  });
  await goal.save();
  return success(res, 200, 'Goal updated', { goal: shapeGoal(goal) });
});

// @desc  Delete goal
// @route DELETE /api/goals/:id
const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }
  await goal.deleteOne();
  return success(res, 200, 'Goal deleted');
});

// @desc  Deposit money into a goal
// @route POST /api/goals/:id/deposit
const depositToGoal = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Deposit amount must be greater than 0');
  }
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }
  goal.currentAmount += amount;
  if (goal.currentAmount >= goal.targetAmount) goal.isCompleted = true;
  await goal.save();
  return success(res, 200, 'Deposit added to goal', { goal: shapeGoal(goal) });
});

// @desc  Withdraw money from a goal
// @route POST /api/goals/:id/withdraw
const withdrawFromGoal = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Withdrawal amount must be greater than 0');
  }
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }
  if (amount > goal.currentAmount) {
    res.status(400);
    throw new Error('Cannot withdraw more than the current saved amount');
  }
  goal.currentAmount -= amount;
  goal.isCompleted = goal.currentAmount >= goal.targetAmount;
  await goal.save();
  return success(res, 200, 'Withdrawal recorded', { goal: shapeGoal(goal) });
});

module.exports = { getGoals, createGoal, updateGoal, deleteGoal, depositToGoal, withdrawFromGoal };
