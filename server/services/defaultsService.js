const Category = require('../models/Category');
const PaymentMethod = require('../models/PaymentMethod');

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', icon: 'UtensilsCrossed', color: '#F97316' },
  { name: 'Transport', icon: 'Car', color: '#3B82F6' },
  { name: 'Hostel', icon: 'Building2', color: '#8B5CF6' },
  { name: 'Education', icon: 'GraduationCap', color: '#0EA5E9' },
  { name: 'Bills', icon: 'Receipt', color: '#EF4444' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899' },
  { name: 'Entertainment', icon: 'Clapperboard', color: '#A855F7' },
  { name: 'Health', icon: 'HeartPulse', color: '#22C55E' },
  { name: 'Personal', icon: 'User', color: '#14B8A6' },
  { name: 'Travel', icon: 'Plane', color: '#06B6D4' },
  { name: 'Groceries', icon: 'ShoppingCart', color: '#84CC16' },
  { name: 'Subscriptions', icon: 'Repeat', color: '#F59E0B' },
  { name: 'Other', icon: 'MoreHorizontal', color: '#6B7280' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'Wallet', color: '#22C55E' },
  { name: 'Freelance', icon: 'Laptop', color: '#0EA5E9' },
  { name: 'Business', icon: 'Briefcase', color: '#6366F1' },
  { name: 'Allowance', icon: 'HandCoins', color: '#F59E0B' },
  { name: 'Investment', icon: 'TrendingUp', color: '#14B8A6' },
  { name: 'Other', icon: 'MoreHorizontal', color: '#6B7280' },
];

const DEFAULT_PAYMENT_METHODS = [
  { name: 'Cash', icon: 'Banknote' },
  { name: 'UPI', icon: 'Smartphone' },
  { name: 'Debit Card', icon: 'CreditCard' },
  { name: 'Credit Card', icon: 'CreditCard' },
  { name: 'Bank Transfer', icon: 'Landmark' },
  { name: 'Other', icon: 'Wallet' },
];

/**
 * Seeds default categories and payment methods for a newly registered user.
 * Runs once at registration; users can still edit/delete afterwards.
 */
const seedDefaultsForUser = async (userId) => {
  const categoryDocs = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, user: userId, type: 'expense', isDefault: true })),
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, user: userId, type: 'income', isDefault: true })),
  ];
  const paymentDocs = DEFAULT_PAYMENT_METHODS.map((p) => ({ ...p, user: userId, isDefault: true }));

  await Category.insertMany(categoryDocs, { ordered: false }).catch(() => {});
  await PaymentMethod.insertMany(paymentDocs, { ordered: false }).catch(() => {});
};

module.exports = {
  seedDefaultsForUser,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
};
