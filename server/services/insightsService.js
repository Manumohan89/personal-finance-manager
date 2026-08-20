const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { startOfMonth, endOfMonth, previousMonth } = require('../utils/dateRanges');

/**
 * Builds a list of plain-language financial insights for a given month, computed
 * entirely from the user's real transaction/budget data (no hard-coded stats).
 */
const buildInsights = async (userId, year, month) => {
  const uid = new mongoose.Types.ObjectId(userId);
  const prev = previousMonth(year, month);
  const insights = [];

  const [currentCats, prevCats, budgets, currentTotals, daysElapsed] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: uid, type: 'expense', date: { $gte: startOfMonth(year, month), $lte: endOfMonth(year, month) } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, name: '$category.name', total: 1 } },
    ]),
    Transaction.aggregate([
      { $match: { user: uid, type: 'expense', date: { $gte: startOfMonth(prev.year, prev.month), $lte: endOfMonth(prev.year, prev.month) } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, name: '$category.name', total: 1 } },
    ]),
    Budget.find({ user: userId, year, month }).populate('category', 'name'),
    Transaction.aggregate([
      { $match: { user: uid, date: { $gte: startOfMonth(year, month), $lte: endOfMonth(year, month) } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Promise.resolve(
      Math.min(new Date().getDate(), endOfMonth(year, month).getDate())
    ),
  ]);

  // Category month-over-month change
  const prevMap = Object.fromEntries(prevCats.map((c) => [c.name, c.total]));
  currentCats.forEach((c) => {
    const prevTotal = prevMap[c.name] || 0;
    if (prevTotal > 0) {
      const changePct = Math.round(((c.total - prevTotal) / prevTotal) * 100);
      if (Math.abs(changePct) >= 15) {
        insights.push({
          type: changePct > 0 ? 'warning' : 'positive',
          message: `You spent ${Math.abs(changePct)}% ${changePct > 0 ? 'more' : 'less'} on ${c.name} this month.`,
        });
      }
    }
  });

  // Highest expense category
  if (currentCats.length > 0) {
    const top = currentCats.reduce((a, b) => (b.total > a.total ? b : a));
    insights.push({ type: 'info', message: `${top.name} is your highest expense category this month.` });
  }

  // Budget status
  for (const b of budgets) {
    const spentAgg = await Transaction.aggregate([
      {
        $match: {
          user: uid,
          category: b.category._id,
          type: 'expense',
          date: { $gte: startOfMonth(year, month), $lte: endOfMonth(year, month) },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const spent = spentAgg[0]?.total || 0;
    const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    if (pct >= 100) {
      insights.push({ type: 'danger', message: `You have exceeded your ${b.category.name} budget.` });
    } else if (pct >= 80) {
      insights.push({ type: 'warning', message: `${b.category.name} budget is ${Math.round(pct)}% used.` });
    }
  }

  // Savings rate change
  const totals = { income: 0, expense: 0 };
  currentTotals.forEach((r) => { totals[r._id] = r.total; });
  if (totals.income > 0) {
    const savingsRate = ((totals.income - totals.expense) / totals.income) * 100;
    insights.push({ type: 'info', message: `Your savings rate this month is ${savingsRate.toFixed(1)}%.` });
  }

  // Average daily spending
  if (daysElapsed > 0 && totals.expense > 0) {
    const avgDaily = totals.expense / daysElapsed;
    insights.push({ type: 'info', message: `Your average daily spending this month is ₹${Math.round(avgDaily).toLocaleString('en-IN')}.` });
  }

  return insights;
};

module.exports = { buildInsights };
