/**
 * Seed script.
 *   node seed/seed.js       -> creates default categories/payment methods for a demo user
 *   node seed/seed.js -d    -> destroys all data for the demo user
 *
 * Never runs automatically; must be invoked manually. Safe to run against a fresh
 * MongoDB Atlas cluster or local MongoDB instance.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const PaymentMethod = require('../models/PaymentMethod');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const { seedDefaultsForUser } = require('../services/defaultsService');

const DEMO_EMAIL = 'demo@personalfinance.app';
const DEMO_PASSWORD = 'Demo@1234';

const destroy = async () => {
  const user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    console.log('No demo user found, nothing to destroy.');
    return;
  }
  await Promise.all([
    Transaction.deleteMany({ user: user._id }),
    Category.deleteMany({ user: user._id }),
    PaymentMethod.deleteMany({ user: user._id }),
    Budget.deleteMany({ user: user._id }),
    Goal.deleteMany({ user: user._id }),
  ]);
  await user.deleteOne();
  console.log('Demo user and all related data destroyed.');
};

const seed = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('Refusing to seed demo data in production. Set NODE_ENV to development to proceed.');
    return;
  }

  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({ name: 'Demo User', email: DEMO_EMAIL, password: DEMO_PASSWORD });
    await seedDefaultsForUser(user._id);
    console.log(`Demo user created: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } else {
    console.log('Demo user already exists, skipping creation.');
  }

  const categories = await Category.find({ user: user._id });
  const paymentMethods = await PaymentMethod.find({ user: user._id });
  const foodCategory = categories.find((c) => c.name === 'Food' && c.type === 'expense');
  const salaryCategory = categories.find((c) => c.name === 'Salary' && c.type === 'income');
  const upi = paymentMethods.find((p) => p.name === 'UPI');
  const bankTransfer = paymentMethods.find((p) => p.name === 'Bank Transfer');

  const existingTx = await Transaction.countDocuments({ user: user._id });
  if (existingTx === 0 && foodCategory && salaryCategory && upi && bankTransfer) {
    await Transaction.insertMany([
      { user: user._id, type: 'income', amount: 45000, category: salaryCategory._id, paymentMethod: bankTransfer._id, description: 'Monthly salary', date: new Date() },
      { user: user._id, type: 'expense', amount: 150, category: foodCategory._id, paymentMethod: upi._id, description: 'Lunch', date: new Date() },
    ]);
    console.log('Sample transactions created.');
  }

  console.log('Seed complete.');
};

const run = async () => {
  await connectDB();
  const destroyFlag = process.argv.includes('-d');
  if (destroyFlag) {
    await destroy();
  } else {
    await seed();
  }
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
