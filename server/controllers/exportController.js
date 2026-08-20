const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');

const escapeCsv = (val) => {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// @desc  Export transactions as CSV (optionally filtered by date range)
// @route GET /api/transactions/export
const exportTransactions = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = { user: req.user._id };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const transactions = await Transaction.find(filter)
    .populate('category', 'name')
    .populate('paymentMethod', 'name')
    .sort({ date: -1 });

  const header = ['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Description', 'Notes'];
  const rows = transactions.map((t) => [
    t.date.toISOString().split('T')[0],
    t.type,
    t.category?.name || '',
    t.amount,
    t.paymentMethod?.name || '',
    t.description || '',
    t.notes || '',
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="transactions-${Date.now()}.csv"`);
  res.status(200).send(csv);
});

module.exports = { exportTransactions };
