const asyncHandler = require('express-async-handler');
const RecurringTransaction = require('../models/RecurringTransaction');
const { success } = require('../utils/formatResponse');
const { generateDueTransactionsForUser } = require('../services/recurringService');

// @desc  List recurring transactions (and opportunistically generate any due occurrences)
// @route GET /api/recurring
const getRecurring = asyncHandler(async (req, res) => {
  await generateDueTransactionsForUser(req.user._id);
  const recurring = await RecurringTransaction.find({ user: req.user._id })
    .populate('category', 'name icon color')
    .populate('paymentMethod', 'name icon')
    .sort({ createdAt: -1 });
  return success(res, 200, 'Recurring transactions fetched', { recurring });
});

// @desc  Create recurring transaction
// @route POST /api/recurring
const createRecurring = asyncHandler(async (req, res) => {
  const { type, amount, category, paymentMethod, frequency, startDate, endDate, description } = req.body;
  const recurring = await RecurringTransaction.create({
    user: req.user._id,
    type,
    amount,
    category,
    paymentMethod,
    frequency,
    startDate,
    endDate: endDate || null,
    description,
  });
  const populated = await recurring.populate([
    { path: 'category', select: 'name icon color' },
    { path: 'paymentMethod', select: 'name icon' },
  ]);
  return success(res, 201, 'Recurring transaction created', { recurring: populated });
});

// @desc  Update recurring transaction
// @route PUT /api/recurring/:id
const updateRecurring = asyncHandler(async (req, res) => {
  const recurring = await RecurringTransaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!recurring) {
    res.status(404);
    throw new Error('Recurring transaction not found');
  }
  const fields = ['type', 'amount', 'category', 'paymentMethod', 'frequency', 'startDate', 'endDate', 'description', 'isActive'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) recurring[f] = req.body[f];
  });
  await recurring.save();
  const populated = await recurring.populate([
    { path: 'category', select: 'name icon color' },
    { path: 'paymentMethod', select: 'name icon' },
  ]);
  return success(res, 200, 'Recurring transaction updated', { recurring: populated });
});

// @desc  Delete recurring transaction
// @route DELETE /api/recurring/:id
const deleteRecurring = asyncHandler(async (req, res) => {
  const recurring = await RecurringTransaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!recurring) {
    res.status(404);
    throw new Error('Recurring transaction not found');
  }
  await recurring.deleteOne();
  return success(res, 200, 'Recurring transaction deleted');
});

module.exports = { getRecurring, createRecurring, updateRecurring, deleteRecurring };
