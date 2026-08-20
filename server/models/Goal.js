const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Goal name is required'], trim: true, maxlength: 100 },
    targetAmount: { type: Number, required: true, min: [1, 'Target must be greater than 0'] },
    currentAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    icon: { type: String, default: 'Target' },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

goalSchema.index({ user: 1, isCompleted: 1 });

module.exports = mongoose.model('Goal', goalSchema);
