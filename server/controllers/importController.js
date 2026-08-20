const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const PaymentMethod = require('../models/PaymentMethod');
const { success } = require('../utils/formatResponse');

// Parses a simple CSV body. Expects header: Date,Type,Category,Amount,Payment Method,Description,Notes
const parseCsv = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    // naive CSV split that respects quoted commas
    const matches = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    const cols = matches.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
    rows.push(cols);
  }
  return rows;
};

// @desc  Import transactions from CSV text
// @route POST /api/transactions/import
const importTransactions = asyncHandler(async (req, res) => {
  const { csv } = req.body;
  if (!csv || typeof csv !== 'string') {
    res.status(400);
    throw new Error('CSV content is required');
  }

  const rows = parseCsv(csv);
  const [categories, paymentMethods] = await Promise.all([
    Category.find({ user: req.user._id }),
    PaymentMethod.find({ user: req.user._id }),
  ]);
  const catMap = new Map(categories.map((c) => [`${c.name.toLowerCase()}|${c.type}`, c._id]));
  const pmMap = new Map(paymentMethods.map((p) => [p.name.toLowerCase(), p._id]));

  const successful = [];
  const failed = [];

  rows.forEach((row, idx) => {
    const [dateStr, type, categoryName, amountStr, paymentMethodName, description, notes] = row;
    const rowNum = idx + 2; // account for header row

    const date = new Date(dateStr);
    const amount = parseFloat(amountStr);
    const normalizedType = (type || '').toLowerCase().trim();

    if (Number.isNaN(date.getTime())) {
      failed.push({ row: rowNum, reason: 'Invalid date' });
      return;
    }
    if (!['income', 'expense'].includes(normalizedType)) {
      failed.push({ row: rowNum, reason: 'Type must be income or expense' });
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      failed.push({ row: rowNum, reason: 'Invalid amount' });
      return;
    }
    const categoryId = catMap.get(`${(categoryName || '').toLowerCase()}|${normalizedType}`);
    if (!categoryId) {
      failed.push({ row: rowNum, reason: `Unknown category: ${categoryName}` });
      return;
    }
    const paymentMethodId = pmMap.get((paymentMethodName || '').toLowerCase());
    if (!paymentMethodId) {
      failed.push({ row: rowNum, reason: `Unknown payment method: ${paymentMethodName}` });
      return;
    }

    successful.push({
      user: req.user._id,
      type: normalizedType,
      amount,
      category: categoryId,
      paymentMethod: paymentMethodId,
      description: description || '',
      notes: notes || '',
      date,
    });
  });

  if (successful.length > 0) {
    await Transaction.insertMany(successful);
  }

  return success(res, 200, `Imported ${successful.length} transaction(s), ${failed.length} failed`, {
    importedCount: successful.length,
    failedCount: failed.length,
    failedRows: failed,
  });
});

module.exports = { importTransactions };
