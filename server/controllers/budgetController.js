const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { success } = require('../utils/formatResponse');
const { startOfMonth, endOfMonth } = require('../utils/dateRanges');

// Computes spent amount per budget's category/month/year and attaches status.
const attachSpent = async (userId, budgets) => {
  return Promise.all(
    budgets.map(async (b) => {
      const spentAgg = await Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            category: b.category._id,
            type: 'expense',
            date: { $gte: startOfMonth(b.year, b.month), $lte: endOfMonth(b.year, b.month) },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const spent = spentAgg[0]?.total || 0;
      const percentage = b.amount > 0 ? Number(((spent / b.amount) * 100).toFixed(1)) : 0;
      let status = 'ok';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      return {
        _id: b._id,
        category: b.category,
        amount: b.amount,
        month: b.month,
        year: b.year,
        spent,
        remaining: b.amount - spent,
        percentage,
        status,
      };
    })
  );
};

// @desc  List budgets for a month/year (defaults to current)
// @route GET /api/budgets
const getBudgets = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || now.getMonth() + 1;

  const budgets = await Budget.find({ user: req.user._id, year, month }).populate(
    'category',
    'name icon color'
  );
  const withSpent = await attachSpent(req.user._id, budgets);

  return success(res, 200, 'Budgets fetched', { budgets: withSpent });
});

// @desc  Create budget
// @route POST /api/budgets
const createBudget = asyncHandler(async (req, res) => {
  const { category, amount, month, year } = req.body;
  const exists = await Budget.findOne({ user: req.user._id, category, month, year });
  if (exists) {
    res.status(400);
    throw new Error('A budget already exists for this category and month');
  }
  const budget = await Budget.create({ user: req.user._id, category, amount, month, year });
  const populated = await budget.populate('category', 'name icon color');
  const [withSpent] = await attachSpent(req.user._id, [populated]);
  return success(res, 201, 'Budget created', { budget: withSpent });
});

// @desc  Update budget
// @route PUT /api/budgets/:id
const updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
  if (!budget) {
    res.status(404);
    throw new Error('Budget not found');
  }
  if (req.body.amount !== undefined) budget.amount = req.body.amount;
  await budget.save();
  const populated = await budget.populate('category', 'name icon color');
  const [withSpent] = await attachSpent(req.user._id, [populated]);
  return success(res, 200, 'Budget updated', { budget: withSpent });
});

// @desc  Delete budget
// @route DELETE /api/budgets/:id
const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
  if (!budget) {
    res.status(404);
    throw new Error('Budget not found');
  }
  await budget.deleteOne();
  return success(res, 200, 'Budget deleted');
});

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget, attachSpent };
