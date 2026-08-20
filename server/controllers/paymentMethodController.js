const asyncHandler = require('express-async-handler');
const PaymentMethod = require('../models/PaymentMethod');
const Transaction = require('../models/Transaction');
const { success } = require('../utils/formatResponse');

const getPaymentMethods = asyncHandler(async (req, res) => {
  const methods = await PaymentMethod.find({ user: req.user._id }).sort({ name: 1 });
  return success(res, 200, 'Payment methods fetched', { paymentMethods: methods });
});

const createPaymentMethod = asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  const exists = await PaymentMethod.findOne({ user: req.user._id, name });
  if (exists) {
    res.status(400);
    throw new Error('This payment method already exists');
  }
  const method = await PaymentMethod.create({ user: req.user._id, name, icon });
  return success(res, 201, 'Payment method created', { paymentMethod: method });
});

const updatePaymentMethod = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findOne({ _id: req.params.id, user: req.user._id });
  if (!method) {
    res.status(404);
    throw new Error('Payment method not found');
  }
  const { name, icon } = req.body;
  if (name !== undefined) method.name = name;
  if (icon !== undefined) method.icon = icon;
  await method.save();
  return success(res, 200, 'Payment method updated', { paymentMethod: method });
});

const deletePaymentMethod = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findOne({ _id: req.params.id, user: req.user._id });
  if (!method) {
    res.status(404);
    throw new Error('Payment method not found');
  }
  const usageCount = await Transaction.countDocuments({ user: req.user._id, paymentMethod: method._id });
  if (usageCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete: used by ${usageCount} transaction(s)`);
  }
  await method.deleteOne();
  return success(res, 200, 'Payment method deleted');
});

module.exports = { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod };
