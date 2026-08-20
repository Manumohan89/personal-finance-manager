const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { success } = require('../utils/formatResponse');
const { startOfMonth, endOfMonth, startOfYear, endOfYear } = require('../utils/dateRanges');
const { buildInsights } = require('../services/insightsService');

// @desc  Full monthly report: totals, category breakdown, daily series, insights
// @route GET /api/reports/monthly
const getMonthlyReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const range = { $gte: startOfMonth(year, month), $lte: endOfMonth(year, month) };

  const [totalsRows, categoryRows, dailyRows] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, date: range } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: range } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, name: '$category.name', color: '$category.color', total: 1 } },
      { $sort: { total: -1 } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, date: range } },
      { $group: { _id: { day: { $dayOfMonth: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totals = { income: 0, expense: 0 };
  totalsRows.forEach((r) => { totals[r._id] = r.total; });

  const daysInMonth = endOfMonth(year, month).getDate();
  const dailySeries = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, income: 0, expense: 0 }));
  dailyRows.forEach((r) => { dailySeries[r._id.day - 1][r._id.type] = r.total; });

  const insights = await buildInsights(req.user._id, year, month);

  return success(res, 200, 'Monthly report fetched', {
    year,
    month,
    income: totals.income,
    expenses: totals.expense,
    savings: totals.income - totals.expense,
    savingsRate: totals.income > 0 ? Number((((totals.income - totals.expense) / totals.income) * 100).toFixed(1)) : 0,
    categoryBreakdown: categoryRows,
    dailySeries,
    insights,
  });
});

// @desc  Full yearly report: per-month totals + best/worst months
// @route GET /api/reports/yearly
const getYearlyReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const rows = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: startOfYear(year), $lte: endOfYear(year) } } },
    { $group: { _id: { month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
  ]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expense: 0,
    savings: 0,
  }));
  rows.forEach((r) => {
    months[r._id.month - 1][r._id.type] = r.total;
  });
  months.forEach((m) => { m.savings = m.income - m.expense; });

  const totalIncome = months.reduce((s, m) => s + m.income, 0);
  const totalExpenses = months.reduce((s, m) => s + m.expense, 0);
  const monthsWithActivity = months.filter((m) => m.income > 0 || m.expense > 0);
  const bestSavingMonth = monthsWithActivity.length
    ? monthsWithActivity.reduce((best, m) => (m.savings > best.savings ? m : best))
    : null;
  const highestExpenseMonth = monthsWithActivity.length
    ? monthsWithActivity.reduce((worst, m) => (m.expense > worst.expense ? m : worst))
    : null;

  return success(res, 200, 'Yearly report fetched', {
    year,
    months,
    totalIncome,
    totalExpenses,
    totalSavings: totalIncome - totalExpenses,
    averageMonthlySavings: Number(((totalIncome - totalExpenses) / 12).toFixed(2)),
    bestSavingMonth: bestSavingMonth ? bestSavingMonth.month : null,
    highestExpenseMonth: highestExpenseMonth ? highestExpenseMonth.month : null,
  });
});

// @desc  Category report across a custom date range
// @route GET /api/reports/categories
const getCategoryReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, type = 'expense' } = req.query;
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const match = { user: userId, type };
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  const rows = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { _id: 0, categoryId: '$_id', name: '$category.name', color: '$category.color', icon: '$category.icon', total: 1, count: 1 } },
    { $sort: { total: -1 } },
  ]);

  return success(res, 200, 'Category report fetched', { breakdown: rows });
});

// @desc  Payment method report across a custom date range
// @route GET /api/reports/payment-methods
const getPaymentMethodReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const match = { user: userId };
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  const rows = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $lookup: { from: 'paymentmethods', localField: '_id', foreignField: '_id', as: 'method' } },
    { $unwind: '$method' },
    { $project: { _id: 0, methodId: '$_id', name: '$method.name', icon: '$method.icon', total: 1, count: 1 } },
    { $sort: { total: -1 } },
  ]);

  return success(res, 200, 'Payment method report fetched', { breakdown: rows });
});

module.exports = { getMonthlyReport, getYearlyReport, getCategoryReport, getPaymentMethodReport };
