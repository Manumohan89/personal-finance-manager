const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    icon: { type: String, default: 'Wallet' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paymentMethodSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
