const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const { success } = require('../utils/formatResponse');

// @desc  List transactions with search, filter, sort, pagination
// @route GET /api/transactions
const getTransactions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    category,
    paymentMethod,
    startDate,
    endDate,
    search,
    sortBy = 'date',
    sortOrder = 'desc',
  } = req.query;

  const filter = { user: req.user._id };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  if (search) {
    const numericSearch = Number(search);
    const orClauses = [{ description: { $regex: search, $options: 'i' } }];
    if (!Number.isNaN(numericSearch)) orClauses.push({ amount: numericSearch });
    filter.$or = orClauses;
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('category', 'name icon color type')
      .populate('paymentMethod', 'name icon')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Transaction.countDocuments(filter),
  ]);

  return success(res, 200, 'Transactions fetched', { transactions }, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

// @desc  Get single transaction
// @route GET /api/transactions/:id
const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id })
    .populate('category', 'name icon color type')
    .populate('paymentMethod', 'name icon');
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  return success(res, 200, 'Transaction fetched', { transaction });
});

// @desc  Create transaction (used by both Quick Add Expense and Quick Add Income)
// @route POST /api/transactions
const createTransaction = asyncHandler(async (req, res) => {
  const { type, amount, category, paymentMethod, description, date, notes } = req.body;

  const transaction = await Transaction.create({
    user: req.user._id,
    type,
    amount,
    category,
    paymentMethod,
    description,
    date: date || Date.now(),
    notes,
  });

  const populated = await transaction.populate([
    { path: 'category', select: 'name icon color type' },
    { path: 'paymentMethod', select: 'name icon' },
  ]);

  return success(res, 201, `${type === 'income' ? 'Income' : 'Expense'} added successfully`, {
    transaction: populated,
  });
});

// @desc  Update transaction
// @route PUT /api/transactions/:id
const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  const fields = ['type', 'amount', 'category', 'paymentMethod', 'description', 'date', 'notes'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) transaction[field] = req.body[field];
  });

  await transaction.save();
  const populated = await transaction.populate([
    { path: 'category', select: 'name icon color type' },
    { path: 'paymentMethod', select: 'name icon' },
  ]);

  return success(res, 200, 'Transaction updated successfully', { transaction: populated });
});

// @desc  Delete transaction
// @route DELETE /api/transactions/:id
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  await transaction.deleteOne();
  return success(res, 200, 'Transaction deleted successfully');
});

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
