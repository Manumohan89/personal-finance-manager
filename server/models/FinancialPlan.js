const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const financialPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planName: { type: String, required: [true, 'Plan name is required'], trim: true, maxlength: 100 },
    initialAmount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    allocations: { type: [allocationSchema], default: [] },
  },
  { timestamps: true }
);

financialPlanSchema.virtual('totalAllocated').get(function totalAllocated() {
  return this.allocations.reduce((sum, a) => sum + a.amount, 0);
});

financialPlanSchema.virtual('remaining').get(function remaining() {
  return this.initialAmount - this.allocations.reduce((sum, a) => sum + a.amount, 0);
});

financialPlanSchema.set('toJSON', { virtuals: true });
financialPlanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FinancialPlan', financialPlanSchema);
