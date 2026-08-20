const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true, index: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0.01, 'Amount must be greater than 0'] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod', required: true },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    date: { type: Date, required: true, default: Date.now, index: true },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
    isRecurring: { type: Boolean, default: false },
    recurringId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringTransaction', default: null },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ description: 'text', notes: 'text' });

module.exports = mongoose.model('Transaction', transactionSchema);
