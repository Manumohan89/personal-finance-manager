const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod', required: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    isActive: { type: Boolean, default: true },
    lastGeneratedDate: { type: Date, default: null }, // last period an occurrence was created for
  },
  { timestamps: true }
);

recurringTransactionSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('RecurringTransaction', recurringTransactionSchema);
