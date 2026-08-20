const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { success } = require('../utils/formatResponse');
const { startOfMonth, endOfMonth, previousMonth } = require('../utils/dateRanges');

// Sums income/expense totals for a user within a date range (or all-time if no range).
const sumTotals = async (userId, dateFilter = {}) => {
  const match = { user: new mongoose.Types.ObjectId(userId) };
  if (dateFilter.$gte || dateFilter.$lte) match.date = dateFilter;

  const rows = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);

  const totals = { income: 0, expense: 0 };
  rows.forEach((r) => {
    totals[r._id] = r.total;
  });
  return totals;
};

const pctChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

// @desc  Overall + current month summary for the dashboard cards
// @route GET /api/dashboard/summary
const getSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const prev = previousMonth(year, month);

  const [allTime, currentMonth, prevMonth] = await Promise.all([
    sumTotals(req.user._id),
    sumTotals(req.user._id, { $gte: startOfMonth(year, month), $lte: endOfMonth(year, month) }),
    sumTotals(req.user._id, {
      $gte: startOfMonth(prev.year, prev.month),
      $lte: endOfMonth(prev.year, prev.month),
    }),
  ]);

  const totalBalance = allTime.income - allTime.expense;
  const currentMonthSavings = currentMonth.income - currentMonth.expense;
  const prevMonthSavings = prevMonth.income - prevMonth.expense;
  const savingsRate = currentMonth.income > 0 ? Number(((currentMonthSavings / currentMonth.income) * 100).toFixed(1)) : 0;

  return success(res, 200, 'Dashboard summary fetched', {
    totalBalance,
    totalIncome: allTime.income,
    totalExpenses: allTime.expense,
    totalSavings: totalBalance,
    savingsRate,
    currentMonth: {
      income: currentMonth.income,
      expenses: currentMonth.expense,
      savings: currentMonthSavings,
      incomeChangePct: pctChange(currentMonth.income, prevMonth.income),
      expenseChangePct: pctChange(currentMonth.expense, prevMonth.expense),
      savingsChangePct: pctChange(currentMonthSavings, prevMonthSavings),
    },
  });
});

// @desc  Daily income/expense series for the current (or requested) month
// @route GET /api/dashboard/monthly
const getMonthlyBreakdown = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || now.getMonth() + 1;

  const rows = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
        date: { $gte: startOfMonth(year, month), $lte: endOfMonth(year, month) },
      },
    },
    {
      $group: {
        _id: { day: { $dayOfMonth: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.day': 1 } },
  ]);

  const daysInMonth = endOfMonth(year, month).getDate();
  const series = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, income: 0, expense: 0 }));
  rows.forEach((r) => {
    series[r._id.day - 1][r._id.type] = r.total;
  });

  return success(res, 200, 'Monthly breakdown fetched', { year, month, series });
});

// @desc  Expense totals grouped by category for the current (or requested) month
// @route GET /api/dashboard/categories
const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
  const type = req.query.type === 'income' ? 'income' : 'expense';

  const rows = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
        type,
        date: { $gte: startOfMonth(year, month), $lte: endOfMonth(year, month) },
      },
    },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    {
      $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' },
    },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        name: '$category.name',
        icon: '$category.icon',
        color: '$category.color',
        total: 1,
        count: 1,
      },
    },
    { $sort: { total: -1 } },
  ]);

  return success(res, 200, 'Category breakdown fetched', { year, month, type, breakdown: rows });
});

module.exports = { getSummary, getMonthlyBreakdown, getCategoryBreakdown };
